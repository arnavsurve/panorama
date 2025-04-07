import React, { useState } from 'react';
import { FaSearch, FaEye, FaEyeSlash, FaSlidersH } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

const FollowUpQuestion = ({ queryId, userId, onAnswer, isLoading, setIsLoading, articleData }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState(null);
  const [showAnswer, setShowAnswer] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Prepare articles data
      const articles = articleData || [];

      const response = await fetch('http://localhost:8000/multi_followup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: question.trim(),
          search_query_id: queryId,  // For fallback if needed
          user_id: userId,           // For fallback if needed
          max_articles: 15,
          articles: articles         // Send full article data from frontend
        })
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setAnswer(data);
      onAnswer && onAnswer(data); // Notify parent component if needed
    } catch (err) {
      console.error('Error submitting follow-up question:', err);
      setError('Failed to get an answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-neutral-900 p-4 mb-6 rounded-lg border border-neutral-800">
      <h3 className="text-lg font-medium mb-3 text-neutral-100">Ask a follow-up question</h3>
      <p className="text-neutral-400 text-sm mb-4">
        Ask a question about the news articles above to get more specific information or insights.
      </p>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What would you like to know?"
            className="w-full bg-neutral-800 text-neutral-100 p-3 pr-10 rounded-md border border-neutral-700 focus:border-[#4A5565] focus:outline-none focus:ring-1 focus:ring-[#4A5565]"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#4A5565] hover:text-[#5A6575] p-2 disabled:opacity-50"
            disabled={isLoading || !question.trim()}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-[#4A5565] border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FaSearch />
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-3 bg-red-900/30 text-red-300 rounded-md mb-4">
          {error}
        </div>
      )}

      {answer && (
        <div className="p-4 bg-neutral-800 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="text-[#4A5565] hover:text-[#5A6575] focus:outline-none p-1 rounded-full hover:bg-neutral-700/50 transition-all"
              aria-label={showAnswer ? "Hide answer" : "Show answer"}
            >
              {showAnswer ? <FaEye className='cursor-pointer' size={16} /> : <FaEyeSlash className='cursor-pointer' size={16} />}
            </button>
          </div>

          {showAnswer && (
            <>
              <h4 className="font-medium text-[#4A5565] mb-2">Answer:</h4>
              <div className="text-neutral-200 mb-3 markdown-content">
                <ReactMarkdown>
                  {answer.answer}
                </ReactMarkdown>
              </div>

              {answer.articles && answer.articles.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm text-neutral-400 mb-2">Based on information from:</h5>
                  <ol className="text-xs text-neutral-500 list-decimal pl-5 space-y-1">
                    {answer.articles.map((article, index) => (
                      <li key={index}>
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#4A5565] hover:text-[#5A6575] hover:underline"
                        >
                          {article.title}
                        </a>
                        <span> - {article.source_name}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FollowUpQuestion;
