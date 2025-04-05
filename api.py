import re
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
import random
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key from environment variable
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
if not PERPLEXITY_API_KEY:
    raise ValueError("PERPLEXITY_API_KEY environment variable not set")

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define request and response models
class NewsRequest(BaseModel):
    query: str
    limit: Optional[int] = 9  # Default to 9 articles (3 from each leaning)
    api_key: Optional[str] = None

class ArticlePreviewRequest(BaseModel):
    url: str

class NewsSource(BaseModel):
    title: str
    url: str
    source_name: str
    political_leaning: str
    political_score: Optional[float] = None
    domain: Optional[str] = None
    favicon_url: Optional[str] = None
    og_image: Optional[str] = None
    snippet: Optional[str] = None
    published_date: Optional[str] = None

class NewsResponse(BaseModel):
    query: str
    sources: List[NewsSource]
    statistics: Dict[str, int]
    timeline_positioning: Optional[Dict[str, float]] = None

@app.get("/")
async def root():
    return {"message": "Hello World"}

def extract_articles_from_text(content, query):
    """Extract article information with enhanced metadata."""
    articles = []
    
    # Try to extract by URL first (most reliable method)
    url_pattern = re.compile(r'(https?://[^\s)\]]+)')
    urls = url_pattern.findall(content)
    
    # If we found URLs
    if urls:
        for url in urls:
            # Get surrounding context
            start_idx = max(0, content.find(url) - 500)
            end_idx = min(len(content), content.find(url) + len(url) + 500)
            context = content[start_idx:end_idx]
            
            # Try to find title 
            title = ""
            # Try to find title in markdown bold format
            title_match = re.search(r'\*\*([^*]+)\*\*', context)
            if title_match:
                title = title_match.group(1).strip()
            
            # If no title in bold, look for potential title in the vicinity
            if not title:
                # Look for title-like pattern (capitalized text near the URL)
                title_search = re.search(r'(?:^|\n|\*)([A-Z][^.\n]{10,100}(?:\.|\n|$))', 
                                        context[:context.find(url)])
                if title_search:
                    title = title_search.group(1).strip()
            
            # Last resort for title
            if not title:
                # Just use any text near the URL that might be a title
                title = f"Article about {query}"
            
            # Try to find source name
            source = ""
            # Look for "Source" or "Source Name" in the context
            source_match = re.search(r'(?:source|source\s*name)[\s:]+([^,\n]+)', context, re.IGNORECASE)
            if source_match:
                source = source_match.group(1).strip()
            
            # If no explicit source, try to extract from URL
            if not source:
                domain_match = re.search(r'https?://(?:www\.)?([^/]+)', url)
                if domain_match:
                    source = domain_match.group(1)
            
            # Extract domain for favicon
            domain = ""
            domain_match = re.search(r'https?://(?:www\.)?([^/]+)', url)
            if domain_match:
                domain = domain_match.group(1)
            
            # Extract snippet
            snippet = ""
            # Look for "Snippet" in the context
            snippet_match = re.search(r'snippet[\s:]+([^\n]+)', context, re.IGNORECASE)
            if snippet_match:
                snippet = snippet_match.group(1).strip()
            
            # If no explicit snippet, use some text after the URL
            if not snippet:
                after_url = context[context.find(url) + len(url):]
                # Take first sentence or 150 chars
                snippet_text = after_url[:min(500, len(after_url))]
                if snippet_text:
                    snippet = snippet_text.strip()
            
            # Extract published date
            published_date = ""
            date_match = re.search(r'(?:published|date)[\s:]+([^\n,]+\d{4})', context, re.IGNORECASE)
            if date_match:
                published_date = date_match.group(1).strip()
            
            # If we have at least a URL and title or source, add to articles
            if url and (title or source):
                articles.append({
                    "title": title,
                    "url": url,
                    "source_name": source or "Unknown Source",
                    "domain": domain,
                    "favicon_url": f"https://www.google.com/s2/favicons?domain={domain}&sz=128",
                    "snippet": snippet or "No snippet available",
                    "published_date": published_date,
                    "og_image": ""  # Will be populated later
                })
    
    # If no URLs found, try to parse bullet points or numbered lists
    if not articles:
        # Look for list items that might contain article info
        list_items = re.findall(r'(?:\n\d+\.|\n[-*+])\s+(.+?)(?=\n\d+\.|\n[-*+]|\Z)', content, re.DOTALL)
        
        for item in list_items:
            # If item contains a URL, that's a good sign it's an article
            url_match = url_pattern.search(item)
            if url_match:
                url = url_match.group(0)
                
                # Extract title (first sentence or bold text)
                title = ""
                title_match = re.search(r'\*\*([^*]+)\*\*', item)
                if title_match:
                    title = title_match.group(1).strip()
                else:
                    # First sentence might be the title
                    title_search = re.search(r'^([^.]+)', item)
                    if title_search:
                        title = title_search.group(1).strip()
                
                source = ""
                source_match = re.search(r'(?:source|source\s*name)[\s:]+([^,\n]+)', item, re.IGNORECASE)
                if source_match:
                    source = source_match.group(1).strip()
                
                if not source:
                    domain_match = re.search(r'https?://(?:www\.)?([^/]+)', url)
                    if domain_match:
                        source = domain_match.group(1)
                
                # Extract domain
                domain = ""
                domain_match = re.search(r'https?://(?:www\.)?([^/]+)', url)
                if domain_match:
                    domain = domain_match.group(1)
                
                # Extract snippet (text after title)
                snippet = ""
                if title and title in item:
                    snippet = item[item.find(title) + len(title):].strip()
                    if snippet.startswith('.'):
                        snippet = snippet[1:].strip()
                
                # Extract date
                published_date = ""
                date_match = re.search(r'(?:published|date)[\s:]+([^\n,]+\d{4})', item, re.IGNORECASE)
                if date_match:
                    published_date = date_match.group(1).strip()
                
                # Add article if we have enough info
                if url and (title or source):
                    articles.append({
                        "title": title or f"Article about {query}",
                        "url": url,
                        "source_name": source or "Unknown Source",
                        "domain": domain,
                        "favicon_url": f"https://www.google.com/s2/favicons?domain={domain}&sz=128",
                        "snippet": snippet or "No snippet available",
                        "published_date": published_date,
                        "og_image": ""
                    })
    
    # Remove duplicates based on URL
    unique_articles = []
    seen_urls = set()
    for article in articles:
        if article["url"] not in seen_urls:
            seen_urls.add(article["url"])
            unique_articles.append(article)
    
    return unique_articles

