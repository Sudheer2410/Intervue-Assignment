import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import Chat from './Chat';

const StudentLobby = () => {
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [isWaiting, setIsWaiting] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const navigate = useNavigate();
  const { socket, userName, isConnected, connectionError, unreadMessages } = useSocket();

  useEffect(() => {
    if (socket) {
      console.log('StudentLobby: Socket connected, setting up listeners');
      console.log('StudentLobby: Current socket state:', socket.connected);
      
      // Listen for new questions
      socket.on('new-question', (question) => {
        console.log('StudentLobby: Received new question:', question);
        setActiveQuestion(question);
        setIsWaiting(false);
        navigate('/student/poll');
      });

      // Listen for kick event
      socket.on('student-kick', (data) => {
        console.log('StudentLobby: Student kicked:', data);
        navigate('/student/kicked');
      });

      // Listen for joined confirmation
      socket.on('joined', (data) => {
        console.log('StudentLobby: Joined successfully:', data);
        if (data.activeQuestions && data.activeQuestions.length > 0) {
          console.log('StudentLobby: Found active questions, navigating to poll');
          setActiveQuestion(data.activeQuestions[0]); // Use first active question
          setIsWaiting(false);
          navigate('/student/poll');
        }
      });

      // Listen for active questions response
      socket.on('active-questions', (questions) => {
        console.log('StudentLobby: Received active questions:', questions);
        if (questions && questions.length > 0) {
          console.log('StudentLobby: Found active questions, navigating to poll');
          setActiveQuestion(questions[0]); // Use first active question
          setIsWaiting(false);
          navigate('/student/poll');
        }
      });

      // Listen for errors
      socket.on('error', (data) => {
        console.error('StudentLobby: Received error:', data);
      });

      // Check if there's already an active question
      if (socket.connected) {
        console.log('StudentLobby: Checking for active question');
        socket.emit('check-active-question');
      }

      return () => {
        console.log('StudentLobby: Cleaning up socket listeners');
        socket.off('new-question');
        socket.off('student-kick');
        socket.off('joined');
        socket.off('active-questions');
        socket.off('error');
      };
    }
  }, [socket, navigate]);

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

  // Show loading if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-text mb-4">
            Connecting to server...
          </h2>
          <p className="text-muted text-lg">
            Please wait while we establish a connection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        {/* Header */}
        <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-violet to-accent rounded-full mb-8">
          <span className="text-white text-sm font-medium">⚡ Intervue Poll</span>
        </div>
        
        {/* Loading Spinner */}
        <div className="mb-8">
          <div className="w-16 h-16 border-4 border-violet border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        
        {/* Message */}
        <h2 className="text-2xl font-semibold text-text mb-4">
          Wait for the teacher to ask questions..
        </h2>
        
        {userName && (
          <p className="text-muted text-lg">
            Welcome, <span className="font-semibold text-text">{userName}</span>!
          </p>
        )}

        {/* Connection Status */}
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-700 text-sm">Connected to server</span>
          </div>
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

export default StudentLobby; 