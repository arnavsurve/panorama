import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSettings, FiMoon, FiSun, FiLogOut, FiClock, FiTrash2, FiCheck } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

const Settings = ({ onOpenHistory }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  
  // API URL
  const API_BASE_URL = 'http://localhost:8000';

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
        setDeleteSuccess(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset success message when menu closes
  useEffect(() => {
    if (!isOpen) {
      setDeleteSuccess(false);
      setIsDeleting(false);
    }
  }, [isOpen]);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    navigate('/');
    window.location.reload();
  };

  const handleViewHistory = () => {
    if (onOpenHistory) {
      onOpenHistory();
    }
    setIsOpen(false);
  };

  const handleDeleteHistory = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      setIsDeleting(true);

      // Make API call to delete user history
      const response = await fetch(`${API_BASE_URL}/user/${userId}/history`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      setIsDeleting(false);
      setDeleteSuccess(true);
      
      // Hide success message after 2 seconds
      setTimeout(() => {
        setDeleteSuccess(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error deleting history:', error);
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-transparent p-2 rounded-full hover:bg-neutral-800 transition-colors"
        aria-label="Settings"
      >
        <FiSettings className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-neutral-800 rounded-lg shadow-lg py-1 z-50 border border-neutral-700">
          <button
            onClick={handleViewHistory}
            className="flex items-center w-full px-4 py-2 text-sm hover:bg-neutral-700 transition-colors"
          >
            <FiClock className="mr-2" />
            View History
          </button>
          
          <button
            onClick={handleDeleteHistory}
            disabled={isDeleting || deleteSuccess}
            className="flex items-center w-full px-4 py-2 text-sm hover:bg-neutral-700 transition-colors relative"
          >
            {isDeleting ? (
              <>
                <div className="mr-2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : deleteSuccess ? (
              <>
                <FiCheck className="mr-2 text-green-500" />
                Successfully deleted
              </>
            ) : (
              <>
                <FiTrash2 className="mr-2" />
                Delete History
              </>
            )}
          </button>
          
          <button
            onClick={toggleTheme}
            className="flex items-center w-full px-4 py-2 text-sm hover:bg-neutral-700 transition-colors"
          >
            {isDarkMode ? (
              <>
                <FiSun className="mr-2" />
                Light Mode
              </>
            ) : (
              <>
                <FiMoon className="mr-2" />
                Dark Mode
              </>
            )}
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm hover:bg-neutral-700 transition-colors"
          >
            <FiLogOut className="mr-2" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Settings; 