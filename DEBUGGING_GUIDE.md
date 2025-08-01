# 🔧 Debugging Guide: Students Not Seeing Questions

## 🎯 Problem
Students are unable to see questions given by teachers in the live polling system.

## 🔍 Root Cause Analysis

### 1. **Socket Connection Issues**
- **Problem**: Students may not be connecting to the server properly
- **Symptoms**: Students stuck on loading screen, no real-time updates
- **Solution**: Enhanced connection handling with better error reporting

### 2. **Event Broadcasting Issues**
- **Problem**: Questions not being broadcasted to all connected students
- **Symptoms**: Teacher creates question but students don't receive it
- **Solution**: Improved server-side broadcasting with detailed logging

### 3. **Navigation Logic Issues**
- **Problem**: Students not navigating to poll view when question is received
- **Symptoms**: Students stay in lobby even when question is active
- **Solution**: Enhanced navigation logic with proper state management

## 🛠️ Fixes Applied

### ✅ Socket Context Improvements
- Added connection status tracking
- Enhanced error handling with user-friendly messages
- Added detailed logging for debugging
- Improved socket connection configuration

### ✅ Student Components Enhanced
- **StudentLobby**: Better question detection and navigation
- **StudentPollView**: Improved loading states and error handling
- Added connection status indicators
- Enhanced event listener management

### ✅ Server-Side Improvements
- Added comprehensive logging for all events
- Improved question broadcasting logic
- Enhanced error handling and validation
- Better state management for active questions

## 🧪 Testing Steps

### 1. **Server Connection Test**
```bash
# Start the server
npm run dev

# In another terminal, test server connection
node test-server.js
```

### 2. **Browser Testing**
1. Open browser developer tools (F12)
2. Go to Console tab
3. Open the application in two browser windows
4. Join as teacher in one window
5. Join as student in another window
6. Create a question as teacher
7. Check console logs for any errors

### 3. **Network Tab Analysis**
1. Open Network tab in developer tools
2. Filter by "WS" (WebSocket)
3. Check if WebSocket connection is established
4. Monitor WebSocket messages for question events

## 🔍 Debugging Checklist

### ✅ Server Status
- [ ] Server is running on port 5000
- [ ] No errors in server console
- [ ] CORS is properly configured
- [ ] Socket.io server is initialized

### ✅ Client Connection
- [ ] Client connects to correct server URL
- [ ] WebSocket connection established
- [ ] No connection errors in browser console
- [ ] Socket events are being received

### ✅ Teacher Flow
- [ ] Teacher can join successfully
- [ ] Teacher can create questions
- [ ] Questions are being sent to server
- [ ] Server receives and processes questions

### ✅ Student Flow
- [ ] Student can join successfully
- [ ] Student receives 'joined' confirmation
- [ ] Student receives 'new-question' events
- [ ] Student navigates to poll view
- [ ] Question is displayed correctly

### ✅ Real-time Communication
- [ ] Questions are broadcasted to all students
- [ ] Students can submit answers
- [ ] Results are calculated and displayed
- [ ] Timer functionality works

## 🚨 Common Issues & Solutions

### Issue 1: "Cannot connect to server"
**Solution**: 
- Check if server is running on port 5000
- Verify CORS configuration
- Check firewall settings
- Ensure no other service is using port 5000

### Issue 2: "Student stuck on loading screen"
**Solution**:
- Check browser console for errors
- Verify WebSocket connection
- Check if student name is unique
- Ensure server is receiving join events

### Issue 3: "Teacher creates question but students don't see it"
**Solution**:
- Check server logs for broadcasting
- Verify all students are connected
- Check if students are in correct room
- Ensure question data is valid

### Issue 4: "Students can't submit answers"
**Solution**:
- Check if question is active
- Verify student hasn't already answered
- Check timer hasn't expired
- Ensure answer format is correct

## 📊 Monitoring & Logs

### Server Logs to Watch
```
✅ User connected: [socket-id]
✅ Student [name] joined successfully
✅ Broadcasting new question to [count] connected sockets
✅ Teacher creating new question: [question-data]
```

### Client Logs to Watch
```
✅ SocketContext: Connected to server successfully
✅ StudentLobby: Received new question: [question]
✅ StudentPollView: Setting up socket listeners
✅ SocketContext: Joining as student: [name]
```

### Error Logs to Monitor
```
❌ SocketContext: Connection error: [error]
❌ StudentLobby: Received error: [error]
❌ Teacher tried to create question but one is already active
❌ Student [name] - name already taken
```

## 🔧 Quick Fixes

### If Students Can't Connect:
1. Check server is running: `npm run dev`
2. Verify port 5000 is available
3. Check browser console for errors
4. Try refreshing the page

### If Questions Not Appearing:
1. Check server logs for broadcasting
2. Verify all students are connected
3. Check if question data is valid
4. Ensure no active question exists

### If Navigation Issues:
1. Check browser console for errors
2. Verify React Router is working
3. Check if socket events are firing
4. Ensure proper state management

## 📞 Support

If issues persist after following this guide:
1. Check all console logs (server and browser)
2. Verify network connectivity
3. Test with different browsers
4. Check for any JavaScript errors
5. Ensure all dependencies are installed

## 🎯 Expected Behavior

### Normal Flow:
1. Teacher joins → Server confirms
2. Student joins → Server confirms + sends active question if exists
3. Teacher creates question → Server broadcasts to all students
4. Students receive question → Navigate to poll view
5. Students submit answers → Server processes and updates results
6. Timer expires or teacher ends poll → Results displayed

### Success Indicators:
- ✅ All users connect successfully
- ✅ Questions are created and broadcasted
- ✅ Students receive and can answer questions
- ✅ Real-time results update
- ✅ Timer functionality works
- ✅ No console errors 