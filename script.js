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

// Global variables
let playerId = '';
let playerName = '';
let isHost = false;

// Join the lobby
function joinLobby() {
    playerName = document.getElementById('player-name').value.trim();
    if (playerName === '') {
        alert('Please enter your name');
        return;
    }

    const deviceId = getDeviceId();
    const deviceSessionRef = db.ref('deviceSessions/' + deviceId);

    deviceSessionRef.once('value').then(snapshot => {
        if (snapshot.exists()) {
            alert('You have already joined from this device.');
        } else {
            playerId = db.ref().child('lobby').push().key;

            deviceSessionRef.set({ active: true });
            deviceSessionRef.onDisconnect().remove();

            startJoining(deviceSessionRef);
        }
    });
}

// Manage player joining
function startJoining(deviceSessionRef) {
    document.getElementById('landing-page').style.display = 'none';
    document.getElementById('lobby').style.display = 'block';

    const lobbyRef = db.ref('lobby/' + playerId);
    lobbyRef.set({
        name: playerName,
        ready: false
    });
    lobbyRef.onDisconnect().remove();

    // Check if this is the first player → host
    db.ref('lobby').once('value').then(snapshot => {
        if (snapshot.numChildren() === 1) {
            isHost = true;
            document.getElementById('start-button').style.display = 'block';
        }
    });

    listenForPlayers();
    listenForGameStart();
}

// Show all players in lobby
function listenForPlayers() {
    db.ref('lobby').on('value', snapshot => {
        const players = snapshot.val();
        const playerList = document.getElementById('player-list');
        playerList.innerHTML = '';

        let allReady = true;

        for (let id in players) {
            let playerText = players[id].name;
            if (id === playerId) {
                playerText += ' 👉 (You)';
            }
            if (players[id].ready) {
                playerText += ' ✅ Ready';
            } else {
                allReady = false;
            }

            const li = document.createElement('li');
            li.textContent = playerText;
            playerList.appendChild(li);
        }

        // Show start button only for the host and when all are ready
        if (isHost && allReady && Object.keys(players).length > 1) {
            document.getElementById('start-button').style.display = 'block';
        } else {
            document.getElementById('start-button').style.display = 'none';
        }
    });
}

// Mark player as ready
function markReady() {
    db.ref('lobby/' + playerId).update({ ready: true });
}

// Host starts the game
function startGame() {
    db.ref('gameStarted').set(true);
}

// All players listen for game start
function listenForGameStart() {
    db.ref('gameStarted').on('value', snapshot => {
        if (snapshot.exists() && snapshot.val() === true) {
            window.location.href = `game.html?id=${playerId}&name=${playerName}`;
        }
    });
}

// Device ID generator (simple cookie replacement)
function getDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
        deviceId = 'device-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
}
