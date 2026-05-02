const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

require('./db');
require('./seed');

const authRoutes = require('./routes/auth');
const skinsRoutes = require('./routes/skins');
const marketRoutes = require('./routes/market');
const upgradeRoutes = require('./routes/upgrade');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.set('io', io);

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/skins', skinsRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/upgrade', upgradeRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

const onlineUsers = new Set();

io.on('connection', (socket) => {
  onlineUsers.add(socket.id);
  io.emit('online', onlineUsers.size);

  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);
    io.emit('online', onlineUsers.size);
  });
});

app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`CS2 Upgrade server running on port ${PORT}`);
});
