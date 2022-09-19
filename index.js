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
		finishGame()
	})
})

const emitSubmitted = () => io.emit('submitted', `Submitted: ${Object.keys(answers).join(', ')}`)

const finishGame = () => {
	continueGame = false;
	clearTimeout(gameTimer)

	const scoreMapping = Object.values(scores).reduce((acc, value) => {
		acc[value.nickname] = value.score

		return acc
	}, {})
	console.log({ scoreMapping })
	io.emit('scoreboard', scoreMapping)

	return;
}

const nextQuestion = async (count = 0) => {
	if (count > 4) {
		return finishGame();
	} else {
		question = random(questions)

		let questionSansAnswer = { ...question }
		delete questionSansAnswer.answer;

		io.emit('question', question)
		answers = {}
		emitSubmitted()

		await new Promise((resolve) => setTimeout(resolve, 10_000))

		const winnerNames = Object.entries(answers).filter(([_, answer]) => answer === question.answer).map(([name]) => name)
		const winners = winnerNames.join(",")

		io.emit('submitted', `Answer: ${question.answer} Congrats: ${winners}!`)

		winnerNames.forEach(name => {
			Object.values(scores).find(({ nickname }) => nickname === name).score += 1
		})

		if (continueGame) {
			gameTimer = setTimeout(nextQuestion.bind(null, count + 1), 5_000)
		}
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
