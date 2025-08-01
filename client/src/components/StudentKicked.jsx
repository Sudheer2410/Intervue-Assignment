import React from 'react';
import { useNavigate } from 'react-router-dom';

const StudentKicked = () => {
  const navigate = useNavigate();

  const handleTryAgain = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Header */}
        <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-violet to-accent rounded-full mb-8">
          <span className="text-white text-sm font-medium">⚡ Intervue Poll</span>
        </div>
        
        {/* Main Message */}
        <h1 className="text-3xl font-bold text-text mb-4">
          You've been Kicked out!
        </h1>
        
        {/* Subtext */}
        <p className="text-muted text-lg leading-relaxed mb-8">
          Looks like the teacher had removed you from the poll system. Please Try again sometime.
        </p>
        
        {/* Try Again Button */}
        <button
          onClick={handleTryAgain}
          className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default StudentKicked; 