@app.post("/query")
async def query(request: NewsRequest):
    """
    Fetch news articles from across the political spectrum based on the query.
    
    The endpoint returns articles from left, center, and right-leaning sources,
    providing a balanced perspective on the topic.
    """
    try:
        # Use API key from request if provided, otherwise use environment variable
        api_key = request.api_key or PERPLEXITY_API_KEY
        
        if not api_key:
            raise HTTPException(status_code=401, detail="API key is required")
        
        # Validate and adjust the limit parameter
        limit = min(max(3, request.limit), 18)  # Keep between 3 and 18
        
        # Set up async client
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Call Perplexity Sonar API
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            # Construct different queries to ensure political diversity
            queries = [
                f"{request.query} from left-leaning news sources", 
                f"{request.query} from center or neutral news sources", 
                f"{request.query} from right-leaning news sources"
            ]
            
            all_sources = []
            raw_content = {}  # Store raw content for debugging
            
            for query_type, query in enumerate(queries):
                # Map query_type to political leaning
                political_leaning = ["left", "center", "right"][query_type]
                
                print(f"Querying for {political_leaning}-leaning sources: {query}")
                
                # Use the correct Sonar API model
                response = await client.post(
                    "https://api.perplexity.ai/chat/completions",
                    headers=headers,
                    json={
                        "model": "sonar",
                        "messages": [
                            {
                                "role": "system", 
                                "content": "You are a news collection assistant. Find recent news articles on the given topic. Include only factual articles from established news outlets. For each article, provide: 1) The exact article title, 2) The source name, 3) The complete article URL, and 4) A brief snippet or summary. Format each article as a separate bullet point or numbered item. Provide at least 3-5 articles if available."
                            },
                            {
                                "role": "user", 
                                "content": query
                            }
                        ]
                    }
                )
                
                if response.status_code != 200:
                    print(f"Error from Perplexity API: {response.status_code}")
                    print(response.text)
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Perplexity API error: {response.text}"
                    )
                
                data = response.json()
                
                # Extract content from the Sonar response
                try:
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    raw_content[political_leaning] = content
                    print(f"Received content length: {len(content)} chars")
                    print(f"Content preview: {content[:100]}...")
                    
                    # Parse the text response
                    articles = extract_articles_from_text(content, request.query)
                    print(f"Extracted {len(articles)} articles for {political_leaning}-leaning sources")
                    
                    # Add extracted articles to our collection with political leaning
                    for article in articles:
                        source = NewsSource(
                            title=article.get("title", ""),
                            url=article.get("url", ""),
                            source_name=article.get("source_name", ""),
                            political_leaning=political_leaning,
                            domain=article.get("domain", ""),
                            favicon_url=article.get("favicon_url", ""),
                            snippet=article.get("snippet", ""),
                            published_date=article.get("published_date", ""),
                            og_image=article.get("og_image", "")
                        )
                        
                        # Assign political score (more granular than just left/center/right)
                        if political_leaning == "left":
                            source.political_score = random.uniform(1.0, 4.0)
                        elif political_leaning == "center":
                            source.political_score = random.uniform(4.0, 7.0)
                        else:  # right
                            source.political_score = random.uniform(7.0, 10.0)
                        
                        all_sources.append(source)
                except Exception as e:
                    print(f"Error parsing Sonar response: {str(e)}")
                    print(f"Raw content: {content[:500]}...")
            
            # Try to fetch Open Graph images for all sources
            for source in all_sources:
                try:
                    # Try to fetch Open Graph image with a short timeout
                    og_response = await client.get(
                        source.url, 
                        follow_redirects=True,
                        timeout=5.0
                    )
                    if og_response.status_code == 200:
                        html = og_response.text
                        # Extract Open Graph image
                        og_match = re.search(r'<meta property="og:image" content="([^"]+)"', html)
                        if og_match:
                            source.og_image = og_match.group(1)
                except:
                    # If fetching fails, continue without image
                    pass
            
            # If no sources were found, use dummy data as a fallback
            if not all_sources:
                print("No sources found from API, using dummy data")
                dummy_sources = []
                # Create some dummy sources
                for i in range(min(limit, 12)):
                    idx = i % 3
                    leaning = ["left", "center", "right"][idx]
                    source = NewsSource(
                        title=f"Example Article {i+1} on {request.query}",
                        url="https://example.com/article",
                        source_name=f"News Source {i+1}",
                        political_leaning=leaning,
                        domain="example.com",
                        favicon_url="https://www.google.com/s2/favicons?domain=example.com&sz=128",
                        snippet=f"This is a placeholder article about {request.query} from a {leaning}-leaning perspective.",
                        published_date="2025-04-04",
                        og_image=""
                    )
                    
                    # Assign political score
                    if leaning == "left":
                        source.political_score = random.uniform(1.0, 4.0)
                    elif leaning == "center":
                        source.political_score = random.uniform(4.0, 7.0)
                    else:  # right
                        source.political_score = random.uniform(7.0, 10.0)
                    
                    dummy_sources.append(source)
                
                all_sources = dummy_sources
            
            # Balance the sources across political leanings based on the limit
            left_sources = [s for s in all_sources if s.political_leaning == "left"]
            center_sources = [s for s in all_sources if s.political_leaning == "center"]
            right_sources = [s for s in all_sources if s.political_leaning == "right"]
            
            # Calculate how many of each to include
            per_category = max(1, limit // 3)
            
            balanced_sources = []
            balanced_sources.extend(left_sources[:per_category])
            balanced_sources.extend(center_sources[:per_category])
            balanced_sources.extend(right_sources[:per_category])
            
            # Fill up to the limit with any remaining sources
            remaining_slots = limit - len(balanced_sources)
            if remaining_slots > 0:
                all_remaining = (left_sources[per_category:] + 
                                center_sources[per_category:] + 
                                right_sources[per_category:])
                balanced_sources.extend(all_remaining[:remaining_slots])
            
            # Calculate statistics
            stats = {
                "total": len(balanced_sources),
                "left_count": sum(1 for s in balanced_sources if s.political_leaning == "left"),
                "center_count": sum(1 for s in balanced_sources if s.political_leaning == "center"),
                "right_count": sum(1 for s in balanced_sources if s.political_leaning == "right")
            }
            
            # Calculate min and max scores for timeline positioning
            political_scores = [s.political_score for s in balanced_sources if s.political_score is not None]
            min_score = min(political_scores) if political_scores else 1.0
            max_score = max(political_scores) if political_scores else 10.0
            
            return NewsResponse(
                query=request.query,
                sources=balanced_sources,
                statistics=stats,
                timeline_positioning={
                    "min_score": min_score,
                    "max_score": max_score
                }
            )
            
    except Exception as e:
        print(f"Uncaught exception: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/article_preview")
async def article_preview(request: ArticlePreviewRequest):
    """
    Fetch preview data for a specific article URL.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(request.url, follow_redirects=True)
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch article")
            
            html = response.text
            
            # Extract title
            title = ""
            title_match = re.search(r'<meta property="og:title" content="([^"]+)"', html)
            if title_match:
                title = title_match.group(1)
            else:
                title_match = re.search(r'<title>(.*?)</title>', html)
                if title_match:
                    title = title_match.group(1)
            
            # Extract image
            image = ""
            image_match = re.search(r'<meta property="og:image" content="([^"]+)"', html)
            if image_match:
                image = image_match.group(1)
            
            # Extract description
            description = ""
            desc_match = re.search(r'<meta property="og:description" content="([^"]+)"', html)
            if desc_match:
                description = desc_match.group(1)
            
            # Extract domain
            domain = ""
            domain_match = re.search(r'https?://(?:www\.)?([^/]+)', request.url)
            if domain_match:
                domain = domain_match.group(1)
            
            return {
                "url": request.url,
                "title": title,
                "image": image,
                "description": description,
                "domain": domain,
                "favicon_url": f"https://www.google.com/s2/favicons?domain={domain}&sz=128"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching article preview: {str(e)}")