import { useState } from 'react';
import FollowUpQuestion from './FollowUpQuestion';

// Political leaning color mapping
const leaningColors = {
  left: {
    bg: '#3b82f6', // Blue
    text: 'white',
    label: 'Left'
  },
  center: {
    bg: '#a855f7', // Purple
    text: 'white',
    label: 'Center'
  },
  right: {
    bg: '#ef4444', // Red
    text: 'white',
    label: 'Right'
  }
};

const SourceDetail = ({ 
  source, 
  question, 
  setQuestion, 
  onSubmitQuestion,
  loading, 
  answer 
}) => {
  const [activeTab, setActiveTab] = useState('content');
  
  if (!source) return null;
  
  const leaning = source.political_leaning || 'center';
  const color = leaningColors[leaning] || leaningColors.center;
  
  // Format the domain for display
  const formatDomain = (url) => {
    if (!url) return '';
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch {
      return url;
    }
  };
  
  // Extract keywords from metadata
  const extractKeywords = () => {
    if (!source.metadata) return [];
    
    const metadata = source.metadata;
    
    // Try to find keywords in the metadata
    if (metadata.keywords && Array.isArray(metadata.keywords)) {
      return metadata.keywords;
    }
    
    // Try to find keywords in the LLM extraction
    if (metadata.llm_extraction) {
      try {
        const keywordMatch = metadata.llm_extraction.match(/keywords?:(.+?)(?:\n|$)/i);
        if (keywordMatch && keywordMatch[1]) {
          return keywordMatch[1].split(',').map(k => k.trim()).filter(k => k);
        }
      } catch (e) {
        console.error('Error extracting keywords:', e);
      }
    }
    
    return [];
  };
  
  const keywords = extractKeywords();
  
  // Extract summary from metadata
  const extractSummary = () => {
    if (!source.metadata) return '';
    
    const metadata = source.metadata;
    
    // Try to find summary in metadata
    if (metadata.summary) {
      return metadata.summary;
    }
    
    // Try to find summary in LLM extraction
    if (metadata.llm_extraction) {
      try {
        const summaryMatch = metadata.llm_extraction.match(/summary:(.+?)(?:\n\n|\n(?=[A-Za-z]+:)|$)/is);
        if (summaryMatch && summaryMatch[1]) {
          return summaryMatch[1].trim();
        }
      } catch (e) {
        console.error('Error extracting summary:', e);
      }
    }
    
    return '';
  };
  
  const summary = extractSummary();
  
  return (
    <div className="bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700">
      {/* Header with image if available */}
      {source.og_image && (
        <div className="h-48 overflow-hidden">
          <img 
            src={source.og_image} 
            alt={source.title}
            className="w-full h-full object-cover"
            onError={(event) => {
              event.target.style.display = 'none';
            }}
          />
        </div>
      )}
      
      {/* Source header */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          {/* Source favicon and name */}
          <div className="flex items-center">
            {source.favicon_url ? (
              <img 
                src={source.favicon_url} 
                alt="" 
                className="w-5 h-5 mr-2"
                onError={(event) => {
                  event.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-5 h-5 mr-2 bg-neutral-700 rounded-full"></div>
            )}
            <div>
              <span className="text-md">
                {source.source_name || formatDomain(source.url)}
              </span>
              <div className="text-xs text-neutral-400">
                {source.domain || formatDomain(source.url)}
              </div>
            </div>
          </div>
          
          {/* Political leaning badge */}
          <div 
            className="text-sm px-3 py-1 rounded-full"
            style={{ 
              backgroundColor: color.bg,
              color: color.text
            }}
          >
            {color.label}
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-2xl font-bold mb-3">{source.title}</h1>
        
        {/* Metadata */}
        <div className="flex flex-wrap gap-2 mb-4">
          {source.published_date && (
            <div className="text-sm text-neutral-400">
              <span className="mr-1">📅</span>
              {source.published_date}
            </div>
          )}
          
          <div className="text-sm text-neutral-400">
            <a 
              href={source.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              <span className="mr-1">🔗</span>
              View Original
            </a>
          </div>
        </div>
        
        {/* Summary (if available) */}
        {summary && (
          <div className="mb-4 p-4 bg-neutral-700 rounded-lg">
            <div className="text-sm text-neutral-300 mb-2 font-bold">Summary</div>
            <div className="text-neutral-200">
              {summary}
            </div>
          </div>
        )}
        
        {/* Keywords */}
        {keywords.length > 0 && (
          <div className="mb-4">
            <div className="text-sm text-neutral-500 mb-2">Keywords</div>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <span 
                  key={index}
                  className="text-xs px-2 py-1 bg-neutral-700 rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Tabs for content, metadata, etc. */}
      <div className="border-t border-neutral-700">
        <div className="flex border-b border-neutral-700">
          <button
            className={`py-3 px-6 ${activeTab === 'content' ? 'border-b-2 border-white' : 'text-neutral-400'}`}
            onClick={() => setActiveTab('content')}
          >
            Content
          </button>
          <button
            className={`py-3 px-6 ${activeTab === 'metadata' ? 'border-b-2 border-white' : 'text-neutral-400'}`}
            onClick={() => setActiveTab('metadata')}
          >
            Metadata
          </button>
        </div>
        
        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'content' && (
            <div>
              {/* Snippet */}
              {source.snippet && (
                <div className="mb-6">
                  <div className="text-sm text-neutral-500 mb-2">Snippet</div>
                  <blockquote className="border-l-4 border-neutral-600 pl-4 italic text-neutral-300">
                    {source.snippet}
                  </blockquote>
                </div>
              )}
              
              {/* Full Content */}
              {source.text ? (
                <div>
                  <div className="text-sm text-neutral-500 mb-2">Full Article Content</div>
                  <div className="whitespace-pre-line text-neutral-300 max-h-96 overflow-y-auto pr-4 hide-scrollbar">
                    {source.text}
                  </div>
                  
                  {/* Follow-up Questions Component */}
                  <FollowUpQuestion 
                    question={question}
                    setQuestion={setQuestion}
                    onSubmit={onSubmitQuestion}
                    loading={loading}
                    answer={answer}
                  />
                </div>
              ) : (
                <div className="text-neutral-400 italic">
                  Full text content is not available for this source.
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'metadata' && (
            <div>
              {source.metadata ? (
                <div>
                  <div className="text-sm text-neutral-500 mb-2">Extracted Metadata</div>
                  <pre className="bg-neutral-900 p-4 rounded overflow-x-auto text-xs max-h-96 overflow-y-auto hide-scrollbar">
                    {JSON.stringify(source.metadata, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-neutral-400 italic">
                  No metadata available for this source.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SourceDetail;