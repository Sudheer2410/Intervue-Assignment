const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory state
const state = {
  activeQuestions: [], // Array of active questions
  students: new Map(), // socketId -> studentInfo
  responses: new Map(), // questionId -> Map of studentId -> response
  pollHistory: [],
  timer: null,
  messages: [], // Chat messages
  disconnectedStudents: new Map() // socketId -> disconnectTime for cleanup
};

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Student joins
  socket.on('join-student', (studentData) => {
    const { name } = studentData;
    console.log(`Student ${name} (${socket.id}) attempting to join`);
    
    // Check if name is already taken by a different socket
    const existingStudent = Array.from(state.students.values()).find(
      student => student.name === name && student.id !== socket.id
    );
    
    if (existingStudent) {
      console.log(`Student ${name} - name already taken by ${existingStudent.id}`);
      socket.emit('error', { message: 'Name already taken. Please choose another name.' });
      return;
    }

    // Check if this student already exists with a different socket ID
    const existingStudentWithSameName = Array.from(state.students.values()).find(
      student => student.name === name
    );
    
    if (existingStudentWithSameName) {
      // Update the existing student's socket ID
      console.log(`Student ${name} reconnecting, updating socket ID from ${existingStudentWithSameName.id} to ${socket.id}`);
      state.students.delete(existingStudentWithSameName.id);
      existingStudentWithSameName.id = socket.id;
      state.students.set(socket.id, existingStudentWithSameName);
      
      // Remove from disconnected list if they were there
      state.disconnectedStudents.delete(existingStudentWithSameName.id);
      state.disconnectedStudents.delete(socket.id);
    } else {
      // Add new student to state
      state.students.set(socket.id, {
        id: socket.id,
        name: name,
        role: 'student'
      });
      
      // Remove from disconnected list if they were there
      state.disconnectedStudents.delete(socket.id);
    }

    console.log(`Student ${name} joined successfully`);
    console.log(`Total students in state: ${Array.from(state.students.values()).filter(s => s.role === 'student').length}`);

    // Send current state to student
    const joinData = { 
      success: true, 
      activeQuestions: state.activeQuestions,
      students: Array.from(state.students.values())
    };
    console.log(`Student ${name} joined successfully. Active questions:`, state.activeQuestions.length);
    socket.emit('joined', joinData);

    // Send real-time results for any active questions
    state.activeQuestions.forEach(question => {
      const results = calculateResults(question.id);
      const questionResponses = state.responses.get(question.id);
      const studentStudents = Array.from(state.students.values()).filter(s => s.role === 'student');
      
      socket.emit('real-time-results', {
        questionId: question.id,
        results: results,
        totalResponses: questionResponses ? questionResponses.size : 0,
        totalStudents: studentStudents.length
      });
    });

    // Notify teacher of new student with updated progress
    const studentStudents = Array.from(state.students.values()).filter(s => s.role === 'student');
    const totalStudents = studentStudents.length;
    const answeredStudents = state.responses.size;
    
    socket.broadcast.emit('student-joined', {
      student: { id: socket.id, name: name },
      progress: {
        answered: answeredStudents,
        total: totalStudents
      }
    });

    console.log(`Student ${name} joined successfully`);
  });

  // Check for active questions
  socket.on('check-active-question', () => {
    console.log(`Student ${socket.id} checking for active questions`);
    if (state.activeQuestions.length > 0) {
      console.log(`Sending ${state.activeQuestions.length} active questions to student ${socket.id}`);
      socket.emit('active-questions', state.activeQuestions);
    } else {
      console.log(`No active questions for student ${socket.id}`);
    }
  });

  // Teacher joins
  socket.on('join-teacher', () => {
    console.log(`Teacher (${socket.id}) joining`);
    state.students.set(socket.id, {
      id: socket.id,
      name: 'Teacher',
      role: 'teacher'
    });

    const joinData = { 
      success: true,
      students: Array.from(state.students.values()),
      activeQuestions: state.activeQuestions,
      pollHistory: state.pollHistory
    };
    console.log(`Teacher joined successfully. Active questions:`, state.activeQuestions.length);
    socket.emit('joined', joinData);

    console.log('Teacher joined successfully');
  });

  // Teacher creates new question
  socket.on('new-question', (questionData) => {
    console.log('Teacher creating new question:', questionData);
    
    const { question, options, correctAnswer, timer = 60 } = questionData;
    
    const newQuestion = {
      id: Date.now().toString(),
      questionNumber: state.activeQuestions.length + 1,
      question,
      options,
      correctAnswer,
      timer,
      startTime: Date.now(),
      endTime: Date.now() + (timer * 1000)
    };

    // Add to active questions
    state.activeQuestions.push(newQuestion);
    
    // Initialize responses for this question
    state.responses.set(newQuestion.id, new Map());

    // Broadcast to all students
    console.log(`Broadcasting new question to ${io.sockets.sockets.size} connected sockets`);
    io.emit('new-question', newQuestion);

    // Notify teacher of updated active questions
    io.emit('active-questions-updated', state.activeQuestions);

    console.log('New question created and broadcasted:', question);
  });

  // Student submits answer
  socket.on('student-answer', (answerData) => {
    const { questionId, selectedOption } = answerData;
    let student = state.students.get(socket.id);

    console.log(`Student ${student?.name || 'Unknown'} submitting answer:`, answerData);

    // If student is not in state, try to find them by socket ID
    if (!student) {
      console.log(`Student not found in state for socket ${socket.id}, adding fallback`);
      student = {
        id: socket.id,
        name: 'Unknown Student',
        role: 'student'
      };
      state.students.set(socket.id, student);
      console.log(`Added fallback student to state:`, student);
    }

    // Find the active question
    const activeQuestion = state.activeQuestions.find(q => q.id === questionId);
    if (!activeQuestion) {
      console.log('Invalid submission - question not found');
      console.log('Active questions:', state.activeQuestions.map(q => q.id));
      console.log('Question ID from client:', questionId);
      socket.emit('error', { message: 'Question not found or no longer active.' });
      return;
    }

    // Get responses for this question
    const questionResponses = state.responses.get(questionId);
    if (!questionResponses) {
      console.log('Question responses not initialized');
      socket.emit('error', { message: 'Question responses not initialized.' });
      return;
    }

    // Check if already answered this question
    if (questionResponses.has(student.id)) {
      console.log(`Student ${student.name} already submitted an answer for question ${questionId}`);
      socket.emit('error', { message: 'You have already submitted an answer for this question.' });
      return;
    }

    // Record response for this question
    questionResponses.set(student.id, {
      studentId: student.id,
      studentName: student.name,
      selectedOption,
      timestamp: Date.now()
    });

    // Notify teacher of new response with progress data
    const studentStudents = Array.from(state.students.values()).filter(s => s.role === 'student');
    const totalStudents = studentStudents.length;
    const answeredStudents = questionResponses.size;
    
    console.log(`Server: Student ${student.name} answered question ${questionId}. Progress: ${answeredStudents}/${totalStudents}`);
    console.log(`Server: Student students:`, studentStudents.map(s => s.name));
    console.log(`Server: All users:`, Array.from(state.students.values()).map(s => `${s.name} (${s.role})`));
    
    socket.broadcast.emit('student-answered', {
      questionId,
      student: student.name,
      selectedOption,
      progress: {
        answered: answeredStudents,
        total: totalStudents
      }
    });

    // Send confirmation to student
    console.log(`Sending answer-submitted confirmation to student ${student.name}`);
    socket.emit('answer-submitted', { success: true, questionId });

    console.log(`Student ${student.name} answered question ${questionId}: ${selectedOption}`);

    // Broadcast real-time results to all students (but don't affect their submission state)
    const realTimeResults = calculateResults(questionId);
    io.emit('real-time-results', {
      questionId,
      results: realTimeResults,
      totalResponses: questionResponses.size,
      totalStudents: totalStudents
    });

    // Check if all students have answered this question
    console.log('Calling checkIfAllStudentsAnswered()');
    checkIfAllStudentsAnswered(questionId);
  });

  // Helper function to check if all students have answered
  function checkIfAllStudentsAnswered(questionId) {
    const allStudents = Array.from(state.students.values());
    const studentStudents = allStudents.filter(s => s.role === 'student');
    const totalStudents = studentStudents.length;
    
    // Get responses for this specific question
    const questionResponses = state.responses.get(questionId);
    if (!questionResponses) {
      console.log(`No responses found for question ${questionId}`);
      return;
    }
    
    const answeredStudents = questionResponses.size;
    
    console.log('All users in state:', allStudents.map(s => `${s.name} (${s.role})`));
    console.log('Student users only:', studentStudents.map(s => s.name));
    console.log(`Progress for question ${questionId}: ${answeredStudents}/${totalStudents} students answered`);
    
    if (answeredStudents === totalStudents && totalStudents > 0) {
      console.log(`All students have answered question ${questionId}!`);
      
      // Notify teacher that all students have answered this question
      socket.broadcast.emit('all-students-answered', {
        questionId,
        message: 'All students have answered this question. You can now end the poll to see final results.',
        totalStudents,
        answeredStudents
      });
      
      // Don't automatically end the poll - let teacher decide when to end it
      // Students can see real-time results as they vote
      console.log(`All students have answered question ${questionId} - waiting for teacher to end poll manually`);
    }
  }

  // Teacher kicks student
  socket.on('kick-student', (studentId) => {
    const student = state.students.get(studentId);
    if (student) {
      console.log(`Teacher kicking student ${student.name}`);
      
      // Notify the kicked student
      io.to(studentId).emit('student-kick', {
        message: "You've been kicked out by the teacher."
      });

      // Remove from state
      state.students.delete(studentId);
      state.responses.delete(studentId);

      // Disconnect the student
      io.sockets.sockets.get(studentId)?.disconnect();

      // Notify other students
      socket.broadcast.emit('student-kicked', { studentId, studentName: student.name });

      console.log(`Student ${student.name} was kicked`);
    }
  });

  // Teacher ends specific poll manually
  socket.on('end-poll', (questionId) => {
    console.log('Teacher manually ending poll for question:', questionId);
    const question = state.activeQuestions.find(q => q.id === questionId);
    if (question) {
      endPoll(questionId);
    }
  });

  // Chat functionality
  socket.on('send-message', (messageData) => {
    const { message, senderName, senderRole } = messageData;
    const user = state.students.get(socket.id);
    
    if (!user) {
      socket.emit('error', { message: 'You must be connected to send messages.' });
      return;
    }

    const chatMessage = {
      id: Date.now().toString(),
      message: message.trim(),
      senderName: user.name,
      senderRole: user.role,
      timestamp: Date.now()
    };

    // Add message to state
    state.messages.push(chatMessage);

    // Broadcast message to all connected users
    io.emit('new-message', chatMessage);

    console.log(`Chat message from ${user.name}: ${message}`);
  });

  // Send chat history to new users
  socket.on('request-chat-history', () => {
    socket.emit('chat-history', state.messages);
  });

  // Send poll results to clients who request them
  socket.on('request-poll-results', () => {
    console.log('Client requesting poll results from socket:', socket.id);
    console.log('Poll history length:', state.pollHistory.length);
    console.log('Number of connected sockets:', io.sockets.sockets.size);
    if (state.pollHistory.length > 0) {
      const latestPoll = state.pollHistory[state.pollHistory.length - 1];
      console.log('Sending latest poll results to all clients:', latestPoll);
      // Broadcast to all clients instead of just the requesting socket
      io.emit('poll-results', {
        question: latestPoll,
        results: latestPoll.results,
        totalResponses: latestPoll.totalResponses
      });
      console.log('Poll results broadcasted to all clients');
    } else {
      console.log('No poll history available');
    }
  });

  // Send poll history to clients who request it
  socket.on('request-poll-history', () => {
    console.log('Client requesting poll history from socket:', socket.id);
    console.log('Poll history length:', state.pollHistory.length);
    socket.emit('poll-history', state.pollHistory);
    console.log('Poll history sent to client');
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    const student = state.students.get(socket.id);
    if (student) {
      console.log(`Student ${student.name} disconnected (reason: ${reason})`);
      
      // Only remove from state for explicit client disconnections
      if (reason === 'io client disconnect') {
        console.log(`Student ${student.name} explicitly disconnected, removing from state`);
        state.students.delete(socket.id);
        state.responses.delete(socket.id);
        
        // Notify other users with updated progress
        const studentStudents = Array.from(state.students.values()).filter(s => s.role === 'student');
        const totalStudents = studentStudents.length;
        const answeredStudents = state.responses.size;
        
        socket.broadcast.emit('student-disconnected', {
          studentId: socket.id,
          studentName: student.name,
          progress: {
            answered: answeredStudents,
            total: totalStudents
          }
        });
      } else {
        // For all other disconnections (network, server, etc.), keep in state
        console.log(`Student ${student.name} disconnected due to network/server issues, keeping in state`);
        console.log(`Total students in state after disconnect: ${Array.from(state.students.values()).filter(s => s.role === 'student').length}`);
        
        // Track disconnected student for cleanup (but keep them in state for now)
        state.disconnectedStudents.set(socket.id, Date.now());
      }
    }
  });

  // Handle reconnection
  socket.on('reconnect-student', (studentData) => {
    const { name } = studentData;
    console.log(`Student ${name} reconnecting with socket ${socket.id}`);
    
    // Update socket ID in state
    const existingStudent = Array.from(state.students.values()).find(s => s.name === name);
    if (existingStudent) {
      state.students.delete(existingStudent.id);
      existingStudent.id = socket.id;
      state.students.set(socket.id, existingStudent);
      console.log(`Updated student ${name} socket ID to ${socket.id}`);
    }
  });

  // Handle heartbeat
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

