// Firebase Configuration
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

let playerId = '';
let playerName = '';
let isHost = false;

function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then(result => {
            const user = result.user;
            playerId = user.uid;
            playerName = user.displayName;

            document.getElementById('player-name').textContent = playerName;
            document.getElementById('login-page').style.display = 'none';
            document.getElementById('lobby-page').style.display = 'block';

            joinLobby();
        })
        .catch(error => {
            console.error('Google Sign-In Error:', error);
            alert('Google Login Failed. Check console for details.');
        });
}

function joinLobby() {
    const playerRef = db.ref('lobby/' + playerId);

    playerRef.once('value').then(snapshot => {
        if (snapshot.exists()) {
            alert('You are already in the lobby.');
            return;
        }

        playerRef.set({ name: playerName, ready: false });
        playerRef.onDisconnect().remove();

        db.ref('lobby').once('value').then(snapshot => {
            if (snapshot.numChildren() === 1) {
                isHost = true;
            }
            listenForPlayers();
            listenForGameStart();
        });
    });
}

function listenForPlayers() {
    db.ref('lobby').on('value', snapshot => {
        const players = snapshot.val();
        const playerList = document.getElementById('player-list');
        playerList.innerHTML = '';

        let allReady = true;

        for (let id in players) {
            let playerText = players[id].name;
            if (id === playerId) playerText += ' 👉 (You)';
            if (players[id].ready) playerText += ' ✅ Ready';
            else allReady = false;

            if (id === Object.keys(players)[0]) playerText += ' (Host)';

            const li = document.createElement('li');
            li.textContent = playerText;
            playerList.appendChild(li);
        }

        if (isHost && allReady && Object.keys(players).length > 1) {
            document.getElementById('start-button').style.display = 'block';
        } else {
            document.getElementById('start-button').style.display = 'none';
        }
    });
}

function markReady() {
    db.ref('lobby/' + playerId).update({ ready: true });
}

function startGame() {
    db.ref('lobby').once('value').then(snapshot => {
        const players = snapshot.val();
        const roundPlayers = {};

        for (let id in players) {
            if (players[id].ready) {
                roundPlayers[id] = {
                    name: players[id].name,
                    score: 0,
                    finished: false,
                    completionTime: 0,
                    disconnected: false
                };
            }
        }

        db.ref('players').set(roundPlayers);
        db.ref('gameStarted').set({ active: true, timestamp: Date.now() });
        db.ref('lobby').remove(); // Clear the lobby
    });
}

function listenForGameStart() {
    db.ref('gameStarted').on('value', snapshot => {
        const gameData = snapshot.val();
        if (gameData && gameData.active === true) {
            window.location.href = `game.html?id=${playerId}&name=${playerName}`;
        }
    });
}

// Save game history when the round is completed
function saveGameHistory() {
    db.ref('players').once('value').then(snapshot => {
        const players = snapshot.val();
        let champion = '';
        let highestScore = -1;

        for (let id in players) {
            if (players[id].score > highestScore) {
                highestScore = players[id].score;
                champion = players[id].name;
            }
        }

        const historyRef = db.ref('history').push();
        historyRef.set({
            date: new Date().toISOString(),
            players: players,
            champion: champion
        });

        db.ref('players').remove();
        db.ref('gameStarted').set({ active: false });
    });
}
