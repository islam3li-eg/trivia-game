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
let deviceSessionKey = navigator.userAgent + '_' + Math.random(); // Unique device session

function joinLobby() {
    const deviceSessionRef = db.ref('deviceSessions/' + btoa(deviceSessionKey));

    // Check if this device already has a live session
    deviceSessionRef.once('value', (snapshot) => {
        if (snapshot.exists()) {
            alert('You already have a live session open on this device.');
            return;
        } else {
            startJoining(deviceSessionRef);
        }
    });
}

function startJoining(deviceSessionRef) {
    playerName = document.getElementById('player-name').value.trim();
    if (playerName === '') {
        alert('Please enter your name!');
        return;
    }

    playerId = Date.now(); // Unique ID

    // Save device session
    deviceSessionRef.set({
        active: true,
        playerId: playerId
    });

    // Auto remove device session on disconnect
    deviceSessionRef.onDisconnect().remove();

    // Save player to lobby
    db.ref('lobby/' + playerId).set({
        name: playerName,
        ready: false
    });

    // Auto remove player on disconnect
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

        for (let id in players) {
            if (!firstPlayerId) firstPlayerId = id;
        }

        for (let id in players) {
            const li = document.createElement('li');
            li.textContent = players[id].name;

            if (id === firstPlayerId) {
                li.textContent += ' 👑 Host';
            }

            if (id == playerId) {
                li.textContent += ' 👉 You';
            }

            li.textContent += players[id].ready ? ' ✅' : ' ❌';
            playerList.appendChild(li);

            if (!players[id].ready) allReady = false;
            playerCount++;
        }

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
    window.location.href = 'game.html'; // We will build this next
}
