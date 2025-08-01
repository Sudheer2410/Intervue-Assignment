import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import Chat from './Chat';

const TeacherDashboard = () => {
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [students, setStudents] = useState([]);
  const [responses, setResponses] = useState({});
  const [realTimeResults, setRealTimeResults] = useState({});
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [allStudentsAnswered, setAllStudentsAnswered] = useState(false);
  const [progress, setProgress] = useState({ answered: 0, total: 0 });
  const [endingPolls, setEndingPolls] = useState(new Set());
  const navigate = useNavigate();
  const { socket, kickStudent, endPoll, unreadMessages } = useSocket();

  // Debug: Log socket status
  useEffect(() => {
    console.log("Teacher socket:", socket);
    console.log("Teacher socket connected:", socket?.connected);
  }, [socket]);

  // Join as teacher when socket is connected
  useEffect(() => {
    if (socket && socket.connected) {
      console.log('TeacherDashboard: Joining as teacher');
      socket.emit('join-teacher');
    }
  }, [socket, socket?.connected]);

  useEffect(() => {
    if (socket && socket.connected) {
      console.log('TeacherDashboard: Socket connected, setting up listeners');
      
      socket.on('joined', (data) => {
        console.log('TeacherDashboard: Joined successfully:', data);
        if (data.activeQuestions) {
          setActiveQuestions(data.activeQuestions);
        }
        if (data.students) {
          setStudents(data.students.filter(s => s.role === 'student'));
        }
      });

      socket.on('student-joined', (data) => {
        console.log('TeacherDashboard: Student joined:', data);
        setStudents(prev => [...prev, data.student]);
        
        // Update progress if provided
        if (data.progress) {
          setProgress({ answered: data.progress.answered, total: data.progress.total });
        }
      });

      socket.on('student-disconnected', (data) => {
        console.log('TeacherDashboard: Student disconnected:', data);
        setStudents(prev => prev.filter(s => s.id !== data.studentId));
        
        // Update progress if provided
        if (data.progress) {
          setProgress({ answered: data.progress.answered, total: data.progress.total });
        }
      });

      socket.on('student-answered', (data) => {
        console.log('TeacherDashboard: Student answered:', data);
        console.log('TeacherDashboard: Progress data from server:', data.progress);
        setResponses(prev => {
          const newResponses = {
            ...prev,
            [data.questionId]: {
              ...prev[data.questionId],
              [data.student]: data.selectedOption
            }
          };
          
          // Use server's progress data for accurate count
          if (data.progress) {
            console.log('TeacherDashboard: Setting progress to:', data.progress);
            setProgress({ answered: data.progress.answered, total: data.progress.total });
          }
          
          return newResponses;
        });
      });

      socket.on('all-students-answered', (data) => {
        console.log('TeacherDashboard: All students answered:', data);
        setAllStudentsAnswered(true);
        setProgress({ answered: data.answeredStudents, total: data.totalStudents });
      });

      socket.on('poll-results', (data) => {
        console.log('TeacherDashboard: Poll results:', data);
        // Remove the ended question from active questions
        setActiveQuestions(prev => prev.filter(q => q.id !== data.question.id));
        // Clear the loading state for this question
        setEndingPolls(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.question.id);
          return newSet;
        });
        // Don't clear responses completely, just remove the specific question
        setResponses(prev => {
          const newResponses = { ...prev };
          delete newResponses[data.question.id];
          return newResponses;
        });
        setAllStudentsAnswered(false);
        setProgress({ answered: 0, total: 0 });
      });

      socket.on('active-questions-updated', (questions) => {
        console.log('TeacherDashboard: Active questions updated:', questions);
        setActiveQuestions(questions);
      });

      socket.on('real-time-results', (data) => {
        console.log('TeacherDashboard: Received real-time results:', data);
        setRealTimeResults(prev => ({
          ...prev,
          [data.questionId]: data
        }));
      });

      return () => {
        console.log('TeacherDashboard: Cleaning up socket listeners');
        socket.off('joined');
        socket.off('student-joined');
        socket.off('student-disconnected');
        socket.off('student-answered');
        socket.off('all-students-answered');
        socket.off('poll-results');
        socket.off('active-questions-updated');
        socket.off('real-time-results');
      };
    }
  }, [socket, socket?.connected]);

  const handleKickStudent = (studentId) => {
    if (kickStudent) {
      kickStudent(studentId);
    }
  };

  const calculateResults = (question, questionResponses) => {
    const results = [];
    const totalResponses = Object.keys(questionResponses).length;
    
    if (!question || totalResponses === 0) {
      question?.options.forEach((_, index) => {
        results[index] = { count: 0, percentage: 0 };
      });
      return results;
    }
    
    question.options.forEach((option, index) => {
      const count = Object.values(questionResponses).filter(r => r === index.toString()).length;
      results[index] = {
        option,
        count,
        percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0
      };
    });
    
    return results;
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Question</h1>
          <button
            onClick={() => navigate('/teacher/history')}
            className="flex items-center space-x-2 px-4 py-2 bg-violet text-white rounded-lg hover:bg-purple-600 transition-colors shadow-md"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            <span>View Poll history</span>
          </button>
        </div>

        {activeQuestions.length > 0 ? (
          <>
            {/* Active Questions */}
            <div className="space-y-6">
              {activeQuestions.map((question, questionIndex) => {
                const questionResponses = responses[question.id] || {};
                const questionResults = calculateResults(question, questionResponses);
                const realTimeData = realTimeResults[question.id];
                
                return (
                  <div key={question.id} className="border border-purple-200 rounded-lg overflow-hidden shadow-lg">
                    {/* Question Header */}
                                         <div className="bg-gray-700 text-white p-4">
                       <h2 className="text-xl font-semibold text-center">Question {question.questionNumber || questionIndex + 1}: {question.question}</h2>
                     </div>
               
                                         {/* Options Body */}
                     <div className="bg-white p-4 space-y-3">
                       {question.options.map((option, index) => {
                         // Use real-time results if available, otherwise fall back to calculated results
                         const result = realTimeData?.results?.[index] || questionResults[index] || { count: 0, percentage: 0 };
                         const isHighestVoted = result.percentage === Math.max(...question.options.map((_, i) => {
                           const realTimeResult = realTimeData?.results?.[i];
                           const calculatedResult = questionResults[i];
                           const finalResult = realTimeResult || calculatedResult || { percentage: 0 };
                           return finalResult.percentage;
                         }));
                         
                         return (
                           <div 
                             key={index} 
                             className={`relative p-3 rounded-lg border-2 overflow-hidden ${
                               isHighestVoted 
                                 ? 'border-purple-300' 
                                 : 'border-gray-200'
                             }`}
                           >
                             {/* Progress Background Fill */}
                             <div 
                               className="absolute inset-0 bg-gradient-to-r from-violet to-purple-600 transition-all duration-300 ease-out"
                               style={{ width: `${result.percentage}%` }}
                             ></div>
                             
                             {/* Content Layer */}
                             <div className="relative flex items-center z-10">
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mr-4 ${
                                 isHighestVoted ? 'bg-violet text-white' : 'bg-gray-400 text-white'
                               }`}>
                                 {index + 1}
                               </div>
                               <span className={`flex-1 font-medium ${
                                 isHighestVoted ? 'text-gray-800' : 'text-gray-700'
                               }`}>{option}</span>
                               <span className={`font-semibold min-w-[3rem] text-right ${
                                 isHighestVoted ? 'text-gray-800' : 'text-gray-600'
                               }`}>{result.percentage}%</span>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                    
                    {/* End Poll Button */}
                    <div className="bg-white p-4 flex justify-between items-center">
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to end the poll for: "${question.question}"?`)) {
                            setEndingPolls(prev => new Set([...prev, question.id]));
                            endPoll(question.id);
                          }
                        }}
                        disabled={endingPolls.has(question.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {endingPolls.has(question.id) ? 'Ending...' : 'End Poll'}
                      </button>
                      
                      {/* Ask a new question button - positioned at bottom right of card */}
                      <button
                        onClick={() => navigate('/teacher/create-poll')}
                        className="px-6 py-3 bg-gradient-to-r from-violet to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 shadow-lg"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        <span>Ask a new question</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>




          </>
        ) : (
          /* No Active Questions */
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-800 mb-8">No active polls</h2>
            <button
              onClick={() => navigate('/teacher/create-poll')}
              className="px-6 py-3 bg-violet text-white font-semibold rounded-lg hover:bg-purple-600 transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 shadow-lg"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>Ask a new question</span>
            </button>
          </div>
        )}



        {/* Participants Modal */}
        {showParticipants && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Participants</h3>
                <button
                  onClick={() => setShowParticipants(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-2">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-800">{student.name}</span>
                    <button
                      onClick={() => handleKickStudent(student.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Kick out
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6">
        <button 
          onClick={() => setShowChat(true)}
          className="w-12 h-12 bg-violet rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 flex items-center justify-center relative"
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

export default TeacherDashboard; 