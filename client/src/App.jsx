import './App.css';
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { HiArrowCircleUp } from 'react-icons/hi';
import ArticleGrid from './components/ArticleGrid';
import LoginPage from './components/LoginPage.jsx';
import RegistrationPage from './components/RegistrationPage.jsx';
import PongLoadingGame from './components/PongLoadingGame';
import { getRandomLoadingMessage } from './utils';
// New Landing Page Component
function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-900 text-white font-mono flex flex-col items-center px-4">
      <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col items-center justify-center">
        <h1 className="text-6xl text-center mb-6">📰 panorama</h1>
        <p className="text-xl text-center text-neutral-300 mb-10 max-w-lg">
          get the whole picture with news from all perspectives.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <button
            onClick={() => navigate('/register')}
            className="flex-1 p-4 bg-gray-600 text-white rounded-lg transition-colors hover:bg-gray-700 text-lg cursor-pointer"
          >
            get started
          </button>
          <button
            onClick={() => navigate('/login')}
            className="flex-1 p-4 bg-transparent border border-neutral-700 text-white rounded-lg transition-colors hover:bg-neutral-800 text-lg cursor-pointer"
          >
            log in
          </button>
        </div>
      </div>
    </div>
  );
}

function MainApp() {
  const [hasSearched, setHasSearched] = useState(false);
  const [query, setQuery] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [selectedSource, setSelectedSource] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const navigate = useNavigate();

  // API URLs
  const API_BASE_URL = 'http://localhost:8000';
  const QUERY_URL = `${API_BASE_URL}/query`;
  const SOURCE_URL = `${API_BASE_URL}/source`;

  // Check if user is logged in
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      setIsLoggedIn(true);
    }
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    navigate('/');
    window.location.reload();
  };

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
      const userId = localStorage.getItem('userId');
      const payload = {
        query: searchQuery,
        limit: 21,
        user_id: userId,  // include the user id if available
      };

      console.log('Sending request to:', QUERY_URL);
      console.log('Request payload:', payload);

      const response = await fetch(QUERY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your Perplexity API key.');
        } else if (response.status === 410 || response.status === 403) {
          throw new Error(`Content not available (Error: ${response.status}).`);
        } else {
          throw new Error(`API Error: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log('Response data:', data);
      return data;
    } catch (err) {
      console.error('Error fetching results:', err);
      setError(err.message || 'Failed to fetch results. Please try again.');
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setShowResults(false);
    setSelectedSource(null);
    setLastQuery(query);

    try {
      const apiResults = await fetchResults(query);
      if (apiResults) {
        setLastQuery(query);
        // Log the full response to console for debugging
        console.log('API Response:', JSON.stringify(apiResults, null, 2));
        // Log the first few articles to see title formatting
        if (apiResults.sources && apiResults.sources.length > 0) {
          console.log('First 3 article titles:', apiResults.sources.slice(0, 3).map(source => ({
            title: source.title,
            url: source.url,
            domain: source.domain
          })));
        }
        setResults(apiResults);
        setQuery('');
        setHasSearched(true);
        setShowResults(true);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred during search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSourceSelect = async (sourceId) => {
    try {
      setSelectedSource(null);

      const response = await fetch(`${SOURCE_URL}/${sourceId}`);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const sourceData = await response.json();
      setSelectedSource(sourceData);
    } catch (err) {
      console.error('Error fetching source details:', err);
      setError('Failed to fetch source details. Please try again.');
    }
  };

  const handleBackToResults = () => {
    setSelectedSource(null);
  };

  const placeholderText = "What's happening today?";

  return (
    <div className="min-h-screen bg-neutral-900 text-white font-mono flex flex-col transition-all duration-700 ease-in-out px-4">
      <div className="w-full fixed top-0 left-0 bg-opacity-100 flex justify-end items-center p-4 z-50">
        <button className="bg-transparent border-1 text-base cursor-pointer p-2 hover:text-gray-400 rounded-lg" onClick={handleLogout}>log out</button>
      </div>
      {/* Container that manages vertical positioning */}
      <div className={`flex flex-col items-center transition-all duration-700 ease-in-out ${hasSearched ? '' : 'flex-1 justify-center'}`}>
        {/* Title and last search */}
        <div className={`transition-all duration-700 ease-in-out w-full ${hasSearched ? 'pt-10' : ''}`}>
          <div className="flex justify-between items-center">
            <div></div> {/* Empty div for spacing */}
            <h1 className="text-4xl text-center mb-6">📰 panorama</h1>
            <div className="flex space-x-2">
              {isLoggedIn ? (
                null
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3 py-1 text-sm bg-transparent border border-neutral-700 rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 py-1 text-sm bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
          {hasSearched && (
            <p className="text-center text-neutral-400 text-md transition-opacity duration-500 animate-fade-in">
              <span className="text-gray-500">{'>'} {lastQuery}</span>
            </p>
          )}
        </div>

        {/* Search bar that appears under title when not searched */}
        {!hasSearched && (
          <div className="w-full max-w-xl mx-auto transition-all duration-700 ease-in-out opacity-100">
            <form onSubmit={handleSubmit} className="w-full space-y-4">
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
                  disabled={loading || !query.trim()}
                  className="absolute right-2 px-2 py-2 text-white rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
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

      {/* Pong Loading Game */}
      {loading && (
        <div className="w-full max-w-xl mx-auto mt-32 mb-16"> {/* Increased top and bottom margins further */}
          {/* Error message - moved here to be between search bar and game */}
          {error && (
            <div className="w-full max-w-xl mx-auto mb-6 text-red-400 text-center animate-fade-in">
              {error}
            </div>
          )}
          {/* Centered loading message above the game */}
          <div className="text-center mb-6 text-neutral-400 animate-fade-in-out">
            {loadingMessage}
          </div>
          <PongLoadingGame loadingMessage={loadingMessage} />
        </div>
      )}
      
      {/* Error message - only show when not loading */}
      {error && !loading && (
        <div className="w-full max-w-xl mx-auto mt-4 text-red-400 text-center animate-fade-in">
          {error}
        </div>
      )}
      </div>

      {/* Selected Source Detail View or Article Grid */}
      {hasSearched && (
        <div className="py-8 pb-20 animate-fade-in-up">
          {selectedSource ? (
            <div className="max-w-3xl mx-auto">
              <button
                onClick={handleBackToResults}
                className="mb-4 text-neutral-400 hover:text-white transition-colors"
              >
                ← Back to results
              </button>

              <SourceDetail
                source={selectedSource}
              />
            </div>
          ) : (
            <ArticleGrid
              results={results}
              isVisible={showResults}
              onArticleClick={handleSourceSelect}
            />
          )}
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

// Main App with authentication routing
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      setIsLoggedIn(true);
    }
  }, []);

  // Function to update login state
  const handleLogin = (userId) => {
    localStorage.setItem('userId', userId);
    setIsLoggedIn(true);
  };

  return (
    <Routes>
      <Route path="/" element={isLoggedIn ? <MainApp /> : <LandingPage />} />
      <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
      <Route path="/register" element={<RegistrationPage onLogin={handleLogin} />} />
      <Route path="/search" element={<MainApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
