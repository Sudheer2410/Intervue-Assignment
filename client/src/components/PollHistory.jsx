import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';

const PollHistory = () => {
  const [pollHistory, setPollHistory] = useState([]);
  const [deletingPolls, setDeletingPolls] = useState(new Set());
  const navigate = useNavigate();
  const { socket } = useSocket();

  useEffect(() => {
    if (socket) {
      socket.on('joined', (data) => {
        if (data.pollHistory) {
          console.log('PollHistory: Received poll history:', data.pollHistory);
          setPollHistory(data.pollHistory);
        }
      });

      socket.on('poll-history', (history) => {
        console.log('PollHistory: Received poll history from server:', history);
        setPollHistory(history);
      });

      // Request poll history when component mounts
      if (socket.connected) {
        console.log('PollHistory: Requesting poll history');
        socket.emit('request-poll-history');
      }

      socket.on('poll-deleted', (pollId) => {
        console.log('PollHistory: Poll deleted:', pollId);
        setPollHistory(prev => prev.filter(poll => poll.id !== pollId));
        setDeletingPolls(prev => {
          const newSet = new Set(prev);
          newSet.delete(pollId);
          return newSet;
        });
      });

      return () => {
        socket.off('joined');
        socket.off('poll-history');
        socket.off('poll-deleted');
      };
    }
  }, [socket]);

  const handleDeletePoll = (pollId, pollQuestion) => {
    console.log('Attempting to delete poll:', { pollId, pollQuestion });
    if (window.confirm(`Are you sure you want to delete this poll?\n\n"${pollQuestion}"\n\nThis action is permanent.`)) {
      console.log('Sending delete-poll event with ID:', pollId);
      setDeletingPolls(prev => new Set([...prev, pollId]));
      socket.emit('delete-poll', pollId.toString());
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-text">View Poll History</h1>
          <button
            onClick={() => navigate('/teacher')}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {pollHistory.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-text mb-4">No poll history yet</h2>
            <p className="text-muted">Start creating polls to see their results here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pollHistory.map((poll, index) => (
                <div key={poll.id} className="bg-white rounded-lg p-6 shadow-sm">
                {/* Question Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-text">
                      Question {index + 1}
                    </h3>
                    <button
                      onClick={() => handleDeletePoll(poll.id, poll.question)}
                      disabled={deletingPolls.has(poll.id)}
                      className="px-3 py-1 bg-violet text-white text-sm rounded hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingPolls.has(poll.id) ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                  <div className="bg-text text-white p-4 rounded-lg">
                    <p className="text-lg">{poll.question}</p>
                  </div>
                </div>

                {/* Results */}
                <div className="space-y-3">
                  {poll.options.map((option, optionIndex) => {
                    const result = poll.results[optionIndex] || { count: 0, percentage: 0 };
                    return (
                      <div key={optionIndex} className="flex items-center space-x-4">
                        <div className="w-8 h-8 rounded-full bg-violet text-white flex items-center justify-center text-sm font-semibold">
                          {optionIndex + 1}
                        </div>
                        <span className="flex-1 text-text">{option}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-4">
                          <div 
                            className="bg-violet h-2 rounded-full transition-all duration-500"
                            style={{ width: `${result.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-muted font-semibold">{result.percentage}%</span>
                      </div>
                    );
                  })}
                </div>

                {/* Poll Stats */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm text-muted">
                    <span>Total Responses: {poll.totalResponses}</span>
                    <span>Created: {formatDate(poll.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6">
        <button 
          className="w-12 h-12 bg-violet rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 flex items-center justify-center"
        >
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PollHistory; 