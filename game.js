// game.js

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

let questions   = [];
let currentQ    = 0;
let playerScore = 0;
let timerInterval;

// Mark disconnect on close
db.ref('players/' + playerId).onDisconnect().update({ disconnected: true });

// Add myself to /players
db.ref('players/' + playerId).set({
  name: playerName,
  score: 0,
  disconnected: false,
  finished: false,
  completionTime: 0
});

// Quit mid‐round
function quitRound() {
  clearInterval(timerInterval);
  db.ref('players/' + playerId).update({ disconnected: true });
  window.location.href = `roundScore.html?playerId=${playerId}`;
}

// Finish normally
function finishGame() {
  clearInterval(timerInterval);
  db.ref('players/' + playerId).update({
    finished: true,
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

function shuffleArray(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

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

function loadNextQuestion() {
  currentQ++;
  loadQuestion();
}

// Live scoreboard with correct Finished vs Pending
db.ref('players/').on('value', snap => {
  const players = snap.val() || {};
  const ul      = document.getElementById('score-list');
  ul.innerHTML  = '';
  Object.values(players).forEach(p => {
    let text = `${p.name}: ${p.score}`;
    if (p.finished) {
      text += ' ✔️ Finished';
    } else {
      text += ' ⏳ Pending';
    }
    if (p.disconnected && !p.finished) text += ' 🔴 Disconnected';
    const li = document.createElement('li');
    li.textContent = text;
    ul.appendChild(li);
  });
});
