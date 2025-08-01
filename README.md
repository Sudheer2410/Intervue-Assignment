# ⚡ Live Polling System

A real-time live polling system for classroom scenarios where teachers can ask questions and students can respond in real-time.

## 🎯 Features

### 👩‍🏫 Teacher Features
- Create and manage live polls
- Real-time results visualization with progress bars
- Participant management with kick-out functionality
- Poll history with detailed breakdowns
- Timer settings (30s, 60s, 90s, 120s)
- Multiple choice questions (2-6 options)

### 👨‍🎓 Student Features
- Join sessions with unique names
- Real-time poll participation
- Live results viewing
- Timer countdown
- One-time submission per poll

### 🔧 Technical Features
- Real-time communication with Socket.io
- Responsive design with Tailwind CSS
- Role-based routing
- Clean, modern UI matching Figma designs
- Error handling and validation

## 🛠 Tech Stack

### Frontend
- **React.js** - UI framework
- **Tailwind CSS** - Styling
- **Socket.io-client** - Real-time communication
- **React Router** - Navigation

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.io** - Real-time communication
- **CORS** - Cross-origin resource sharing

## 🎨 UI/UX Design

The application uses a carefully selected color palette:

| Purpose | Hex Code |
|---------|----------|
| Primary Violet | #7765DA |
| Deep Blue Accent | #5767D0 |
| Primary Button/Accent | #4F0DCE |
| Light Background | #F2F2F2 |
| Heading/Text Primary | #373737 |
| Subtext/Muted Gray | #6E6E6E |

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd live-polling-system
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Start development servers**
   ```bash
   npm run dev
   ```

This will start both the backend server (port 5000) and frontend development server (port 3000).

### Manual Setup

If you prefer to run servers separately:

**Backend:**
```bash
cd server
npm install
npm run dev
```

**Frontend:**
```bash
cd client
npm install
npm start
```

## 📁 Project Structure

```
live-polling-system/
├── server/                 # Backend server
│   ├── index.js           # Main server file
│   └── package.json       # Backend dependencies
├── client/                # Frontend React app
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   └── App.js         # Main app component
│   ├── public/            # Static files
│   └── package.json       # Frontend dependencies
├── package.json           # Root package.json
└── README.md             # This file
```

## 🔌 Socket Events

### Student Events
- `join-student` - Student joins session
- `student-answer` - Student submits answer
- `new-question` - Receive new poll
- `poll-results` - Receive poll results
- `student-kick` - Student removed by teacher

### Teacher Events
- `join-teacher` - Teacher joins session
- `new-question` - Create new poll
- `kick-student` - Remove student
- `end-poll` - End current poll
- `student-joined` - New student joined
- `student-answered` - Student submitted answer

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set build command: `cd client && npm run build`
3. Set output directory: `client/build`
4. Add environment variable: `REACT_APP_SERVER_URL`

### Backend (Render/Railway)
1. Connect your GitHub repository
2. Set build command: `cd server && npm install`
3. Set start command: `cd server && npm start`
4. Add environment variables:
   - `CLIENT_URL` (your frontend URL)
   - `PORT` (optional, defaults to 5000)

## 🔧 Environment Variables

### Frontend (.env)
```
REACT_APP_SERVER_URL=http://localhost:5000
```

### Backend (.env)
```
CLIENT_URL=http://localhost:3000
PORT=5000
```

## 📱 Usage

### For Teachers
1. Select "I'm a Teacher" on the welcome screen
2. Create a new poll with question and options
3. Monitor real-time results
4. Manage participants and view history

### For Students
1. Select "I'm a Student" on the welcome screen
2. Enter your name (must be unique)
3. Wait for teacher to start a poll
4. Answer questions and view results

## 🎯 Features Checklist

- [x] Role selection (Student/Teacher)
- [x] Student name input with validation
- [x] Real-time poll creation
- [x] Live results visualization
- [x] Timer functionality
- [x] Participant management
- [x] Poll history
- [x] Student kick-out functionality
- [x] Responsive design
- [x] Error handling
- [x] Socket.io integration
- [x] Clean UI matching designs

## 🚀 Bonus Features (Future)

- [ ] MongoDB integration for persistent storage
- [ ] Live chat functionality
- [ ] Student authentication
- [ ] Advanced analytics
- [ ] Export poll results

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For questions or support, please open an issue in the repository.

---

**Built with ❤️ using React.js, Express.js, and Socket.io** 