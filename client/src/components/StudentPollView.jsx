import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import Chat from './Chat';

const StudentPollView = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [timeLeft, setTimeLeft] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [realTimeResults, setRealTimeResults] = useState({});
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const { socket, submitAnswer, isConnected, connectionError, unreadMessages, setPollResults } = useSocket();

  useEffect(() => {
    if (socket) {
      console.log('StudentPollView: Setting up socket listeners');
      
      socket.on('joined', (data) => {
        console.log('StudentPollView: Joined successfully:', data);
        if (data.activeQuestions && data.activeQuestions.length > 0) {
          console.log('StudentPollView: Received active questions on join:', data.activeQuestions);
          setQuestions(data.activeQuestions);
          // Initialize state for all active questions
          const newTimeLeft = {};
          const newSelectedOptions = {};
          const newHasSubmitted = {};
          
          data.activeQuestions.forEach(question => {
            newTimeLeft[question.id] = question.timer;
            newSelectedOptions[question.id] = null;
            newHasSubmitted[question.id] = false;
          });
          
          setTimeLeft(newTimeLeft);
          setSelectedOptions(newSelectedOptions);
          setHasSubmitted(newHasSubmitted);
          setIsLoading(false);
        }
      });

      socket.on('active-questions', (questions) => {
        console.log('StudentPollView: Received active questions:', questions);
        setQuestions(questions);
        // Initialize state for all active questions
        const newTimeLeft = {};
        const newSelectedOptions = {};
        const newHasSubmitted = {};
        
        questions.forEach(question => {
          newTimeLeft[question.id] = question.timer;
          newSelectedOptions[question.id] = null;
          newHasSubmitted[question.id] = false;
        });
        
        setTimeLeft(newTimeLeft);
        setSelectedOptions(newSelectedOptions);
        setHasSubmitted(newHasSubmitted);
        setIsLoading(false);
      });

      socket.on('new-question', (newQuestion) => {
        console.log('StudentPollView: Received new question:', newQuestion);
        setQuestions(prev => {
          // Check if question already exists
          const exists = prev.find(q => q.id === newQuestion.id);
          if (!exists) {
            return [...prev, newQuestion];
          }
          return prev;
        });
        setTimeLeft(prev => ({
          ...prev,
          [newQuestion.id]: newQuestion.timer
        }));
        setSelectedOptions(prev => ({
          ...prev,
          [newQuestion.id]: null
        }));
        setHasSubmitted(prev => ({
          ...prev,
          [newQuestion.id]: false
        }));
        setError('');
        setIsLoading(false);
      });

      socket.on('poll-results', (data) => {
        console.log('StudentPollView: Poll ended, showing results inline');
        console.log('StudentPollView: Received poll-results data:', data);
        // Remove the ended question from questions list
        setQuestions(prev => prev.filter(q => q.id !== data.question.id));
        // Directly update SocketContext with poll results
        setPollResults(data);
        // Show results inline instead of navigating
        setShowResults(true);
      });

      socket.on('real-time-results', (data) => {
        console.log('StudentPollView: Received real-time results:', data);
        setRealTimeResults(prev => ({
          ...prev,
          [data.questionId]: data
        }));
        // Don't show results immediately - only after student submits
      });

      socket.on('student-kick', () => {
        console.log('StudentPollView: Student kicked, navigating to kicked page');
        navigate('/student/kicked');
      });

      socket.on('answer-submitted', (data) => {
        console.log('StudentPollView: Answer submitted successfully');
        if (data.questionId) {
          setHasSubmitted(prev => ({
            ...prev,
            [data.questionId]: true
          }));
          
          // Show results immediately after submitting
          setShowResults(true);
          
          // Automatically move to next question after a few seconds
          setTimeout(() => {
            setCurrentQuestionIndex(prev => {
              const nextIndex = prev + 1;
              if (nextIndex < questions.length) {
                console.log('StudentPollView: Moving to next question:', nextIndex);
                // Reset states for next question
                setShowResults(false);
                setRealTimeResults(prev => {
                  const newResults = { ...prev };
                  delete newResults[data.questionId];
                  return newResults;
                });
              } else {
                console.log('StudentPollView: No more questions, showing waiting message');
              }
              return nextIndex;
            });
          }, 3000); // Wait 3 seconds before moving to next question
        } else {
          // Fallback for backward compatibility
          setHasSubmitted(prev => {
            const newState = {};
            Object.keys(prev).forEach(key => {
              newState[key] = true;
            });
            return newState;
          });
        }
      });

      socket.on('error', (data) => {
        console.error('StudentPollView: Received error:', data);
        setError(data.message);
      });

      // Check if there's already an active question
      if (socket.connected) {
        console.log('StudentPollView: Checking for active question');
        socket.emit('check-active-question');
      }

      return () => {
        console.log('StudentPollView: Cleaning up socket listeners');
        socket.off('joined');
        socket.off('active-questions');
        socket.off('new-question');
        socket.off('poll-results');
        socket.off('real-time-results');
        socket.off('student-kick');
        socket.off('answer-submitted');
        socket.off('error');
      };
    }
  }, [socket, navigate, setPollResults]);

  useEffect(() => {
    const timers = {};
    
    Object.keys(timeLeft).forEach(questionId => {
      if (timeLeft[questionId] > 0 && !hasSubmitted[questionId]) {
        timers[questionId] = setInterval(() => {
          setTimeLeft((prev) => {
            const newTimeLeft = { ...prev };
            if (newTimeLeft[questionId] <= 1) {
              clearInterval(timers[questionId]);
              newTimeLeft[questionId] = 0;
            } else {
              newTimeLeft[questionId] = newTimeLeft[questionId] - 1;
            }
            return newTimeLeft;
          });
        }, 1000);
      }
    });

    return () => {
      Object.values(timers).forEach(timer => clearInterval(timer));
    };
  }, [timeLeft, hasSubmitted]);

  const handleOptionSelect = (questionId, optionIndex) => {
    if (!hasSubmitted[questionId] && timeLeft[questionId] > 0) {
      setSelectedOptions(prev => ({
        ...prev,
        [questionId]: optionIndex
      }));
    }
  };

  const handleSubmit = (questionId) => {
    const selectedOption = selectedOptions[questionId];
    if (selectedOption !== null && !hasSubmitted[questionId] && timeLeft[questionId] > 0) {
      console.log('StudentPollView: Submitting answer for question', questionId, ':', selectedOption);
      submitAnswer(questionId, selectedOption.toString());
      // Mark as submitted immediately to hide submit button
      setHasSubmitted(prev => ({
        ...prev,
        [questionId]: true
      }));
      // Show results immediately after voting
      setShowResults(true);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  // Show loading if not connected or still loading
  if (!isConnected || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">
            {!isConnected ? 'Connecting to server...' : 'Loading question...'}
          </p>
        </div>
      </div>
    );
  }

  // Show message if no questions are available or waiting for next question
  if (questions.length === 0 || currentQuestionIndex >= questions.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-text mb-4">
            {questions.length === 0 ? 'No Active Questions' : 'Waiting for Next Question'}
          </h2>
          <p className="text-muted text-lg">
            {questions.length === 0 
              ? 'Wait for the teacher to ask questions.' 
              : 'You have completed all available questions. Wait for the teacher to ask more questions.'
            }
          </p>
          <button
            onClick={() => navigate('/student/lobby')}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  // Show current question only
  const currentQuestion = questions[currentQuestionIndex];
  const questionTimeLeft = timeLeft[currentQuestion.id] || 0;
  const questionSelectedOption = selectedOptions[currentQuestion.id];
  const questionHasSubmitted = hasSubmitted[currentQuestion.id] || false;
  const currentQuestionResults = realTimeResults[currentQuestion.id];
  
  // Ensure results stay visible if student has submitted
  const shouldShowResults = questionHasSubmitted || showResults;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        {/* Current Question */}
        <div className="border border-gray-200 rounded-lg p-6 bg-white">
          {/* Question Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-text">
              Question {currentQuestion.questionNumber || currentQuestionIndex + 1}
            </h1>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className={`text-lg font-semibold ${questionTimeLeft <= 10 ? 'text-red-500' : 'text-text'}`}>
                {formatTime(questionTimeLeft)}
              </span>
            </div>
          </div>

          {/* Question */}
          <div className="bg-text text-white p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold">{currentQuestion.question}</h2>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option, index) => {
              const result = currentQuestionResults?.results[index];
              const percentage = result ? result.percentage : 0;
              const count = result ? result.count : 0;
              
              return (
                <div
                  key={index}
                  onClick={() => handleOptionSelect(currentQuestion.id, index)}
                  className={`relative p-4 rounded-lg cursor-pointer transition-all duration-200 overflow-hidden ${
                    questionSelectedOption === index
                      ? 'border-2 border-violet'
                      : 'border border-gray-200 hover:border-violet/50'
                  }`}
                >
                  {/* Progress bar background - only show after student submits for current question */}
                  {currentQuestionResults && shouldShowResults && currentQuestion.id === currentQuestionResults.questionId && questionHasSubmitted && (
                    <div 
                      className="absolute inset-0 bg-violet transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  )}
                  
                  {/* Content overlaid on progress bar */}
                  <div className="relative flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      questionSelectedOption === index
                        ? 'bg-white text-violet'
                        : currentQuestionResults && shouldShowResults && currentQuestion.id === currentQuestionResults.questionId && questionHasSubmitted
                        ? 'bg-white text-violet'
                        : 'bg-gray-100 text-text'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="flex-1">{option}</span>
                    
                    {/* Percentage text - only show after student submits for current question */}
                    {currentQuestionResults && shouldShowResults && currentQuestion.id === currentQuestionResults.questionId && questionHasSubmitted && (
                      <span className="text-sm font-medium text-text">
                        {percentage}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Button - only show when not submitted */}
          {!questionHasSubmitted && questionTimeLeft > 0 && (
            <div className="flex justify-end">
              <button
                onClick={() => handleSubmit(currentQuestion.id)}
                disabled={questionSelectedOption === null}
                className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Submit
              </button>
            </div>
          )}

          {/* Status Message */}
          {shouldShowResults && (
            <div className="mt-4 text-center">
              <p className="text-muted">
                Wait for the teacher to ask a new question..
              </p>
            </div>
          )}

          {questionTimeLeft === 0 && !questionHasSubmitted && (
            <div className="mt-4 text-center">
              <p className="text-red-500 font-semibold">
                Time's up! You can no longer submit an answer for this question.
              </p>
            </div>
          )}
        </div>

                  {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-500 rounded-lg">
              {error}
            </div>
          )}
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

export default StudentPollView; 