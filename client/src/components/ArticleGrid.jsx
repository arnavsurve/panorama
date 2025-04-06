import React, { useState } from 'react';
import { FaRegBookmark, FaBookmark } from 'react-icons/fa';

const ArticleCard = ({ article, onArticleClick }) => {
  const { _id, title, source_name, political_leaning, political_score, published_date, favicon_url, og_image, url, metadata, text } = article;
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Check if article has HTTP error
  const hasError = metadata && (metadata.error || metadata.status_code);
  const statusCode = metadata?.status_code;

  // Function to clean up source name
  const cleanSourceName = (name) => {
    if (!name) return '';
    // Remove special characters and extra spaces
    return name
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ')           // Replace multiple spaces with a single space
      .trim();                        // Remove leading/trailing spaces
  };

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
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Handle card click to open the source URL in a new tab
  const handleCardClick = () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    // Also trigger the original onArticleClick functionality
    onArticleClick(_id);
  };

  const handleBookmark = async (e) => {
    e.stopPropagation(); // Prevent the card click event
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert("Please log in to bookmark articles.");
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8000/bookmark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          news_source: article
        })
      });

      if (!response.ok) {
        alert("Failed to bookmark the article. Please try again.");
        return;
      }

      const data = await response.json();
      if (data.message) {
        setIsBookmarked(true);
        console.log(data.message);
      } else {
        alert("Failed to bookmark the article.");
      }
    } catch (error) {
      console.error("Error bookmarking article:", error);
      alert("An error occurred while bookmarking the article.");
    }
  };
  

  return (
    <div
      className={`bg-neutral-800 rounded-lg overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer ${hasError ? 'border border-amber-600/30' : ''} relative`}
      onClick={handleCardClick}
    >
      {og_image && !hasError && (
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

      {/* Error indicator for articles with HTTP errors */}
      {hasError && (
        <div className="bg-amber-900/30 px-4 py-2 text-amber-400 text-xs flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {statusCode ? `Error ${statusCode}` : 'Loading Error'}
        </div>
      )}

      <div className={`p-4 ${og_image && !hasError ? '' : 'py-6'}`}>
        <div className="flex items-center mb-2">
          {favicon_url && (
            <img
              src={favicon_url}
              alt={cleanSourceName(source_name)}
              className="w-4 h-4 mr-2"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <span className="text-neutral-400 text-xs">{cleanSourceName(source_name)}</span>
          <div
            className="ml-2 text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: getLeaningColor(political_leaning), color: 'white' }}
          >
            {political_leaning.charAt(0).toUpperCase() + political_leaning.slice(1)}
          </div>
        </div>
        <h3
          className="font-semibold mb-2 line-clamp-2 hover:text-blue-400 hover:underline cursor-pointer"
        >
          {title}
        </h3>
        <div className="flex justify-between items-center text-xs text-neutral-400">
          {published_date && formatDate(published_date) ? (
            <span>{formatDate(published_date)}</span>
          ) : (
            <span></span>
          )}
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
      </div >
    </div >
  );
};

const ArticleGrid = ({ results, isVisible, onArticleClick }) => {
  if (!results) return null;

  const { sources } = results;

  // Filter out articles with errors
  const filteredSources = sources.filter(article => {
    // Skip articles with 401, 403, 404, or 500 errors in metadata
    return !(article.metadata && (article.metadata.status_code === 401 || article.metadata.status_code === 403 || article.metadata.status_code === 404 || article.metadata.status_code === 500));
  });

  // Group articles by political leaning
  const leftArticles = filteredSources.filter(article => article.political_leaning === "left")
    .sort((a, b) => (a.political_score || 0) - (b.political_score || 0));

  const centerArticles = filteredSources.filter(article => article.political_leaning === "center")
    .sort((a, b) => (a.political_score || 0) - (b.political_score || 0));

  const rightArticles = filteredSources.filter(article => article.political_leaning === "right")
    .sort((a, b) => (a.political_score || 0) - (b.political_score || 0));

  // Recalculate statistics after filtering
  const filteredStatistics = {
    total: filteredSources.length,
    left_count: leftArticles.length,
    center_count: centerArticles.length,
    right_count: rightArticles.length
  };

  return (
    <div className={`w-full max-w-6xl mx-auto transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h2 className="text-lg font-semibold">Results ({filteredStatistics.total})</h2>
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Left ({filteredStatistics.left_count})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>Center ({filteredStatistics.center_count})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Right ({filteredStatistics.right_count})</span>
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
