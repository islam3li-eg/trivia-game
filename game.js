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
  currentQuestion++;
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
