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

let playerName = '';
let playerId = '';

// If the device already has a live session, block joining
if (localStorage.getItem('livePlayerId')) {
    alert('You already have a live session open on this device.');
} else {
    console.log('You can join the game.');
}

function joinLobby() {
    // Block multiple live sessions
    if (localStorage.getItem('livePlayerId')) {
        alert('You already have a live session open on this device.');
        return;
    }

    playerName = document.getElementById('player-name').value.trim();
    if (playerName === '') {
        alert('Please enter your name!');
        return;
    }

    playerId = Date.now(); // Unique ID
    localStorage.setItem('livePlayerId', playerId); // Track this live session

    // Save player to lobby
    db.ref('lobby/' + playerId).set({
        name: playerName,
        ready: false
    });

    // Auto remove player if disconnected
    db.ref('lobby/' + playerId).onDisconnect().remove();

    // Watch if player is removed from Firebase → clear device session
    db.ref('lobby/' + playerId).on('value', (snapshot) => {
        if (snapshot.exists() === false) {
            localStorage.removeItem('livePlayerId'); // Clean device session
        }
    });

    // Show lobby
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

            // Show if this is your session
            if (id == localStorage.getItem('livePlayerId')) {
                li.textContent += ' 👉 You';
            }

            // Show ready status
            li.textContent += players[id].ready ? ' ✅' : ' ❌';
            playerList.appendChild(li);

            if (!players[id].ready) allReady = false;
            playerCount++;
        }

        // Show "Let's Start" button only to host when all are ready
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
