import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import RoleSelector from './components/RoleSelector';
import StudentNameInput from './components/StudentNameInput';
import StudentLobby from './components/StudentLobby';
import StudentPollView from './components/StudentPollView';
import StudentResults from './components/StudentResults';
import StudentKicked from './components/StudentKicked';
import TeacherDashboard from './components/TeacherDashboard';
import PollForm from './components/PollForm';
import PollHistory from './components/PollHistory';

function App() {
  return (
    <SocketProvider>
      <div className="min-h-screen bg-background">
        <Routes>
          {/* Role Selection */}
          <Route path="/" element={<RoleSelector />} />
          
          {/* Student Routes */}
          <Route path="/student" element={<StudentNameInput />} />
          <Route path="/student/lobby" element={<StudentLobby />} />
          <Route path="/student/poll" element={<StudentPollView />} />
          <Route path="/student/results" element={<StudentResults />} />
          <Route path="/student/kicked" element={<StudentKicked />} />
          
          {/* Teacher Routes */}
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/teacher/create-poll" element={<PollForm />} />
          <Route path="/teacher/history" element={<PollHistory />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </SocketProvider>
  );
}

export default App; 