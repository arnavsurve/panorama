import os
import random
import re
from typing import Any, Dict, List, Optional
from datetime import datetime
import logging
from urllib.parse import urlparse

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from bs4 import BeautifulSoup
import hashlib
import nest_asyncio

# Enable nested asyncio for concurrent scraping
nest_asyncio.apply()

# Set up logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get API keys from environment variables
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MONGODB_URL = os.getenv("MONGODB_URL")

if not PERPLEXITY_API_KEY:
    logger.warning("PERPLEXITY_API_KEY environment variable not set")
if not OPENAI_API_KEY:
    logger.warning("OPENAI_API_KEY environment variable not set")
if not MONGODB_URL:
    logger.warning("MONGODB_URL environment variable not set")
    MONGODB_URL = "mongodb://localhost:27017/news_panorama"  # Default fallback

try:
    # Import metadata extraction module
    from metadata_extraction import extract_metadata
    logger.info("Imported metadata extraction module")
except ImportError:
    logger.warning("Could not import metadata extraction module, will use basic extraction")
    async def extract_metadata(text, title, url, api_key):
        return {"title": title, "url": url}

# Initialize FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MongoDB connection
try:
    mongo_client = AsyncIOMotorClient(MONGODB_URL)
    db = mongo_client.get_default_database()  # or client['your_db_name']
    sources_collection = db.sources  # Collection to store news responses
    queries_collection = db.queries  # Collection to store queries
    logger.info(f"Connected to MongoDB database: {db.name}")
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {str(e)}")
    raise

# Define request and response models
class NewsRequest(BaseModel):
    query: str
    limit: Optional[int] = 12  # Default to 12 articles
    api_key: Optional[str] = None

class FollowUpRequest(BaseModel):
    question: str

class NewsSource(BaseModel):
    title: str
    url: str
    source_name: str
    political_leaning: str
    political_score: Optional[float] = None
    snippet: Optional[str] = None
    published_date: Optional[str] = None
    domain: Optional[str] = None
    favicon_url: Optional[str] = None
    og_image: Optional[str] = None
    text: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class NewsResponse(BaseModel):
    query: str
    sources: List[NewsSource]
    statistics: Dict[str, int]
    timeline_positioning: Optional[Dict[str, float]] = None

# Helper function to clean up formatting in titles, source names, and snippets
def clean_source_formatting(source_data: Dict[str, Any]) -> Dict[str, Any]:
    """Clean up formatting issues in source data."""
    # Make a copy to avoid modifying the original
    cleaned = dict(source_data)
    
    # Clean up the title
    if cleaned.get("title"):
        cleaned["title"] = re.sub(r'^(Article Title:?\s*|Title:?\s*)', '', cleaned["title"]).strip()
        # If title is empty after cleaning, use a default based on domain
        if not cleaned["title"] and cleaned.get("domain"):
            cleaned["title"] = f"Article from {cleaned['domain']}"
        elif not cleaned["title"] and cleaned.get("source_name"):
            cleaned["title"] = f"Article from {cleaned['source_name']}"
    
    # If title is still empty or very short, try to extract from URL
    if (not cleaned.get("title") or len(cleaned.get("title", "")) < 5) and cleaned.get("url"):
        url = cleaned["url"]
        # Extract the last part of the URL path
        path = urlparse(url).path
        if path:
            # Remove file extensions and trailing numbers
            slug = path.rstrip('/').split('/')[-1]
            slug = re.sub(r'\.(html|php|aspx|jsp)$', '', slug)
            slug = re.sub(r'-\d+$', '', slug)  # Remove trailing numbers after hyphen
            
            # Convert slug to readable title
            if slug and '-' in slug:
                words = [word.capitalize() for word in slug.split('-')]
                extracted_title = ' '.join(words)
                
                # Clean up common URL artifacts
                extracted_title = re.sub(r'(\d+)$', '', extracted_title).strip()
                
                # Use this title if it's reasonable
                if len(extracted_title) > 10 and len(extracted_title.split()) > 2:
                    cleaned["title"] = extracted_title
    
    # Clean up the source name
    if cleaned.get("source_name"):
        cleaned["source_name"] = re.sub(r'^(Name:?\s*\*\*|Source:?\s*)', '', cleaned["source_name"]).strip()
        cleaned["source_name"] = re.sub(r'\*\*$', '', cleaned["source_name"]).strip()
    
    # Clean up the snippet
    if cleaned.get("snippet"):
        cleaned["snippet"] = re.sub(r'\*\*(Summary|Brief Summary):?\s*\*\*', '', cleaned["snippet"]).strip()
        cleaned["snippet"] = re.sub(r'\*\*([^*]+)\*\*', '\1', cleaned["snippet"]).strip()
    
    return cleaned

