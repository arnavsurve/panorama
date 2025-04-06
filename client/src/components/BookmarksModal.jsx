import React from 'react';
import { FiX } from 'react-icons/fi';

const BookmarksModal = ({ bookmarks, onClose }) => {
  return (
    <div className="fixed inset-0 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-neutral-800 rounded-lg shadow-lg w-3/4 max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-neutral-700">
          <h2 className="text-xl font-semibold">Bookmarks</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-neutral-700 transition-colors cursor-pointer">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {bookmarks.length > 0 ? (
            bookmarks.map((bookmark, index) => (
              <div key={index} className={`p-3 mb-2 rounded-lg cursor-pointer hover:bg-opacity-10 hover:bg-neutral-700 transition-colors`}>
                <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                  <h5 className="font-medium">{bookmark.title}</h5>
                  <p className="text-sm text-neutral-400 mt-1">{bookmark.source_name}</p>
                </a>
              </div>
            )).reverse()
          ) : (
            <p className="text-center text-gray-500">No bookmarks available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookmarksModal; 