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

// Prevent multiple sessions from same device
if (localStorage.getItem('playerId')) {
    alert('You already joined from this device.');
} else {
    // Allow joining
    console.log('You can join the game.');
}

function joinLobby() {
    if (localStorage.getItem('playerId')) {
        alert('You already joined from this device.');
        return;
    }

    playerName = document.getElementById('player-name').value.trim();
    if (playerName === '') {
        alert('Please enter your name!');
        return;
    }

    playerId = Date.now(); // Unique ID
    localStorage.setItem('playerId', playerId); // Save session locally

    // Save player to lobby
    db.ref('lobby/' + playerId).set({
        name: playerName,
        ready: false
    });

    // Auto remove player if they disconnect
    db.ref('lobby/' + playerId).onDisconnect().remove();

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
        let firstPlayerId = null;

        // Identify the host (first player)
        for (let id in players) {
            if (!firstPlayerId) firstPlayerId = id;
        }

        // Display players
        for (let id in players) {
            const li = document.createElement('li');
            li.textContent = players[id].name;

            // Show host icon
            if (id === firstPlayerId) {
                li.textContent += ' 👑 Host';
            }

            // Show ready status
            li.textContent += players[id].ready ? ' ✅' : ' ❌';
            playerList.appendChild(li);

            if (!players[id].ready) allReady = false;
            playerCount++;
        }

        // Show start button only to host
        if (allReady && playerCount > 1 && playerId == firstPlayerId) {
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
    window.location.href = 'game.html'; // We will build this page next
}
