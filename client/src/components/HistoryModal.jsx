import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

const HistoryModal = ({ isOpen, onClose, onQueryClick }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isDarkMode } = useTheme();

  // API URL
  const API_BASE_URL = 'http://localhost:8000';

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`${API_BASE_URL}/user/${userId}/history`);
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('History response:', data);
        
        // Check if data has expected format
        if (Array.isArray(data)) {
          setHistory(data);
        } else if (data.history && Array.isArray(data.history)) {
          // In case API returns { history: [...] } format
          setHistory(data.history);
        } else if (data.items && Array.isArray(data.items)) {
          // For { items: [...], total: number } format
          setHistory(data.items);
        } else {
          console.error('Unexpected response format:', data);
          setError('Invalid response format from server');
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        setError('Failed to load history. Please try again.');
      }
    } catch (err) {
      console.error('Error in fetchHistory:', err);
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display with error handling
  const formatDate = (isoString) => {
    try {
      if (!isoString) return 'Unknown date';
      const date = new Date(isoString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid date';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-0 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md rounded-lg shadow-lg ${isDarkMode ? 'bg-neutral-800' : 'bg-white text-black'} max-h-[80vh] flex flex-col`}>
        <div className="flex justify-between items-center p-4 border-b border-neutral-700">
          <h2 className="text-xl font-semibold">history</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-700 transition-colors cursor-pointer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center p-4">{error}</div>
          ) : !history || history.length === 0 ? (
            <div className="text-center p-4 text-neutral-400">no search history found</div>
          ) : (
            <ul>
              {history.map((item, index) => (
                <li 
                  key={item._id || index} 
                  className={`p-3 mb-2 rounded-lg cursor-pointer hover:bg-opacity-10 ${isDarkMode ? 'hover:bg-neutral-700' : 'hover:bg-neutral-200'} transition-colors`}
                  onClick={() => onQueryClick && onQueryClick(item.query)}
                >
                  <p className="font-medium">{item.query || 'unknown query'}</p>
                  <p className="text-sm text-neutral-400 mt-1">{formatDate(item.timestamp)}</p>
                </li>
              )).reverse()}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal; 