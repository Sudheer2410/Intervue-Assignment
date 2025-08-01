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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-violet to-accent rounded-full mb-6">
            <span className="text-white text-sm font-medium">⚡ Intervue Poll</span>
          </div>
          
          <h1 className="text-4xl font-bold text-text mb-4">
            Welcome to the Live Polling System
          </h1>
          
          <p className="text-muted text-lg">
            Please select the role that best describes you to begin using the live polling system.
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="flex gap-6 mb-8">
          {/* Student Card */}
          <div 
            className={`flex-1 p-6 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedRole === 'student' 
                ? 'border-2 border-gradient-to-r from-violet to-accent bg-white shadow-lg' 
                : 'border border-gray-200 bg-white hover:border-violet/50'
            }`}
            onClick={() => setSelectedRole('student')}
          >
            <h3 className="text-xl font-semibold text-text mb-3">I'm a Student</h3>
            <p className="text-muted text-sm">
              Lorem Ipsum is simply dummy text of the printing and typesetting industry.
            </p>
          </div>

          {/* Teacher Card */}
          <div 
            className={`flex-1 p-6 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedRole === 'teacher' 
                ? 'border-2 border-gradient-to-r from-violet to-accent bg-white shadow-lg' 
                : 'border border-gray-200 bg-white hover:border-violet/50'
            }`}
            onClick={() => setSelectedRole('teacher')}
          >
            <h3 className="text-xl font-semibold text-text mb-3">I'm a Teacher</h3>
            <p className="text-muted text-sm">
              Submit answers and view live poll results in real-time.
            </p>
          </div>
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={handleContinue}
            className="px-8 py-4 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg text-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector; 