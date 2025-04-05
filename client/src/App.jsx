import './App.css';
import { useState } from 'react';
import { HiArrowCircleUp } from 'react-icons/hi';

function App() {
  const [hasSearched, setHasSearched] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);

    // Simulated API call
    setTimeout(() => {
      setLoading(false);
      setHasSearched(true);
      // You can place the real API call logic here
      console.log(`Searching for: ${query}`);
    }, 3000);
  };

  return (
    <div className='min-h-screen bg-neutral-900 text-white font-mono flex'>
      <div
        className={`
          transition-all duration-700 ease-in-out w-full
          flex flex-col items-center px-4
          ${hasSearched ? 'pt-10' : 'justify-center h-screen'}
        `}
      >
        <h1
          className={`
            text-4xl mb-8 transition-all duration-700 ease-in-out
            ${hasSearched ? 'text-2xl text-left w-full max-w-xl ml-auto mr-auto' : 'text-center'}
          `}
        >
          panorama
        </h1>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-xl mx-auto"
        >
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
              className="w-full p-4 pr-12 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none transition-all duration-300 disabled:opacity-50"
              placeholder="What's happening in Gaza?"
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
  );
}

export default App;