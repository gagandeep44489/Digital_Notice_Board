const path = require('path');
const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const noticeRoutes = require('./routes/noticeRoutes');
const User = require('./models/User');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || '*'
  }
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/digital_notice_board';

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || '*'
  })
);
app.use(express.json());

// Inject commonly used modules into request object for route-level middleware/controllers.
app.use((req, _res, next) => {
  req.io = io;
  req.jwt = jwt;
  next();
});

app.use('/api/notices', noticeRoutes);

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({ token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed.' });
  }
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ message: 'Digital Notice Board API is running.' });
});

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const seedAdmin = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log('Admin seed skipped: ADMIN_EMAIL or ADMIN_PASSWORD missing.');
    return;
  }

  const existingAdmin = await User.findOne({ email: adminEmail });

  if (existingAdmin) {
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await User.create({
    name: process.env.ADMIN_NAME || 'Administrator',
    email: adminEmail,
    password: hashedPassword,
    role: 'admin'
  });

  console.log(`Admin user created: ${adminEmail}`);
};

const startServer = async () => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is required in environment variables.');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    await seedAdmin();

    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    console.error('Tip: Ensure MongoDB is running and MONGODB_URI/JWT_SECRET are valid.');
    process.exit(1);
  }
};

startServer();
