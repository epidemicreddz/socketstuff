const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public')); // Serve static files

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('buttonClicked', (newState) => {
        io.emit('changeColor', newState); // Broadcast the toggle event
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});


server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});

