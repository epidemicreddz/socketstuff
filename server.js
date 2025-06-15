const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public')); // Serve static files

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('buttonClicked', ({ userId, timestamp }) => {
        const serverTimestamp = Date.now();
        const latency = serverTimestamp - timestamp;

        console.log(`User ${userId} Latency: ${latency}ms`);

        // Send latency info back to the client
        socket.emit('latency', { userId, latency });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});
server.listen(3000, '0.0.0.0', () => {
    console.log('Server running on port 3000');
});

