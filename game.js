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

let currentQuestion = 1;
let playerScore = 0;
let timerInterval;
let timeLeft = 30;
let totalQuestions = 5; // You can adjust based on your database

// Setup disconnect tracking
const playerRef = db.ref('players/' + playerId);
playerRef.onDisconnect().update({ disconnected: true });

// Initialize player score
playerRef.set({
    name: playerName,
    score: 0,
    disconnected: false,
    finished: false,
    completionTime: 0
});

// Start the game
loadQuestion();
listenForScores();

function loadQuestion() {
    db.ref('questions/' + currentQuestion).once('value').then(snapshot => {
        if (!snapshot.exists()) {
            finishGame();
            return;
        }

        const data = snapshot.val();
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
    });
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
            loadNextQuestion(); // Auto move to next if time runs out
        }
    }, 1000);
}

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

function loadNextQuestion() {
    currentQuestion++;

    if (currentQuestion > totalQuestions) {
        finishGame();
    } else {
        loadQuestion();
    }
}

function finishGame() {
    clearInterval(timerInterval);

    const finishTime = Date.now();

    db.ref('players/' + playerId).update({
        finished: true,
        completionTime: finishTime
    });

    alert('Game finished! Waiting for others...');
}

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
