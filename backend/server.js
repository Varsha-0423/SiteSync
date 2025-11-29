const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const colors = require('colors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST']
  },
  path: '/socket.io/'
});

// Make io accessible to other modules
app.set('io', io);

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('A client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// CORS Configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Apply CORS middleware to all routes
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Test route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/work', require('./routes/workRoutes'));
app.use('/api/worker', require('./routes/workerRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// Error handler middleware (should be after all other middleware and routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Export the server and io for use in other files
const appServer = server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`.yellow.bold);
});

// Handle server errors
appServer.on('error', (error) => {
  console.error('Server error:', error);
});

// Export the io instance so it can be used in controllers
module.exports = { io };

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`.red);
  // Close server & exit process
  appServer.close(() => process.exit(1));
  server.close(() => process.exit(1));
});