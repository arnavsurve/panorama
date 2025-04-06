import React from 'react';
import { FiX } from 'react-icons/fi';
// Adjust the path ../App if ThemeContext is exported from a different file
import { useThemeContext } from '../App';

function Modal({ isOpen, onClose, title, children }) {
  const { theme } = useThemeContext();

  if (!isOpen) return null;

  // Close modal if Escape key is pressed
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose} // Close modal on overlay click
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`relative rounded-lg shadow-xl w-full max-w-lg p-6 transition-all duration-300 ease-in-out 
                   ${theme === 'dark' ? 'bg-neutral-800 text-neutral-100 border border-neutral-700' : 'bg-white text-neutral-900 border border-neutral-200'}`}
        onClick={e => e.stopPropagation()} // Prevent closing modal when clicking inside content
        role="document"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-3 right-3 p-1 rounded-full 
                     ${theme === 'dark' ? 'text-neutral-400 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500' : 'text-neutral-500 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500'}
                     transition-colors`}
          aria-label="Close modal"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        {title && (
          <h3 id="modal-title" className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
            {title}
          </h3>
        )}

        {/* Modal Content */}
        {/* Added aria-describedby for accessibility */}
        <div id="modal-description" className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;