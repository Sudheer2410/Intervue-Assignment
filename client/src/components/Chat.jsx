import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';

const Chat = ({ isOpen, onClose, students = [] }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef(null);
  const { socket, userName, userRole, chatMessages, requestChatHistory, clearUnreadMessages } = useSocket();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    if (socket && isOpen) {
      requestChatHistory();
      clearUnreadMessages();
    }
  }, [socket, isOpen, requestChatHistory, clearUnreadMessages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !socket) return;

    setIsLoading(true);
    
    socket.emit('send-message', {
      message: newMessage,
      senderName: userName,
      senderRole: userRole
    });

    setNewMessage('');
    setIsLoading(false);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-full sm:w-80 bg-white shadow-lg border-l border-gray-200 z-50">
              {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-200">
          <h3 className="text-base md:text-lg font-semibold text-gray-800">Chat</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'chat'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab('participants')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'participants'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Participants
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'chat' ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  <p>No messages yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderName === userName ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-xs">
                      <div className="text-xs text-gray-600 mb-1">
                        {msg.senderName}
                        {msg.senderRole === 'teacher' && (
                          <span className="ml-1">👨‍🏫</span>
                        )}
                      </div>
                      <div
                        className={`px-3 py-2 rounded-lg ${
                          msg.senderName === userName
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-600 text-white'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isLoading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Participants Tab */
          <div className="flex-1 overflow-y-auto p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Name</h4>
            <div className="space-y-2">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <span className="text-sm text-gray-800">{student.name}</span>
                  {userRole === 'teacher' && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to kick ${student.name}?`)) {
                          // Kick student functionality
                          socket.emit('kick-student', student.id);
                        }
                      }}
                      className="text-xs text-violet-600 hover:text-violet-800 font-medium"
                    >
                      Kick
                    </button>
                  )}
                </div>
              ))}
              {students.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No participants yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat; 