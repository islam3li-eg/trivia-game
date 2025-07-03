const firebaseConfig = {
  apiKey: "AIzaSyAfaNPHL2m7n66VBADqMmkNnBxUE6ucRjY",
  authDomain: "trivia-elaslyeen.firebaseapp.com",
  databaseURL: "https://trivia-elaslyeen-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "trivia-elaslyeen",
  storageBucket: "trivia-elaslyeen.appspot.com",
  messagingSenderId: "219060342462",
  appId: "1:219060342462:web:f576405834c497ec6958ef",
  measurementId: "G-7P35LE8PBD"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const urlParams = new URLSearchParams(window.location.search);
const playerId = urlParams.get('id');
const playerName = urlParams.get('name');

let questions = [];
let currentQuestion = 0;
let playerScore = 0;
let timerInterval;
let timeLeft = 30;

const playerRef = db.ref('players/' + playerId);
playerRef.onDisconnect().update({ disconnected: true });

playerRef.set({
  name: playerName,
  score: 0,
  disconnected: false,
  finished: false,
  completionTime: 0
});

// Fetch questions from local JSON
fetch('questions.json')
  .then(response => response.json())
  .then(data => {
    questions = data;
    loadQuestion();
  });

function loadQuestion() {
  if (currentQuestion >= questions.length) {
    finishGame();
    return;
  }

  const q = questions[currentQuestion];
  document.getElementById('question-text').textContent = q.question;

  const optionsDiv = document.getElementById('options');
  optionsDiv.innerHTML = '';

  q.options.forEach(option => {
    const btn = document.createElement('button');
    btn.textContent = option;
    btn.classList.add('question-option');
    btn.onclick = () => submitAnswer(option, q.answer);
    optionsDiv.appendChild(btn);
  });

  startTimer();
}

function startTimer() {
  timeLeft = 30;
  document.getElementById('timer').textContent = `Time Left: ${timeLeft}`;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById('timer').textContent = `Time Left: ${timeLeft}`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      loadNextQuestion();
    }
  }, 1000);
}

function submitAnswer(selected, correct) {
  clearInterval(timerInterval);

  const options = document.querySelectorAll('.question-option');
  options.forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === correct) btn.style.backgroundColor = 'green';
    if (btn.textContent === selected && selected !== correct) btn.style.backgroundColor = 'red';
  });

  if (selected === correct) playerScore += 10;

  db.ref('players/' + playerId).update({ score: playerScore });

  setTimeout(() => {
    loadNextQuestion();
  }, 1000);
}

function loadNextQuestion() {
  cur// game.js

// Firebase init
const firebaseConfig = {
  apiKey: "AIzaSyAfaNPHL2m7n66VBADqMmkNnBxUE6ucRjY",
  authDomain: "trivia-elaslyeen.firebaseapp.com",
  databaseURL: "https://trivia-elaslyeen-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "trivia-elaslyeen",
  storageBucket: "trivia-elaslyeen.appspot.com",
  messagingSenderId: "219060342462",
  appId: "1:219060342462:web:f576405834c497ec6958ef"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// URL params
const urlParams      = new URLSearchParams(window.location.search);
const playerId       = urlParams.get('id');
const playerName     = decodeURIComponent(urlParams.get('name'));
const totalQuestions = parseInt(urlParams.get('numQuestions')) || 0;

let questions     = [];
let currentQ      = 0;
let playerScore   = 0;
let timerInterval;

// Mark disconnect
db.ref('players/' + playerId).onDisconnect().update({ disconnected: true });

// Add player entry
db.ref('players/' + playerId).set({
  name:           playerName,
  score:          0,
  disconnected:   false,
  finished:       false,
  completionTime: 0
});

// Quit function
function quitRound() {
  clearInterval(timerInterval);
  db.ref('players/' + playerId).update({ disconnected: true });
  window.location.href = `roundScore.html?playerId=${playerId}`;
}

// Normal finish
function finishGame() {
  clearInterval(timerInterval);
  db.ref('players/' + playerId).update({
    finished:       true,
    completionTime: Date.now()
  });
  window.location.href = `roundScore.html?playerId=${playerId}`;
}

// Load & shuffle questions
fetch('questions.json')
  .then(r => r.json())
  .then(data => {
    shuffleArray(data);
    questions = data.slice(0, totalQuestions || data.length);
    loadQuestion();
  })
  .catch(console.error);

// Shuffle helper
function shuffleArray(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

// Display question
function loadQuestion() {
  if (currentQ >= questions.length) return finishGame();
  const q = questions[currentQ];
  document.getElementById('question-text').textContent = q.question;
  const opts = document.getElementById('options');
  opts.innerHTML = '';
  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt;
    btn.classList.add('question-option');
    btn.onclick = () => submitAnswer(opt, q.answer);
    opts.appendChild(btn);
  });
  startTimer();
}

// Timer
function startTimer() {
  let timeLeft = 30;
  document.getElementById('timer').textContent = `Time Left: ${timeLeft}`;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (--timeLeft <= 0) {
      clearInterval(timerInterval);
      loadNextQuestion();
    } else {
      document.getElementById('timer').textContent = `Time Left: ${timeLeft}`;
    }
  }, 1000);
}

// Answer handling
function submitAnswer(selected, correct) {
  clearInterval(timerInterval);
  document.querySelectorAll('.question-option').forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === correct) btn.style.backgroundColor = 'green';
    if (btn.textContent === selected && selected !== correct)
      btn.style.backgroundColor = 'red';
  });
  if (selected === correct) playerScore += 10;
  db.ref('players/' + playerId).update({ score: playerScore });
  setTimeout(loadNextQuestion, 1000);
}

// Next question
function loadNextQuestion() {
  currentQ++;
  loadQuestion();
}

// Live scoreboard
db.ref('players/').on('value', snap => {
  const players = snap.val() || {};
  const ul      = document.getElementById('score-list');
  ul.innerHTML  = '';
  Object.values(players).forEach(p => {
    let text = `${p.name}: ${p.score}`;
    text += p.finished ? ' ✔️ Finished' : ' ⏳ Pending';
    if (p.disconnected && !p.finished) text += ' 🔴 Disconnected';
    const li = document.createElement('li');
    li.textContent = text;
    ul.appendChild(li);
  });
});rentQuestion++;
  loadQuestion();
}

function finishGame() {
  clearInterval(timerInterval);
  const finishTime = Date.now();

  db.ref('players/' + playerId).update({
    finished: true,
    completionTime: finishTime
  });

  alert('Game Finished! Waiting for others...');
}

// Live score listener
function listenForScores() {
  db.ref('players/').on('value', snapshot => {
    const players = snapshot.val();
    const scoreList = document.getElementById('score-list');
    if (!scoreList) return;

    scoreList.innerHTML = '';
    for (let id in players) {
      let text = `${players[id].name}: ${players[id].score}`;
      if (players[id].disconnected) text += ' 🔴 Disconnected';
      if (id === playerId) text += ' 👉 You';

      const li = document.createElement('li');
      li.textContent = text;
      scoreList.appendChild(li);
    }
  });
}

listenForScores();
