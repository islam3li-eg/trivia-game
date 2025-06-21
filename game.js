// Firebase configuration
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Get player info from URL
const urlParams = new URLSearchParams(window.location.search);
const playerId = urlParams.get('id');
const playerName = urlParams.get('name');

// Initialize variables
let questions = [];
let currentQuestion = 0;
let playerScore = 0;
let timerInterval;
let timeLeft = 30;

// Setup disconnection tracking
const playerRef = db.ref('players/' + playerId);
playerRef.onDisconnect().update({ disconnected: true });

// Initialize player data
playerRef.set({
    name: playerName,
    score: 0,
    disconnected: false,
    finished: false,
    completionTime: 0
});

// Load questions from local JSON file
fetch('questions.json')
    .then(response => response.json())
    .then(data => {
        questions = data;
        loadQuestion();
    })
    .catch(error => {
        console.error('Error loading questions:', error);
    });

// Load a question
function loadQuestion() {
    if (currentQuestion >= questions.length) {
        finishGame();
        return;
    }

    const data = questions[currentQuestion];
    document.getElementById('question-text').textContent = data.question;

    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';

    data.options.forEach(option => {
        const btn = document.createElement('button');
        btn.textContent = option;
        btn.classList.add('question-option');
        btn.onclick = () => submitAnswer(option, data.answer);
        optionsDiv.appendChild(btn);
    });

    startTimer();
}

// Start question timer
function startTimer() {
    timeLeft = 30;
    document.getElementById('timer').textContent = `Time Left: ${timeLeft}`;

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = `Time Left: ${timeLeft}`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            loadNextQuestion(); // Skip if time runs out
        }
    }, 1000);
}

// Handle answer submission
function submitAnswer(selected, correct) {
    clearInterval(timerInterval);

    if (selected === correct) {
        playerScore += 10;
    }

    db.ref('players/' + playerId).update({
        score: playerScore
    });

    loadNextQuestion();
}

// Load the next question
function loadNextQuestion() {
    currentQuestion++;
    loadQuestion();
}

// Handle game finish
function finishGame() {
    clearInterval(timerInterval);

    const finishTime = Date.now();

    db.ref('players/' + playerId).update({
        finished: true,
        completionTime: finishTime
    });

    alert('You finished the game! Waiting for others...');
}

// Listen for real-time score updates
function listenForScores() {
    db.ref('players/').on('value', snapshot => {
        const players = snapshot.val();
        const scoreList = document.getElementById('score-list');
        scoreList.innerHTML = '';

        for (let id in players) {
            let text = `${players[id].name}: ${players[id].score}`;

            if (players[id].disconnected) {
                text += ' 🔴 Disconnected';
            }

            if (id === playerId) {
                text += ' 👉 You';
            }

            const li = document.createElement('li');
            li.textContent = text;
            scoreList.appendChild(li);
        }
    });
}

// Start listening for scores immediately
listenForScores();
