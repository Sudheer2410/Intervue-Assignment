import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import Chat from './Chat';

const StudentResults = () => {
  const [showChat, setShowChat] = useState(false);
  const navigate = useNavigate();
  const { socket, isConnected, connectionError, unreadMessages, pollResults } = useSocket();

  // Extract question and results from pollResults
  const question = pollResults?.question;
  const results = pollResults?.results;

  useEffect(() => {
    if (socket) {
      console.log('StudentResults: Component mounted');
      console.log('StudentResults: pollResults from context:', pollResults);
      
      // Listen for poll results directly
      socket.on('poll-results', (data) => {
        console.log('StudentResults: Received poll-results directly:', data);
      });

      return () => {
        socket.off('poll-results');
      };
    }
  }, [socket, pollResults]);

  // Show connection error if any
  if (connectionError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-red-500 mb-4">
            Connection Error
          </h2>
          <p className="text-muted text-lg mb-4">
            {connectionError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Show loading if not connected or no results
  if (!isConnected || !pollResults || !question || !results) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">
            {!isConnected ? 'Connecting to server...' : 'Loading results...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text">
            Poll Results
          </h1>
          <button
            onClick={() => navigate('/student/lobby')}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back to Lobby
          </button>
        </div>

        {/* Question */}
        <div className="bg-text text-white p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold">{question.question}</h2>
        </div>

        {/* Results */}
        <div className="space-y-4 mb-6">
          {Object.entries(results).map(([index, result]) => (
            <div key={index} className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-text">
                  {result.option}
                </span>
                <span className="text-muted">
                  {result.count} votes ({result.percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-violet h-2 rounded-full transition-all duration-300"
                  style={{ width: `${result.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-muted text-center">
            Total responses: {Object.values(results).reduce((sum, result) => sum + result.count, 0)}
          </p>
        </div>
      </div>

      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6">
        <button 
          onClick={() => setShowChat(true)}
          className="w-14 h-14 bg-violet rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 flex items-center justify-center relative"
        >
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
          {unreadMessages > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </div>
          )}
        </button>
      </div>

      {/* Chat Modal */}
      <Chat isOpen={showChat} onClose={() => setShowChat(false)} />
    </div>
  );
};

export default StudentResults; 