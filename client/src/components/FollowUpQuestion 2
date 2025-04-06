import React from 'react';

const FollowUpQuestion = ({ question, setQuestion, onSubmit, loading, answer }) => {
  return (
    <div className="mt-8 border-t border-neutral-700 pt-6">
      <h3 className="text-lg font-bold mb-4">Ask about this article</h3>
      <form onSubmit={onSubmit} className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., What are the key points? Who is involved? What is the timeline?"
            className="w-full p-3 pr-24 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none transition-all"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!question.trim() || loading}
            className="absolute right-2 top-2 px-4 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-2"></div>
            ) : (
              'Ask'
            )}
          </button>
        </div>
      </form>
      
      {answer && (
        <div className="animate-fade-in">
          <div className="flex items-start mb-2">
            <div className="bg-neutral-700 rounded-full w-8 h-8 flex items-center justify-center mr-3 mt-1">
              <span>🤖</span>
            </div>
            <div>
              <div className="text-sm text-neutral-400 mb-1">Answer based on article content:</div>
              <div className="text-neutral-200 whitespace-pre-line">{answer.answer}</div>
            </div>
          </div>
        </div>
      )}
      
      <div className="text-neutral-500 text-xs mt-4">
        Note: Answers are generated based only on the content of this article and may not reflect the complete picture.
      </div>
    </div>
  );
};

export default FollowUpQuestion;