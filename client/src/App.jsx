import './App.css';
import { useState, useEffect } from 'react';
import { HiArrowCircleUp } from 'react-icons/hi';
import ArticleGrid from './components/ArticleGrid';
import { getRandomLoadingMessage } from './utils';

function App() {
  const [hasSearched, setHasSearched] = useState(false);
  const [query, setQuery] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingMessage(getRandomLoadingMessage());
      interval = setInterval(() => {
        setLoadingMessage(getRandomLoadingMessage());
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const fetchResults = async (searchQuery) => {
    try {
      setError(null);
      const response = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 12,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching results:', err);
      setError('Failed to fetch results. Please try again.');
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setShowResults(false);

    try {
      const apiResults = await fetchResults(query);
      setLastQuery(query);
      setResults(apiResults);
      setQuery('');
      setHasSearched(true);
      setShowResults(true);
      console.log(`Searching for: ${query}`);
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred during search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const placeholderText = "What's happening today?";

  return (
    <div className="min-h-screen bg-neutral-900 text-white font-mono flex flex-col transition-all duration-700 ease-in-out px-4">
      {/* Container that manages vertical positioning */}
      <div className={`flex flex-col items-center transition-all duration-700 ease-in-out ${hasSearched ? '' : 'flex-1 justify-center'}`}>
        {/* Title and last search */}
        <div className={`transition-all duration-700 ease-in-out w-full ${hasSearched ? 'pt-10' : ''}`}>
          <h1 className="text-4xl text-center mb-6">📰 panorama</h1>
          {hasSearched && (
            <p className="text-center text-neutral-400 text-md transition-opacity duration-500 animate-fade-in">
              <span className="text-gray-500">{'>'} {lastQuery}</span>
            </p>
          )}
        </div>
        
        {/* Search bar that appears under title when not searched */}
        {!hasSearched && (
          <div className="w-full max-w-xl mx-auto transition-all duration-700 ease-in-out opacity-100">
            <form onSubmit={handleSubmit} className="w-full">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setLastQuery(e.target.value);
                  }}
                  disabled={loading}
                  className="w-full p-4 pr-12 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none transition-all duration-300 disabled:opacity-50"
                  placeholder={placeholderText}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-2 px-2 py-2 text-white rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <HiArrowCircleUp className="w-8 h-8 transition-transform hover:scale-110" />
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

      {/* Loading message under last search text */}
      {loading && (
        <div className="w-full max-w-xl mx-auto mt-4 text-center text-neutral-400 animate-fade-in-out">
          {loadingMessage}
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="w-full max-w-xl mx-auto mt-4 text-red-400 text-center animate-fade-in">
          {error}
        </div>
      )}
      </div>
      
      
      {/* Article Grid section - appears between title and bottom search bar */}
      {hasSearched && (
        <div className="py-8 pb-20 animate-fade-in-up">
          <ArticleGrid results={results} isVisible={showResults} />
        </div>
      )}
      
      {/* Floating search bar that appears after search */}
      {hasSearched && (
        <div className="fixed bottom-0 left-0 right-0 z-10 search-bar-gradient pt-8 pb-4 px-4 animate-fade-in">
          <div className="w-full max-w-xl mx-auto">
            <form onSubmit={handleSubmit} className="w-full">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={loading}
                  className="w-full p-4 pr-12 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none transition-all duration-300 disabled:opacity-50"
                  placeholder={placeholderText}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-2 px-2 py-2 text-white rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <HiArrowCircleUp className="w-8 h-8 transition-transform hover:scale-110" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;