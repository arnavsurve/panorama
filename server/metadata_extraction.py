"""
Simple metadata extraction using OpenAI API directly.
This avoids the need for the entire LlamaIndex library.
"""

import logging
from typing import Dict, Any, List

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def extract_metadata(text: str, title: str, url: str, api_key: str) -> Dict[str, Any]:
    """
    Extract metadata from text using OpenAI directly instead of LlamaIndex.
    
    Args:
        text: The article text to analyze
        title: The article title
        url: The article URL
        api_key: OpenAI API key
        
    Returns:
        Dictionary containing extracted metadata
    """
    try:
        # Import OpenAI client
        from openai import OpenAI
        
        # Initialize client
        client = OpenAI(api_key=api_key)
        
        # Create prompt for metadata extraction
        prompt = f"""
        Extract metadata from the following news article.
        Title: {title}
        URL: {url}
        
        Text (first 2000 characters):
        {text[:2000]}
        
        Please extract and return exactly these items in plain text format:
        1. A brief summary (2-3 sentences)
        2. 5 keywords or key topics
        3. 3 questions that this article would help answer
        
        Format your response like this:
        
        SUMMARY:
        [your summary here]
        
        KEYWORDS:
        [keyword1], [keyword2], [keyword3], [keyword4], [keyword5]
        
        QUESTIONS:
        1. [first question]
        2. [second question]
        3. [third question]
        """
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You extract metadata from news articles in a structured format."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=512
        )
        
        # Extract the response text
        response_text = response.choices[0].message.content
        
        # Parse the response into structured metadata
        metadata = {
            "title": title,
            "url": url
        }
        
        # Extract summary
        if "SUMMARY:" in response_text:
            summary_section = response_text.split("SUMMARY:")[1].split("KEYWORDS:")[0].strip()
            metadata["summary"] = summary_section
        
        # Extract keywords
        if "KEYWORDS:" in response_text:
            if "QUESTIONS:" in response_text:
                keywords_section = response_text.split("KEYWORDS:")[1].split("QUESTIONS:")[0].strip()
            else:
                keywords_section = response_text.split("KEYWORDS:")[1].strip()
            
            keywords = [k.strip() for k in keywords_section.split(',')]
            metadata["keywords"] = keywords
        
        # Extract questions
        if "QUESTIONS:" in response_text:
            questions_section = response_text.split("QUESTIONS:")[1].strip()
            questions = []
            
            # Process numbered list
            for line in questions_section.split('\n'):
                line = line.strip()
                if line and (line[0].isdigit() or line[0] == '-'):
                    # Remove number/bullet and clean
                    question = line[2:].strip() if line[1] in ['.', ')', '-', ' '] else line
                    questions.append(question)
            
            metadata["questions"] = questions
        
        logger.info(f"Successfully extracted metadata for {url}")
        return metadata
    
    except Exception as e:
        logger.error(f"Error extracting metadata: {str(e)}")
        return {
            "error": str(e),
            "title": title,
            "url": url
        }