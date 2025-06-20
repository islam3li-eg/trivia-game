// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAfaNPHL2m7n66VBADqMmkNnBxUE6ucRjY",
    authDomain: "trivia-elaslyeen.firebaseapp.com",
    databaseURL: "https://trivia-elaslyeen-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "trivia-elaslyeen",
    storageBucket: "trivia-elaslyeen.firebasestorage.app",
    messagingSenderId: "219060342462",
    appId: "1:219060342462:web:f576405834c497ec6958ef",
    measurementId: "G-7P35LE8PBD"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let playerName = '';
let playerId = '';

function joinLobby() {
    playerName = document.getElementById('player-name').value.trim();
    if (playerName === '') {
        alert('Please enter your name!');
        return;
    }

    playerId = Date.now(); // Unique ID
    db.ref('lobby/' + playerId).set({
        name: playerName,
        ready: false
    });

    document.getElementById('landing-page').style.display = 'none';
    document.getElementById('lobby').style.display = 'block';

    listenForPlayers();
}

function listenForPlayers() {
    db.ref('lobby/').on('value', (snapshot) => {
        const players = snapshot.val();
        const playerList = document.getElementById('player-list');
        playerList.innerHTML = '';

        let allReady = true;
        let playerCount = 0;

        for (let id in players) {
            const li = document.createElement('li');
            li.textContent = players[id].name + (players[id].ready ? ' ✅' : ' ❌');
            playerList.appendChild(li);

            if (!players[id].ready) allReady = false;
            playerCount++;
        }

        if (allReady && playerCount > 1) {
            document.getElementById('start-button').style.display = 'inline-block';
        } else {
            document.getElementById('start-button').style.display = 'none';
        }
    });
}

function markReady() {
    db.ref('lobby/' + playerId).update({
        ready: true
    });
}

function startGame() {
    db.ref('gameStarted').set(true);
    window.location.href = 'game.html'; // Next page we will build soon
}
