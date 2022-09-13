import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { questions } from './questions.js';
import { __dirname, randomName, random } from './utils.js';

const app = express();

const server = http.createServer(app);

const io = new Server(server);

let scores = {}
let answers = {}
let gameTimer;

let question = {
	question: 'What is your favorite color?',
	answers: ['red', 'blue', 'green']
}

io.on('connection', (socket) => {
	scores[socket.id] = {
		score: 0,
		nickname: randomName()
	}

	const player = scores[socket.id];

	socket.emit('message', `Welcome, ${player.nickname}`);
	socket.emit('question', question)

	socket.emit('nickname', player.nickname);
	io.emit('new_user', player.nickname);

	socket.on("connect_error", (err) => {
		console.log(`connect_error due to ${err.message}`);
	});

	socket.on('new_question', (_question) => {
		question = _question
		answers = {}

		let questionSansAnswer = { ...question }
		delete questionSansAnswer.answer;

		io.emit('question', questionSansAnswer)
	})

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

	socket.on('new_game', (ans) => {
		console.log('here');
		clearTimeout(gameTimer)
		answers = {}
		Object.values(scores).forEach(score => score.score = 0)
		io.emit('submitted', Object.keys(answers).join(', '))

		gameTimer = setTimeout(nextQuestion, 1_000)
	})

	socket.on('stop_game', () => {
		clearTimeout(gameTimer)
	})

})

const nextQuestion = async () => {
	console.log("results:")
	console.log(Object.entries(answers).filter(([_, answer]) => answer === question.answer).map(([name]) => name))

	await new Promise((resolve) => setTimeout(resolve, 5_000))

	question = random(questions)

	let questionSansAnswer = { ...question }
	delete questionSansAnswer.answer;


	io.emit('question', question)
	answers = {}
	io.emit('submitted', Object.keys(answers).join(', '))

	gameTimer = setTimeout(nextQuestion, 10_000)
}

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

app.get('/admin', (req, res) => {
	res.sendFile(__dirname + '/admin.html');
});


server.listen(3000, () => {
	console.log('listening on http://localhost:3000');
});
