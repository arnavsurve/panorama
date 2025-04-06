import React from 'react';

const ArticleCard = ({ article, onArticleClick }) => {
  const { _id, title, source_name, political_leaning, political_score, snippet, published_date, favicon_url, og_image, url } = article;
  
  // Debug log for article title
  console.log(`ArticleCard rendering: ${url}`, {
    title: title || 'No title',
    url,
    domain: url ? new URL(url).hostname : 'No URL'
  });
  
  // Function to get color based on political leaning
  const getLeaningColor = (leaning) => {
    if (leaning === "left") {
      return "#3b82f6";  // Blue
    } else if (leaning === "center") {
      return "#a855f7";  // Purple
    } else if (leaning === "right") {
      return "#ef4444";  // Red
    }
    return "#6b7280";  // Gray for unknown
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Handle title click to open the source URL in a new tab
  const handleTitleClick = (e) => {
    e.stopPropagation(); // Prevent the card click event
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };
  
  return (
    <div 
      className="bg-neutral-800 rounded-lg overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer"
      onClick={() => onArticleClick(_id)}
    >
      {og_image && (
        <div className="h-40 overflow-hidden">
          <img 
            src={og_image} 
            alt={title} 
            className="w-full h-full object-cover"
            onError={(event) => {
              event.target.style.display = 'none';
            }}
          />
        </div>
      )}
      <div className={`p-4 ${og_image ? '' : 'py-6'}`}>
        <div className="flex items-center mb-2">
          {favicon_url && (
            <img 
              src={favicon_url} 
              alt={source_name} 
              className="w-4 h-4 mr-2"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <span className="text-neutral-400 text-xs">{source_name}</span>
          <div 
            className="ml-2 text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: getLeaningColor(political_leaning), color: 'white' }}
          >
            {political_leaning.charAt(0).toUpperCase() + political_leaning.slice(1)}
          </div>
        </div>
        <h3 
          className="font-semibold mb-2 line-clamp-2 hover:text-blue-400 hover:underline cursor-pointer" 
          onClick={handleTitleClick}
        >
          {title}
        </h3>
        <p className="text-neutral-300 text-sm mb-3 line-clamp-3">{snippet}</p>
        <div className="flex justify-between items-center text-xs text-neutral-400">
          <span>{formatDate(published_date)}</span>
          {political_score && (
            <div className="flex items-center gap-1">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getLeaningColor(political_leaning) }}
              ></div>
              <span>{political_score.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ArticleGrid = ({ results, isVisible, onArticleClick }) => {
  if (!results || !results.sources || !isVisible) return null;
  
  const { sources, statistics } = results;
  
  // Group articles by political leaning
  const leftArticles = sources.filter(article => article.political_leaning === "left");
  const centerArticles = sources.filter(article => article.political_leaning === "center");
  const rightArticles = sources.filter(article => article.political_leaning === "right");
  
  return (
    <div className={`w-full max-w-6xl mx-auto transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h2 className="text-lg font-semibold">Results ({statistics.total})</h2>
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Left ({statistics.left_count})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>Center ({statistics.center_count})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Right ({statistics.right_count})</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <h3 className="text-blue-500 font-medium border-b border-blue-500/50 pb-1 mb-4">Left-leaning</h3>
            {leftArticles.length > 0 ? (
              leftArticles.map((article, index) => (
                <ArticleCard 
                  key={`left-${index}`} 
                  article={article} 
                  onArticleClick={onArticleClick}
                />
              ))
            ) : (
              <p className="text-neutral-400 text-sm">No left-leaning articles found</p>
            )}
          </div>
          
          {/* Center Column */}
          <div className="space-y-6">
            <h3 className="text-purple-500 font-medium border-b border-purple-500/50 pb-1 mb-4">Center</h3>
            {centerArticles.length > 0 ? (
              centerArticles.map((article, index) => (
                <ArticleCard 
                  key={`center-${index}`} 
                  article={article}
                  onArticleClick={onArticleClick}
                />
              ))
            ) : (
              <p className="text-neutral-400 text-sm">No center articles found</p>
            )}
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            <h3 className="text-red-500 font-medium border-b border-red-500/50 pb-1 mb-4">Right-leaning</h3>
            {rightArticles.length > 0 ? (
              rightArticles.map((article, index) => (
                <ArticleCard 
                  key={`right-${index}`} 
                  article={article}
                  onArticleClick={onArticleClick}
                />
              ))
            ) : (
              <p className="text-neutral-400 text-sm">No right-leaning articles found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleGrid;