import express from 'express';
import http from 'http';
import {Server} from 'socket.io';
import { __dirname, randomName } from './utils.js';

const app = express();

const server = http.createServer(app);

const io = new Server(server);

let scores = {}
let answers = {}

io.on('connection', (socket) => {
	scores[socket.id] = {
		score: 0,
		nickname: randomName()
	}

	socket.emit('question', 'What is your favorite color?', 'red', 'green', 'blue')

	const player = scores[socket.id];

	socket.emit('nickname', player.nickname);
	io.emit('new_user', player.nickname);

	socket.on("connect_error", (err) => {
		console.log(`connect_error due to ${err.message}`);
	});

	socket.on("message", (message) => {
		io.emit('message', `${player.nickname}: ${message}`)
	});

	socket.on('disconnect', () => {
		delete scores[socket.id]
	})

	socket.on('answer', (ans) => {
		answers[player.nickname] = ans
		io.emit('submitted', Object.keys(answers).join(', '))
	})
})

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});


server.listen(3000, () => {
  console.log('listening on *:3000');
});
