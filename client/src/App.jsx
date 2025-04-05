import './App.css';
import { useState } from 'react';
import { HiArrowCircleUp } from 'react-icons/hi';

function App() {
  const [hasSearched, setHasSearched] = useState(false);
  const [query, setQuery] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);

    // Simulated API call
    setTimeout(() => {
      setLastQuery(query);     // Store the query
      setQuery('');            // Clear the input
      setHasSearched(true);    // Trigger layout shift
      setLoading(false);
      console.log(`Searching for: ${query}`);
    }, 1500);
  };

  const placeholderText = "What's happening today?";

  return (
    <div className="min-h-screen bg-neutral-900 text-white font-mono flex flex-col transition-all duration-700 ease-in-out px-4">
      {/* Container that manages vertical positioning */}
      <div className={`flex flex-col items-center transition-all duration-700 ease-in-out ${hasSearched ? '' : 'flex-1 justify-center'}`}>
        {/* Title and last search */}
        <div className={`transition-all duration-700 ease-in-out w-full ${hasSearched ? 'pt-10' : ''}`}>
          <h1 className="text-4xl text-center mb-8">panorama</h1>
          {hasSearched && (
            <p className="text-center text-neutral-400 text-md mb-6 transition-opacity duration-500 animate-fade-in">
              <span className="text-gray-500">{lastQuery}</span>
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
        )}
      </div>
      
      {/* Spacer that pushes bottom search bar down */}
      {hasSearched && <div className="flex-1"></div>}
      
      {/* Search bar that appears at bottom after search */}
      {hasSearched && (
        <div className="w-full max-w-xl mx-auto mb-12 animate-fade-in">
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
      )}
    </div>
  );
}

export default App;