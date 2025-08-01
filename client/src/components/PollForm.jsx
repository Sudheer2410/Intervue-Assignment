import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';

const PollForm = () => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [timer, setTimer] = useState(60);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { socket, createPoll } = useSocket();

  React.useEffect(() => {
    if (socket) {
      socket.on('error', (data) => {
        setError(data.message);
        setIsLoading(false);
      });

      socket.on('new-question', () => {
        navigate('/teacher');
      });

      return () => {
        socket.off('error');
        socket.off('new-question');
      };
    }
  }, [socket, navigate]);

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      if (correctAnswer >= index) {
        setCorrectAnswer(Math.max(0, correctAnswer - 1));
      }
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    if (options.some(option => !option.trim())) {
      setError('Please fill in all options');
      return;
    }

    if (options.length < 2) {
      setError('Please add at least 2 options');
      return;
    }

    setIsLoading(true);
    setError('');

    const pollData = {
      question: question.trim(),
      options: options.map(opt => opt.trim()),
      correctAnswer,
      timer
    };

    console.log('PollForm: Creating poll with data:', pollData);
    createPoll(pollData);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-violet to-accent rounded-full mb-6">
            <span className="text-white text-sm font-medium">⚡ Intervue Poll</span>
          </div>
          
          <h1 className="text-3xl font-bold text-text mb-4">
            Let's Get Started
          </h1>
          
          <p className="text-muted text-lg">
            you'll have the ability to create and manage polls, ask questions, and monitor your students' responses in real-time.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Section */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Enter your question
            </label>
            <div className="relative">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter your question here..."
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet focus:border-transparent outline-none resize-none"
                rows={4}
                maxLength={100}
              />
              <div className="absolute top-2 right-2">
                <select
                  value={timer}
                  onChange={(e) => setTimer(parseInt(e.target.value))}
                  className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-violet focus:border-transparent outline-none"
                >
                  <option value={30}>30 seconds</option>
                  <option value={60}>60 seconds</option>
                  <option value={90}>90 seconds</option>
                  <option value={120}>120 seconds</option>
                </select>
              </div>
              <div className="absolute bottom-2 right-2 text-xs text-muted">
                {question.length}/100
              </div>
            </div>
          </div>

          {/* Options Section */}
          <div>
            <label className="block text-sm font-medium text-text mb-4">
              Edit Options
            </label>
            <div className="space-y-4">
              {options.map((option, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-8 h-8 rounded-full bg-violet text-white flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet focus:border-transparent outline-none"
                  />
                  
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-text">Is it Correct?</span>
                    <div className="flex space-x-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="correctAnswer"
                          value={index}
                          checked={correctAnswer === index}
                          onChange={(e) => setCorrectAnswer(parseInt(e.target.value))}
                          className="text-violet focus:ring-violet"
                        />
                        <span className="ml-2 text-sm">Yes</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="correctAnswer"
                          value={index}
                          checked={correctAnswer !== index}
                          onChange={() => setCorrectAnswer(correctAnswer === index ? 0 : correctAnswer)}
                          className="text-violet focus:ring-violet"
                        />
                        <span className="ml-2 text-sm">No</span>
                      </label>
                    </div>
                    
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {options.length < 6 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-4 px-4 py-2 text-violet border border-violet rounded-lg hover:bg-violet hover:text-white transition-colors"
              >
                + Add More option
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 text-red-500 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? 'Creating...' : 'Ask Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PollForm; 