// Helper function to end poll and calculate results
function endPoll(questionId) {
  console.log('=== endPoll function called for question:', questionId);
  
  // Find the question to end
  const questionIndex = state.activeQuestions.findIndex(q => q.id === questionId);
  if (questionIndex === -1) {
    console.log('No active question found with ID:', questionId);
    return;
  }

  const question = state.activeQuestions[questionIndex];
  console.log('Ending poll and calculating results for question:', question.question);

  // Calculate results for this question
  const results = calculateResults(questionId);
  
  // Add to history
  state.pollHistory.push({
    ...question,
    results,
    totalResponses: state.responses.get(questionId)?.size || 0,
    timestamp: Date.now()
  });

  // Remove from active questions
  state.activeQuestions.splice(questionIndex, 1);
  
  // Remove responses for this question
  state.responses.delete(questionId);

  // Broadcast results
  console.log('Broadcasting poll results to all clients');
  console.log('Number of connected sockets:', io.sockets.sockets.size);
  console.log('Poll results data:', {
    question,
    results,
    totalResponses: state.responses.get(questionId)?.size || 0
  });
  io.emit('poll-results', {
    question,
    results,
    totalResponses: state.responses.get(questionId)?.size || 0
  });
  
  // Notify teacher of updated active questions
  io.emit('active-questions-updated', state.activeQuestions);
  
  console.log('Poll ended, results broadcasted');
}