@app.get("/")
async def root():
    return {"message": "News Political Spectrum API", "status": "running"}

@app.get("/debug/mongodb")
async def check_mongodb_connection():
    """Test MongoDB connection and return database stats."""
    try:
        # Check if we can connect
        await mongo_client.admin.command('ping')
        
        # Get database stats
        stats = await db.command('dbStats')
        
        # Get collection names
        collections = await db.list_collection_names()
        
        # Count documents in each collection
        collection_counts = {}
        for collection_name in collections:
            collection = db[collection_name]
            count = await collection.count_documents({})
            collection_counts[collection_name] = count
        
        return {
            "status": "MongoDB connection successful",
            "database_name": db.name,
            "stats": stats,
            "collections": collections,
            "collection_counts": collection_counts
        }
    except Exception as e:
        logger.error(f"MongoDB connection error: {str(e)}")
        return {
            "status": "MongoDB connection failed",
            "error": str(e)
        }

async def scrape_website(url: str) -> Dict[str, Any]:
    """
    Scrape a website URL and extract text content.
    """
    try:
        logger.info(f"Scraping website: {url}")
        
        # Use httpx for async HTTP requests
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            html_content = response.text
        
        # Parse HTML with BeautifulSoup
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Extract text content
        for script in soup(["script", "style"]):
            script.extract()
            
        text = soup.get_text(separator=" ", strip=True)
        
        # Extract title with enhanced debugging
        title = ""
        title_debug = {}
        
        # Special case for Fathom Journal
        if "fathomjournal.org" in url:
            logger.info(f"Detected Fathom Journal article: {url}")
            fathom_title_element = soup.select_one('h1.entry-title')
            if fathom_title_element:
                fathom_title = fathom_title_element.get_text(strip=True)
                title_debug["fathom_title"] = fathom_title
                title = fathom_title
                title_debug["selected_from"] = "fathom_journal_specific"
                logger.info(f"Extracted Fathom Journal title: '{title}'")
        
        # If no title in Fathom Journal format, try generic patterns
        if not title:
            # 1. Check for article/post specific title elements with more specific selectors
            article_title_candidates = [
                # Common article title classes
                soup.find(class_=lambda c: c and any(x in str(c).lower() for x in ['article-title', 'post-title', 'entry-title', 'headline', 'title-text', 'the-title'])),
                # Look for h2 inside div.the-title (common pattern)
                soup.select_one('div.the-title h2'),
                # Look for h1 inside article
                soup.find('article').find('h1') if soup.find('article') else None,
                # Look for h1 inside main
                soup.find('main').find('h1') if soup.find('main') else None,
                # Look for h1 inside header
                soup.find('header').find('h1') if soup.find('header') else None,
                # Look for first h1
                soup.find('h1'),
                # Look for first h2
                soup.find('h2'),
                # Look for specific div with title class
                soup.find('div', class_='the-title'),
            ]
            
            # Try to extract title from each candidate
            for i, candidate in enumerate(article_title_candidates):
                if candidate and candidate.get_text(strip=True):
                    candidate_text = candidate.get_text(strip=True)
                    title_debug[f"candidate_{i}"] = candidate_text
                    if not title and len(candidate_text) > 5:
                        title = candidate_text
                        title_debug["selected_from"] = f"candidate_{i}"
            
            # 2. Check Open Graph metadata
            og_title_tag = soup.find("meta", attrs={"property": "og:title"})
            if og_title_tag and og_title_tag.get("content"):
                og_title = og_title_tag.get("content")
                title_debug["og_title"] = og_title
                if (not title or len(title) < 10) and len(og_title) > 5:
                    title = og_title
                    title_debug["selected_from"] = "og_title"
            
            # 3. Fallback to page title
            if soup.title and soup.title.string:
                page_title = soup.title.string
                title_debug["page_title"] = page_title
                if (not title or len(title) < 10) and len(page_title) > 5:
                    title = page_title
                    title_debug["selected_from"] = "page_title"
            
            # 4. Try to extract from URL if still no title
            if not title or len(title) < 5:
                # Extract potential title from URL path
                path = urlparse(url).path
                if path:
                    path_parts = path.strip('/').split('/')
                    if path_parts:
                        last_part = path_parts[-1]
                        # Convert slug to readable title
                        if last_part and '-' in last_part:
                            url_title = ' '.join(word.capitalize() for word in re.sub(r'\d+$', '', last_part).split('-'))
                            title_debug["url_title"] = url_title
                            title = url_title
                            title_debug["selected_from"] = "url_title"
            
            # Log title extraction debug info
            logger.info(f"Title extraction debug for {url}: {title_debug}")
            
            # Extract Open Graph metadata
            og_title = None
            og_description = None
            og_image = None
            og_site_name = None
            
            og_title_tag = soup.find("meta", attrs={"property": "og:title"})
            if og_title_tag:
                og_title = og_title_tag.get("content")
                
            og_desc_tag = soup.find("meta", attrs={"property": "og:description"})
            if og_desc_tag:
                og_description = og_desc_tag.get("content")
                
            og_image_tag = soup.find("meta", attrs={"property": "og:image"})
            if og_image_tag:
                og_image = og_image_tag.get("content")
                
            og_site_tag = soup.find("meta", attrs={"property": "og:site_name"})
            if og_site_tag:
                og_site_name = og_site_tag.get("content")
            
            # Extract favicon
            favicon = None
            favicon_tag = soup.find("link", rel=lambda rel: rel and "icon" in rel.lower())
            if favicon_tag:
                favicon = favicon_tag.get("href")
                # Handle relative URLs
                if favicon and not favicon.startswith(('http://', 'https://')):
                    # Extract domain from URL
                    domain_match = re.search(r'https?://(?:www\.)?([^/]+)', url)
                    if domain_match:
                        domain = domain_match.group(0)
                        favicon = f"{domain.rstrip('/')}/{favicon.lstrip('/')}"
            
            # Extract publication date
            published_date = None
            try:
                date_tag = soup.find("meta", attrs={"property": "article:published_time"})
                if date_tag:
                    published_date = date_tag.get("content")
                
                if not published_date:
                    # Try other common date meta tags
                    date_tags = [
                        soup.find("meta", attrs={"property": "article:published_time"}),
                        soup.find("meta", attrs={"name": "publication_date"}),
                        soup.find("meta", attrs={"name": "publish_date"}),
                        soup.find("meta", attrs={"name": "date"}),
                        soup.find("time")
                    ]
                    
                    for tag in date_tags:
                        if tag:
                            date_content = tag.get("content") or tag.get("datetime")
                            if date_content:
                                published_date = date_content
                                break
            except Exception as e:
                logger.warning(f"Error extracting publication date: {str(e)}")
            
            # Extract domain
            domain = None
            domain_match = re.search(r'https?://(?:www\.)?([^/]+)', url)
            if domain_match:
                domain = domain_match.group(1)
            
            # Basic metadata dictionary
            metadata = {
                "title": title or og_title,
                "description": og_description,
                "site_name": og_site_name,
                "processed_date": datetime.now().isoformat()
            }
            
            # Skip OpenAI processing if no API key or if text is too short
            if OPENAI_API_KEY and len(text) > 200:
                try:
                    # Use the external metadata extraction function if imported
                    advanced_metadata = await extract_metadata(
                        text=text[:5000],  # Limit text to avoid token limits
                        title=title or og_title or "Untitled",
                        url=url,
                        api_key=OPENAI_API_KEY
                    )
                    
                    # Merge with basic metadata
                    metadata.update(advanced_metadata)
                    logger.info(f"Extracted advanced metadata for {url}")
                except Exception as e:
                    logger.error(f"Error extracting advanced metadata: {str(e)}")
                    metadata["extraction_error"] = str(e)
            
            return {
                "success": True,
                "url": url,
                "title": title or og_title or "Untitled",
                "text": text,
                "og_image": og_image,
                "favicon_url": favicon or f"https://www.google.com/s2/favicons?domain={domain}&sz=128",
                "published_date": published_date,
                "domain": domain,
                "metadata": metadata
            }
    except Exception as e:
        logger.error(f"Error scraping website {url}: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

async def get_articles_from_perplexity(query: str, political_leaning: str, api_key: str) -> List[Dict[str, Any]]:
    """
    Fetch articles from Perplexity API for a specific political leaning.
    """
    try:
        # Improved queries for better political balancing
        leaning_queries = {
            "left": [
                f"{query} from left-leaning or progressive news sources"
            ],
            "center": [
                f"{query} from center or neutral news sources"
            ],
            "right": [
                f"{query} from right-leaning or conservative news sources"
            ]
        }
        
        all_articles = []
        
        # Use the appropriate query for the political leaning
        for leaning_query in leaning_queries.get(political_leaning, [f"{query} from {political_leaning}-leaning news sources"]):
            logger.info(f"Querying Perplexity for {political_leaning}-leaning sources with query: '{leaning_query}'")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
                
                response = await client.post(
                    "https://api.perplexity.ai/chat/completions",
                    headers=headers,
                    json={
                        "model": "sonar",
                        "messages": [
                            {
                                "role": "system", 
                                "content": "You are a news collection assistant. Find recent news articles on the given topic. Include only factual articles from established news outlets. For each article, provide: 1) The exact article title, 2) The source name, 3) The complete article URL, and 4) A brief snippet or summary. Format each article as a separate bullet point or numbered item. Provide at least 5 articles if available."
                            },
                            {
                                "role": "user", 
                                "content": leaning_query
                            }
                        ]
                    }
                )
                
                if response.status_code != 200:
                    logger.error(f"Error from Perplexity API: {response.status_code}")
                    logger.error(response.text)
                    continue
                
                data = response.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                
                # Log the raw response for debugging
                logger.debug(f"Perplexity response for {political_leaning}: {content[:200]}...")
                
                # Extract URLs from the content
                url_pattern = re.compile(r'(https?://[^\s)\]]+)')
                urls = url_pattern.findall(content)
                
                # Process each URL to get context
                for url in urls:
                    # Get surrounding context
                    start_idx = max(0, content.find(url) - 300)
                    end_idx = min(len(content), content.find(url) + len(url) + 300)
                    context = content[start_idx:end_idx]
                    
                    # Try to find title 
                    title = ""
                    title_match = re.search(r'\*\*([^*]+)\*\*', context)
                    if title_match:
                        title = title_match.group(1).strip()
                    
                    # If no title in bold, look for potential title in the vicinity
                    if not title:
                        title_search = re.search(r'(?:^|\n|\*)([A-Z][^.\n]{10,100}(?:\.|\n|$))', 
                                                context[:context.find(url)])
                        if title_search:
                            title = title_search.group(1).strip()
                    
                    # Last resort for title
                    if not title:
                        title = f"Article about {query}"
                    
                    # Try to find source name
                    source = ""
                    source_match = re.search(r'(?:source|source\s*name)[\s:]+([^,\n]+)', context, re.IGNORECASE)
                    if source_match:
                        source = source_match.group(1).strip()
                    
                    # If no explicit source, try to extract from URL
                    if not source:
                        domain_match = re.search(r'https?://(?:www\.)?([^/]+)', url)
                        if domain_match:
                            source = domain_match.group(1)
                    
                    # Extract snippet
                    snippet = ""
                    snippet_match = re.search(r'snippet[\s:]+([^\n]+)', context, re.IGNORECASE)
                    if snippet_match:
                        snippet = snippet_match.group(1).strip()
                    
                    # If no explicit snippet, use some text after the URL
                    if not snippet:
                        after_url = context[content.find(url) + len(url):]
                        snippet_text = after_url[:min(150, len(after_url))]
                        if snippet_text:
                            snippet = snippet_text.strip()
                    
                    # Clean up the title, source name, and snippet
                    # Remove common prefixes from title
                    title = re.sub(r'^(Article Title:?\s*|Title:?\s*)', '', title).strip()
                    
                    # Remove common prefixes from source name
                    source = re.sub(r'^(Name:?\s*\*\*|Source:?\s*)', '', source).strip()
                    # Remove trailing asterisks if any
                    source = re.sub(r'\*\*$', '', source).strip()
                    
                    # Clean up snippet - remove markdown formatting
                    snippet = re.sub(r'\*\*(Summary|Brief Summary):?\s*\*\*', '', snippet).strip()
                    snippet = re.sub(r'\*\*([^*]+)\*\*', '\1', snippet).strip()
                    
                    # If we have at least a URL, add to articles
                    if url:
                        # Extract domain for favicon
                        domain = ""
                        domain_match = re.search(r'https?://(?:www\.)?([^/]+)', url)
                        if domain_match:
                            domain = domain_match.group(1)
                            
                        article = {
                            "title": title,
                            "url": url,
                            "source_name": source or "Unknown Source",
                            "snippet": snippet or "",
                            "domain": domain,
                            "favicon_url": f"https://www.google.com/s2/favicons?domain={domain}&sz=128",
                            "political_leaning": political_leaning
                        }
                        
                        all_articles.append(article)
        
        logger.info(f"Found {len(all_articles)} {political_leaning}-leaning articles")
        return all_articles
                
    except Exception as e:
        logger.error(f"Error fetching articles from Perplexity: {str(e)}")
        return []

@app.post("/query", response_model=NewsResponse)
async def query(request: NewsRequest):
    """
    Fetch news articles from across the political spectrum based on the query.
    """
    try:
        # Use API key from request if provided, otherwise use environment variable
        api_key = request.api_key or PERPLEXITY_API_KEY
        
        if not api_key:
            raise HTTPException(status_code=401, detail="API key is required")
        
        # Check if we have cached results for this query
        query_hash = hashlib.md5(request.query.encode()).hexdigest()
        cached_query = await queries_collection.find_one({"query_hash": query_hash})
        
        # Use cached results if available and less than 1 hour old
        if cached_query and (datetime.now() - datetime.fromisoformat(cached_query["timestamp"])).total_seconds() < 3600:
            logger.info(f"Using cached results for query: {request.query}")
            
            # Log the titles from cached results for debugging
            if cached_query.get("source_ids"):
                logger.info(f"Cached article titles:")
                from bson.objectid import ObjectId
                for i, source_id in enumerate(cached_query["source_ids"][:3]):
                    source = await sources_collection.find_one({"_id": ObjectId(source_id)})
                    if source:
                        logger.info(f"  {i+1}. Title: '{source.get('title', 'No title')}' | URL: {source.get('url', 'No URL')}")
            
            # Fetch the stored sources
            source_ids = cached_query.get("source_ids", [])
            sources = []
            
            if source_ids:
                from bson.objectid import ObjectId
                try:
                    # Convert string IDs to ObjectId
                    object_ids = [ObjectId(id) for id in source_ids if ObjectId.is_valid(id)]
                    
                    if object_ids:
                        cursor = sources_collection.find({"_id": {"$in": object_ids}})
                        sources_data = await cursor.to_list(length=100)
                        
                        for source_data in sources_data:
                            # Convert MongoDB _id to string for serialization
                            source_data["_id"] = str(source_data["_id"])
                            # Clean up formatting
                            cleaned_source = clean_source_formatting(source_data)
                            sources.append(NewsSource(**cleaned_source))
                except Exception as e:
                    logger.error(f"Error fetching cached sources: {str(e)}")
            
            # Limit sources to the requested number
            sources = sources[:request.limit]
            
            # Calculate statistics
            left_count = sum(1 for s in sources if s.political_leaning == "left")
            center_count = sum(1 for s in sources if s.political_leaning == "center")
            right_count = sum(1 for s in sources if s.political_leaning == "right")
            
            stats = {
                "total": len(sources),
                "left_count": left_count,
                "center_count": center_count,
                "right_count": right_count
            }
            
            # Calculate timeline positioning
            political_scores = [s.political_score for s in sources if s.political_score is not None]
            min_score = min(political_scores) if political_scores else 1.0
            max_score = max(political_scores) if political_scores else 10.0
            
            timeline_positioning = {
                "min_score": min_score,
                "max_score": max_score
            }
            
            return NewsResponse(
                query=request.query,
                sources=sources,
                statistics=stats,
                timeline_positioning=timeline_positioning
            )
        
        # If no cached results, proceed with API calls and scraping
        logger.info(f"Fetching new results for query: {request.query}")
        
        # Fetch articles from different political perspectives
        leanings = ["left", "center", "right"]
        all_articles = []
        
        # Fetch sources from Perplexity in parallel
        tasks = [get_articles_from_perplexity(request.query, leaning, api_key) for leaning in leanings]
        results = await asyncio.gather(*tasks)
        
        # Combine results
        for i, leaning_articles in enumerate(results):
            for article in leaning_articles:
                article["political_leaning"] = leanings[i]
                all_articles.append(article)
        
        # Remove duplicates based on URL
        unique_articles = []
        seen_urls = set()
        for article in all_articles:
            if article["url"] not in seen_urls:
                seen_urls.add(article["url"])
                
                # Assign political_score based on leaning
                if article["political_leaning"] == "left":
                    article["political_score"] = random.uniform(1.0, 4.0)
                elif article["political_leaning"] == "center":
                    article["political_score"] = random.uniform(4.0, 7.0)
                else:
                    article["political_score"] = random.uniform(7.0, 10.0)
                
                unique_articles.append(article)
        
        logger.info(f"Found {len(unique_articles)} unique articles")
        
        # Balance the sources across political leanings
        left_sources = [s for s in unique_articles if s["political_leaning"] == "left"]
        center_sources = [s for s in unique_articles if s["political_leaning"] == "center"]
        right_sources = [s for s in unique_articles if s["political_leaning"] == "right"]
        
        logger.info(f"Article distribution - Left: {len(left_sources)}, Center: {len(center_sources)}, Right: {len(right_sources)}")
        
        # Calculate how many of each to include to ensure balance
        per_category = max(1, request.limit // 3)
        
        balanced_sources = []
        balanced_sources.extend(left_sources[:per_category])
        balanced_sources.extend(center_sources[:per_category])
        balanced_sources.extend(right_sources[:per_category])
        
        # Fill up to the limit with any remaining sources
        remaining_slots = request.limit - len(balanced_sources)
        if remaining_slots > 0:
            all_remaining = (left_sources[per_category:] + 
                             center_sources[per_category:] + 
                             right_sources[per_category:])
            balanced_sources.extend(all_remaining[:remaining_slots])
        
        # Scrape content and metadata for each source - this can take time
        logger.info(f"Scraping content for {len(balanced_sources)} sources")
        
        # Limit concurrent scraping to avoid overwhelming servers
        semaphore = asyncio.Semaphore(5)  # Max 5 concurrent requests
        
        async def scrape_with_semaphore(source):
            async with semaphore:
                return await scrape_website(source["url"])
        
        # Use semaphore to limit concurrent scraping
        scrape_tasks = [scrape_with_semaphore(source) for source in balanced_sources]
        scrape_results = await asyncio.gather(*scrape_tasks)
        
        # Combine scraped data with source info
        enriched_sources = []
        source_ids = []
        
        for i, (source, scrape_result) in enumerate(zip(balanced_sources, scrape_results)):
            if scrape_result["success"]:
                # Merge source info with scraped data
                enriched_source = {
                    "title": scrape_result["title"] or source["title"],
                    "url": source["url"],
                    "source_name": source["source_name"],
                    "political_leaning": source["political_leaning"],
                    "political_score": source["political_score"],
                    "snippet": source["snippet"],
                    "text": scrape_result["text"],
                    "published_date": scrape_result.get("published_date"),
                    "domain": scrape_result.get("domain") or source.get("domain"),
                    "favicon_url": scrape_result.get("favicon_url") or source.get("favicon_url"),
                    "og_image": scrape_result.get("og_image"),
                    "metadata": scrape_result.get("metadata", {})
                }
                
                # Clean up formatting
                cleaned_source = clean_source_formatting(enriched_source)
                
                try:
                    # Store in MongoDB
                    result = await sources_collection.insert_one(cleaned_source)
                    source_id = str(result.inserted_id)
                    source_ids.append(source_id)
                    
                    # Convert MongoDB _id to string for response
                    cleaned_source["_id"] = source_id
                    enriched_sources.append(NewsSource(**cleaned_source))
                    logger.info(f"Stored source in MongoDB with ID: {source_id}")
                except Exception as e:
                    logger.error(f"Error storing source in MongoDB: {str(e)}")
                    # Still include the source in response even if MongoDB storage fails
                    cleaned_source["_id"] = "temp_" + hashlib.md5(source["url"].encode()).hexdigest()
                    enriched_sources.append(NewsSource(**cleaned_source))
            else:
                # If scraping failed, use original source with minimal data
                logger.warning(f"Scraping failed for {source['url']}: {scrape_result.get('error', 'Unknown error')}")
                fallback_source = {
                    "title": source["title"],
                    "url": source["url"],
                    "source_name": source["source_name"],
                    "political_leaning": source["political_leaning"],
                    "political_score": source["political_score"],
                    "snippet": source["snippet"],
                    "domain": source.get("domain"),
                    "favicon_url": source.get("favicon_url"),
                    "text": None,
                    "metadata": {"error": scrape_result.get("error", "Unknown error during scraping")}
                }
                
                # Clean up formatting
                cleaned_source = clean_source_formatting(fallback_source)
                
                try:
                    # Store in MongoDB
                    result = await sources_collection.insert_one(cleaned_source)
                    source_id = str(result.inserted_id)
                    source_ids.append(source_id)
                    
                    # Convert MongoDB _id to string for response
                    cleaned_source["_id"] = source_id
                    enriched_sources.append(NewsSource(**cleaned_source))
                except Exception as e:
                    logger.error(f"Error storing fallback source in MongoDB: {str(e)}")
                    # Still include the source in response even if MongoDB storage fails
                    cleaned_source["_id"] = "temp_" + hashlib.md5(source["url"].encode()).hexdigest()
                    enriched_sources.append(NewsSource(**cleaned_source))
        
        # Store the query and results in cache
        try:
            await queries_collection.insert_one({
                "query": request.query,
                "query_hash": query_hash,
                "timestamp": datetime.now().isoformat(),
                "source_ids": source_ids
            })
            logger.info(f"Cached query results for: {request.query}")
        except Exception as e:
            logger.error(f"Error caching query: {str(e)}")
        
        # Calculate statistics
        left_count = sum(1 for s in enriched_sources if s.political_leaning == "left")
        center_count = sum(1 for s in enriched_sources if s.political_leaning == "center")
        right_count = sum(1 for s in enriched_sources if s.political_leaning == "right")
        
        stats = {
            "total": len(enriched_sources),
            "left_count": left_count,
            "center_count": center_count,
            "right_count": right_count
        }
        
        # Calculate timeline positioning
        political_scores = [s.political_score for s in enriched_sources if s.political_score is not None]
        min_score = min(political_scores) if political_scores else 1.0
        max_score = max(political_scores) if political_scores else 10.0
        
        timeline_positioning = {
            "min_score": min_score,
            "max_score": max_score
        }
        
        logger.info(f"Returning {len(enriched_sources)} sources with stats: {stats}")
        
        # Log the titles from the results for debugging
        logger.info(f"Article titles:")
        for i, source in enumerate(enriched_sources[:3]):
            logger.info(f"  {i+1}. Title: '{source.get('title', 'No title')}' | URL: {source.get('url', 'No URL')}")
        
        return NewsResponse(
            query=request.query,
            sources=enriched_sources,
            statistics=stats,
            timeline_positioning=timeline_positioning
        )
            
    except Exception as e:
        logger.error(f"Uncaught exception in query endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/source/{source_id}")
async def get_source(source_id: str):
    """Retrieve a specific news source by ID."""
    try:
        from bson.objectid import ObjectId
        
        logger.info(f"Fetching source with ID: {source_id}")
        
        # Handle temporary IDs that may not be in MongoDB
        if source_id.startswith("temp_"):
            raise HTTPException(status_code=404, detail="Temporary source ID not found in database")
        
        # Validate the ID format
        if not ObjectId.is_valid(source_id):
            logger.warning(f"Invalid ObjectId format: {source_id}")
            raise HTTPException(status_code=400, detail="Invalid source ID format")
        
        object_id = ObjectId(source_id)
        
        # Try to find the source
        source = await sources_collection.find_one({"_id": object_id})
        
        if not source:
            logger.warning(f"Source not found with ID: {source_id}")
            raise HTTPException(status_code=404, detail="Source not found")
        
        # Convert MongoDB _id to string for response
        source["_id"] = str(source["_id"])
        
        logger.info(f"Successfully retrieved source: {source['title']}")
        return source
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_source: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/followup/{source_id}")
async def follow_up_question(source_id: str, request: FollowUpRequest):
    """Answer a follow-up question about a specific source using its content."""
    try:
        from bson.objectid import ObjectId
        
        logger.info(f"Processing follow-up question for source {source_id}: {request.question}")
        
        # Handle temporary IDs
        if source_id.startswith("temp_"):
            return {
                "question": request.question,
                "answer": "I can't answer questions about this source because its content hasn't been fully processed.",
                "source_id": source_id
            }
        
        # Validate the ID format
        if not ObjectId.is_valid(source_id):
            logger.warning(f"Invalid ObjectId format: {source_id}")
            return {
                "question": request.question,
                "answer": "Invalid source ID format",
                "source_id": source_id
            }
        
        # Retrieve the source from MongoDB
        source = await sources_collection.find_one({"_id": ObjectId(source_id)})
        
        if not source:
            logger.warning(f"Source not found with ID: {source_id}")
            return {
                "question": request.question,
                "answer": "Source not found",
                "source_id": source_id
            }
        
        # If the source has no text content, we can't answer questions
        if not source.get("text"):
            logger.warning(f"No text content for source: {source_id}")
            return {
                "question": request.question,
                "answer": "I don't have the full text content for this source to answer your question.",
                "source_id": source_id,
                "source_title": source.get("title"),
                "source_url": source.get("url")
            }
        
        # Simple keyword-based answering if OpenAI API key is not available
        if not OPENAI_API_KEY:
            logger.info("Using keyword-based answering (no OpenAI API key)")
            
            # Convert question to keywords
            keywords = request.question.lower().split()
            keywords = [k for k in keywords if len(k) > 3 and k not in {"what", "who", "where", "when", "why", "how", "is", "are", "the", "a", "an"}]
            
            # Find paragraphs containing keywords
            text = source.get("text", "")
            paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
            
            relevant_paragraphs = []
            for para in paragraphs:
                para_lower = para.lower()
                if any(keyword in para_lower for keyword in keywords):
                    relevant_paragraphs.append(para)
            
            if relevant_paragraphs:
                # Join the most relevant paragraphs (limit to avoid long responses)
                answer = '\n\n'.join(relevant_paragraphs[:2])
                
                # Truncate if too long
                if len(answer) > 500:
                    answer = answer[:500] + "..."
            else:
                answer = "I couldn't find specific information about this in the article content."
                
            return {
                "question": request.question,
                "answer": answer,
                "source_id": source_id,
                "source_title": source.get("title"),
                "source_url": source.get("url")
            }
        else:
            # Use OpenAI to generate an answer if API key is available
            logger.info("Using OpenAI for follow-up question")
            
            try:
                # Import OpenAI client
                from openai import OpenAI
                
                # Initialize client
                client = OpenAI(api_key=OPENAI_API_KEY)
                
                # Create prompt for OpenAI
                prompt = f"""
                Answer the following question based ONLY on the information in the text below.
                If the answer cannot be determined from the text, say so clearly.
                
                TEXT:
                {source.get("text")[:4000]}
                
                QUESTION: {request.question}
                
                ANSWER:
                """
                
                # Call OpenAI API
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a helpful assistant that answers questions based solely on the provided text."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.1,
                    max_tokens=300
                )
                
                # Extract answer from response
                answer = response.choices[0].message.content.strip()
                
                return {
                    "question": request.question,
                    "answer": answer,
                    "source_id": source_id,
                    "source_title": source.get("title"),
                    "source_url": source.get("url")
                }
            except Exception as e:
                logger.error(f"Error generating answer with OpenAI: {str(e)}")
                
                # Fallback to simple keyword matching
                return {
                    "question": request.question,
                    "answer": f"Sorry, I couldn't generate an answer: {str(e)}",
                    "source_id": source_id,
                    "source_title": source.get("title"),
                    "source_url": source.get("url")
                }
    except Exception as e:
        logger.error(f"Unexpected error in follow_up_question: {str(e)}")
        return {
            "question": request.question,
            "answer": f"An error occurred: {str(e)}",
            "source_id": source_id
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)