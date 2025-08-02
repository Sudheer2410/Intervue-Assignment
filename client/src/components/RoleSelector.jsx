import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';

const RoleSelector = () => {
  const [selectedRole, setSelectedRole] = useState('student');
  const navigate = useNavigate();
  const { joinAsStudent, joinAsTeacher } = useSocket();

  const handleContinue = () => {
    if (selectedRole === 'student') {
      navigate('/student');
    } else {
      joinAsTeacher();
      navigate('/teacher');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-violet to-accent rounded-full mb-6">
            <span className="text-white text-sm font-medium">⚡ Intervue Poll</span>
          </div>
          
          <h1 className="text-2xl md:text-4xl font-bold text-text mb-4">
            Welcome to the Live Polling System
          </h1>
          
          <p className="text-muted text-base md:text-lg">
            Please select the role that best describes you to begin using the live polling system.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-8">
          <div 
            className={`flex-1 p-4 md:p-6 rounded-lg cursor-pointer transition-all duration-150 ${
              selectedRole === 'student' 
                ? 'border-2 border-violet-500 bg-violet-50 shadow-lg' 
                : 'border border-gray-300 bg-white hover:border-violet-400 hover:bg-violet-50 hover:shadow-md'
            }`}
            onClick={() => setSelectedRole('student')}
          >
            <h3 className={`text-lg md:text-xl font-semibold mb-3 ${
              selectedRole === 'student' ? 'text-violet-700' : 'text-gray-800'
            }`}>
              I'm a Student
            </h3>
            <p className="text-muted text-sm">
              Join polls, submit answers and view live results in real-time.
            </p>
          </div>

          <div 
            className={`flex-1 p-4 md:p-6 rounded-lg cursor-pointer transition-all duration-150 ${
              selectedRole === 'teacher' 
                ? 'border-2 border-violet-500 bg-violet-50 shadow-lg' 
                : 'border border-gray-300 bg-white hover:border-violet-400 hover:bg-violet-50 hover:shadow-md'
            }`}
            onClick={() => setSelectedRole('teacher')}
          >
            <h3 className={`text-lg md:text-xl font-semibold mb-3 ${
              selectedRole === 'teacher' ? 'text-violet-700' : 'text-gray-800'
            }`}>
              I'm a Teacher
            </h3>
            <p className="text-muted text-sm">
              Create polls, manage questions and view detailed results.
            </p>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={handleContinue}
            className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg text-base md:text-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector; 