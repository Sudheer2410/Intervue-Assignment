import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';

const StudentNameInput = () => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { socket, joinAsStudent } = useSocket();

  React.useEffect(() => {
    if (socket) {
      socket.on('joined', (data) => {
        if (data.success) {
          navigate('/student/lobby');
        }
      });

      socket.on('error', (data) => {
        setError(data.message);
        setIsLoading(false);
      });

      return () => {
        socket.off('joined');
        socket.off('error');
      };
    }
  }, [socket, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    setIsLoading(true);
    setError('');
    joinAsStudent(name.trim());
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-violet to-accent rounded-full mb-6">
            <span className="text-white text-sm font-medium">⚡ Intervue Poll</span>
          </div>
          
          <h1 className="text-3xl font-bold text-text mb-4">
            Let's Get Started
          </h1>
          
          <p className="text-muted text-sm leading-relaxed">
            If you're a student, you'll be able to <strong>submit your answers</strong>, participate in live polls, and see how your responses compare with your classmates.
          </p>
        </div>

        {/* Name Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text mb-2">
              Enter your Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet focus:border-transparent outline-none transition-all duration-200"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full px-6 py-4 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg text-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? 'Joining...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentNameInput; 