// Helper function to calculate poll results
function calculateResults(questionId) {
  const results = {};
  const questionResponses = state.responses.get(questionId);
  const totalResponses = questionResponses ? questionResponses.size : 0;

  if (totalResponses === 0) return {};

  // Find the question
  const question = state.activeQuestions.find(q => q.id === questionId);
  if (!question) return {};

  // Count responses for each option
  question.options.forEach((option, index) => {
    results[index] = {
      option,
      count: 0,
      percentage: 0
    };
  });

  // Count actual responses
  questionResponses.forEach((response) => {
    const optionIndex = parseInt(response.selectedOption);
    if (results[optionIndex]) {
      results[optionIndex].count++;
    }
  });

  // Calculate percentages
  Object.values(results).forEach((result) => {
    result.percentage = totalResponses > 0 ? Math.round((result.count / totalResponses) * 100) : 0;
  });

  return results;
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: Date.now() });
});

app.get('/api/state', (req, res) => {
  const allStudents = Array.from(state.students.values());
  const studentStudents = allStudents.filter(s => s.role === 'student');
  const teacherStudents = allStudents.filter(s => s.role === 'teacher');
  
  res.json({
    activeQuestions: state.activeQuestions,
    studentsCount: state.students.size,
    studentCount: studentStudents.length,
    teacherCount: teacherStudents.length,
    responsesCount: state.responses.size,
    pollHistoryCount: state.pollHistory.length,
    students: studentStudents.map(s => ({ id: s.id, name: s.name, role: s.role })),
    teachers: teacherStudents.map(s => ({ id: s.id, name: s.name, role: s.role })),
    responses: Array.from(state.responses.entries()),
    disconnectedStudents: Array.from(state.disconnectedStudents.entries())
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io server ready for connections`);
  console.log(`CORS origin: ${process.env.CLIENT_URL || "http://localhost:3000"}`);
  
  // Periodic cleanup of disconnected students (every 30 minutes)
  setInterval(() => {
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30 minutes
    
    for (const [socketId, disconnectTime] of state.disconnectedStudents.entries()) {
      if (now - disconnectTime > timeout) {
        const student = state.students.get(socketId);
        if (student) {
          console.log(`Removing student ${student.name} after timeout (disconnected for ${Math.round((now - disconnectTime) / 1000)}s)`);
          state.students.delete(socketId);
          state.responses.delete(socketId);
        }
        state.disconnectedStudents.delete(socketId);
      }
    }
  }, 30 * 60 * 1000); // Run every 30 minutes
}); 