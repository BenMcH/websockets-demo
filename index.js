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
let continueGame;

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

		emitSubmitted();
	})

	socket.on('new_game', (ans) => {
		clearTimeout(gameTimer)
		continueGame = true;
		answers = {}
		Object.values(scores).forEach(score => score.score = 0)
		emitSubmitted();

		gameTimer = setTimeout(nextQuestion, 1_000)
	})

	socket.on('stop_game', () => {
		continueGame = false;
		clearTimeout(gameTimer)
	})
})

const emitSubmitted = () => io.emit('submitted', `Submitted: ${Object.keys(answers).join(', ')}`)

const nextQuestion = async () => {
	const winners = Object.entries(answers).filter(([_, answer]) => answer === question.answer).map(([name]) => name).join(', ')

	io.emit('submitted', `Answer: ${question.answer}
	Congrats: ${winners}!`)
	await new Promise((resolve) => setTimeout(resolve, 5_000))

	question = random(questions)

	let questionSansAnswer = { ...question }
	delete questionSansAnswer.answer;


	if (continueGame) {
		io.emit('question', question)
		answers = {}
		emitSubmitted()

		gameTimer = setTimeout(nextQuestion, 10_000)
	}
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
