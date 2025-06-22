// game.js

// Firebase init (same as before)
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

// Read URL params
const urlParams     = new URLSearchParams(window.location.search);
const playerId      = urlParams.get('id');
const playerName    = decodeURIComponent(urlParams.get('name'));
const totalQuestions = parseInt(urlParams.get('numQuestions')) || 0;

let questions     = [];
let currentQ      = 0;
let playerScore   = 0;
let timerInterval;

// Track disconnect
db.ref('players/' + playerId).onDisconnect().update({ disconnected: true });

// Initialize this player in /players
db.ref('players/' + playerId).set({
  name: playerName,
  score: 0,
  disconnected: false,
  finished: false,
  completionTime: 0
});

// Add Quit button handler
function quitRound() {
  clearInterval(timerInterval);
  db.ref('players/' + playerId).update({
    disconnected: true
    // finished remains false
  });
  window.location.href = `roundScore.html?playerId=${playerId}`;
}

// Finish normally
function finishGame() {
  clearInterval(timerInterval);
  const finishTime = Date.now();
  db.ref('players/' + playerId).update({
    finished: true,
    completionTime: finishTime
  });
  window.location.href = `roundScore.html?playerId=${playerId}`;
}

// Fetch and shuffle questions
fetch('questions.json')
  .then(r => r.json())
  .then(data => {
    shuffleArray(data);
    // Take only as many as host requested
    questions = data.slice(0, totalQuestions || data.length);
    loadQuestion();
  })
  .catch(err => console.error('Error loading questions:', err));

// Fisher–Yates shuffle
function shuffleArray(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

// Load current question
function loadQuestion() {
  if (currentQ >= questions.length) {
    finishGame();
    return;
  }
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

// Timer logic
function startTimer() {
  let timeLeft = 30;
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

// Handle answer selection
function submitAnswer(selected, correct) {
  clearInterval(timerInterval);
  document.querySelectorAll('.question-option').forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === correct) btn.style.backgroundColor = 'green';
    if (btn.textContent === selected && selected !== correct) btn.style.backgroundColor = 'red';
  });
  if (selected === correct) playerScore += 10;
  db.ref('players/' + playerId).update({ score: playerScore });
  setTimeout(loadNextQuestion, 1000);
}

function loadNextQuestion() {
  currentQ++;
  loadQuestion();
}

// Live scoreboard updates
db.ref('players/').on('value', snap => {
  const players = snap.val() || {};
  const ul      = document.getElementById('score-list');
  ul.innerHTML  = '';
  Object.values(players).forEach(p => {
    let text = `${p.name}: ${p.score}`;
    if (!p.finished) text += ' ⏳ Pending';
    if (p.disconnected && !p.finished) text += ' 🔴 Disconnected';
    const li = document.createElement('li');
    li.textContent = text;
    ul.appendChild(li);
  });
});
