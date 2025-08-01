import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pollResults, setPollResults] = useState(null);

  // Debug log when pollResults changes
  useEffect(() => {
    console.log('SocketContext: pollResults state changed:', pollResults);
  }, [pollResults]);

  useEffect(() => {
    // Connect to the backend server
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
    
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });
    
    newSocket.on('connect', () => {
      console.log('SocketContext: Connected to server');
      setIsConnected(true);
      setConnectionError(null);
      
      // Re-join if we have user info
      if (userRole && userName) {
        console.log('SocketContext: Re-joining as', userRole, userName);
        if (userRole === 'student') {
          newSocket.emit('join-student', { name: userName });
        } else if (userRole === 'teacher') {
          newSocket.emit('join-teacher');
        }
      }
    });

    newSocket.on('connect_error', (error) => {
      setConnectionError(`Failed to connect to server: ${error.message}`);
      setIsConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('SocketContext: Disconnected:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, you need to reconnect manually
        console.log('SocketContext: Server disconnected, attempting to reconnect...');
        setTimeout(() => {
          newSocket.connect();
        }, 1000);
      } else if (reason === 'io client disconnect') {
        // the disconnection was initiated by the client
        console.log('SocketContext: Client disconnected');
      } else {
        // the disconnection was initiated by the network
        console.log('SocketContext: Network disconnected, attempting to reconnect...');
        setTimeout(() => {
          newSocket.connect();
        }, 2000);
      }
    });

    newSocket.on('error', (error) => {
      setConnectionError(`Socket error: ${error.message}`);
    });

    // Global chat event listeners
    newSocket.on('chat-history', (history) => {
      setChatMessages(history);
    });

    newSocket.on('new-message', (message) => {
      setChatMessages(prev => {
        const newMessages = [...prev, message];
        return newMessages;
      });
      setUnreadMessages(prev => prev + 1);
    });

    // Global poll results listener
    newSocket.on('poll-results', (data) => {
      console.log('SocketContext: Received poll results:', data);
      console.log('SocketContext: Setting pollResults state');
      setPollResults(data);
      console.log('SocketContext: pollResults state updated');
    });

    // Clear poll results when new question is created
    newSocket.on('new-question', (question) => {
      setPollResults(null);
    });

    // Listen for successful join
    newSocket.on('joined', (data) => {
      setUserRole(data.role);
      setUserName(data.name);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Auto-join as teacher when socket connects
  useEffect(() => {
    if (socket && socket.connected && userRole === 'teacher') {
      socket.emit('join-teacher');
    }
  }, [socket, socket?.connected, userRole]);

  // Heartbeat to keep connection alive
  useEffect(() => {
    if (socket && socket.connected) {
      const heartbeat = setInterval(() => {
        if (socket.connected) {
          socket.emit('ping');
        }
      }, 30000); // Send ping every 30 seconds

      return () => clearInterval(heartbeat);
    }
  }, [socket]);

  const joinAsStudent = (name) => {
    if (socket && socket.connected) {
      console.log('SocketContext: Joining as student:', name);
      socket.emit('join-student', { name });
      setUserRole('student');
      setUserName(name);
    } else {
      console.error('SocketContext: Cannot join as student - socket not connected');
      setConnectionError('Cannot connect to server. Please refresh the page.');
    }
  };

  const joinAsTeacher = () => {
    if (socket && socket.connected) {
      console.log('SocketContext: Joining as teacher');
      socket.emit('join-teacher');
      setUserRole('teacher');
      setUserName('Teacher');
    } else {
      console.error('SocketContext: Cannot join as teacher - socket not connected');
      setConnectionError('Cannot connect to server. Please refresh the page.');
    }
  };

  const createPoll = (pollData) => {
    if (socket && socket.connected) {
      socket.emit('new-question', pollData);
    } else {
      console.error('SocketContext: Cannot create poll - socket not connected');
      setConnectionError('Cannot connect to server. Please refresh the page.');
    }
  };

  const submitAnswer = (questionId, selectedOption) => {
    if (socket && socket.connected) {
      socket.emit('student-answer', { questionId, selectedOption });
    } else {
      console.error('SocketContext: Cannot submit answer - socket not connected');
      setConnectionError('Cannot connect to server. Please refresh the page.');
    }
  };

  const kickStudent = (studentId) => {
    if (socket && socket.connected) {
      console.log('SocketContext: Kicking student:', studentId);
      socket.emit('kick-student', studentId);
    } else {
      console.error('SocketContext: Cannot kick student - socket not connected');
      setConnectionError('Cannot connect to server. Please refresh the page.');
    }
  };

  const endPoll = (questionId) => {
    if (socket && socket.connected) {
      console.log('SocketContext: Ending poll for question:', questionId);
      socket.emit('end-poll', questionId);
    } else {
      console.error('SocketContext: Cannot end poll - socket not connected');
      setConnectionError('Cannot connect to server. Please refresh the page.');
    }
  };

  const requestChatHistory = () => {
    if (socket && socket.connected) {
      socket.emit('request-chat-history');
    }
  };

  const requestPollResults = () => {
    if (socket && socket.connected) {
      console.log('SocketContext: Requesting poll results from server');
      socket.emit('request-poll-results');
    }
  };

  const clearUnreadMessages = () => {
    setUnreadMessages(0);
  };

  const clearPollResults = () => {
    setPollResults(null);
  };

  const value = {
    socket,
    isConnected,
    userRole,
    userName,
    connectionError,
    chatMessages,
    unreadMessages,
    pollResults,
    joinAsStudent,
    joinAsTeacher,
    createPoll,
    submitAnswer,
    kickStudent,
    endPoll,
    requestChatHistory,
    requestPollResults,
    clearUnreadMessages,
    clearPollResults,
    setPollResults,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 