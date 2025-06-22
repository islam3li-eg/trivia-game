// script.js

// --- Firebase init ---
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
const db   = firebase.database();
const auth = firebase.auth();

// --- Auth setup ---
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
auth.onAuthStateChanged(user => {
  if (!user) {
    document.getElementById('login-page').style.display = 'block';
    document.getElementById('lobby-page').style.display = 'none';
    return;
  }
  playerId   = user.uid;
  playerName = user.displayName || user.email;
  document.getElementById('player-name').textContent  = playerName;
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('lobby-page').style.display = 'block';
  joinLobby();
});

function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    auth.signInWithRedirect(provider);
  } else {
    auth.signInWithPopup(provider)
      .catch(() => auth.signInWithRedirect(provider));
  }
}

function signOutOfGame() {
  auth.signOut();
  document.getElementById('login-page').style.display = 'block';
  document.getElementById('lobby-page').style.display = 'none';
}

// --- Globals ---
let playerId   = '';
let playerName = '';
let hostId     = '';
let isHost     = false;

// Reference for host assignment
const hostRef = db.ref('host');

// --- Lobby logic ---
function joinLobby() {
  const meRef = db.ref('lobby/' + playerId);

  // Add myself to lobby
  meRef.once('value').then(snap => {
    if (!snap.exists()) {
      meRef.set({ name: playerName, ready: false });
      meRef.onDisconnect().remove();
    }
    // Attempt to set host if none
    hostRef.transaction(curr => curr || playerId);
  });

  // React to host changes
  hostRef.on('value', snap => {
    hostId = snap.val();
    isHost = hostId === playerId;

    // If I am host, ensure hostRef is removed on my disconnect
    if (isHost) {
      hostRef.onDisconnect().remove();
    }

    // Show input for number of questions only to host
    document.getElementById('numQuestionsDiv').style.display = isHost ? 'block' : 'none';

    listenForPlayers();
    listenForGameStart();
  });
}

function listenForPlayers() {
  db.ref('lobby').on('value', snap => {
    const players = snap.val() || {};
    const ids     = Object.keys(players);
    const ul      = document.getElementById('player-list');
    ul.innerHTML  = '';
    let allReady  = true;

    ids.forEach(id => {
      const p     = players[id];
      let label   = p.name;
      if (id === playerId) label += ' 👉 (You)';
      if (p.ready)         label += ' ✅ Ready'; else allReady = false;
      if (id === hostId)   label += ' (Host)';

      const li = document.createElement('li');
      li.textContent = label;
      ul.appendChild(li);
    });

    // Show Start button only to host with all ready
    document.getElementById('start-button').style.display =
      (isHost && allReady && ids.length > 1) ? 'block' : 'none';
  });
}

function markReady() {
  db.ref('lobby/' + playerId).update({ ready: true });
}

function startGame() {
  const nq = parseInt(document.getElementById('numQuestions').value, 10);
  if (isNaN(nq) || nq < 1) {
    alert('Please enter a valid number of questions.');
    return;
  }

  // Build roundPlayers and clear lobby
  db.ref('lobby').once('value').then(snap => {
    const roundPlayers = {};
    snap.forEach(child => {
      const p = child.val();
      if (p.ready) {
        roundPlayers[child.key] = {
          name: p.name, score: 0, finished: false,
          completionTime: 0, disconnected: false
        };
      }
    });

    db.ref('players').set(roundPlayers);

    // Start game with metadata
    db.ref('gameStarted').set({
      active: true,
      timestamp: Date.now(),
      numQuestions: nq
    });

    db.ref('lobby').remove();
  });
}

function listenForGameStart() {
  db.ref('gameStarted').on('value', snapGame => {
    const g = snapGame.val();
    if (g && g.active) {
      // Only redirect if this player is in /players
      db.ref(`players/${playerId}`).once('value').then(snapP => {
        if (snapP.exists()) {
          const pn = encodeURIComponent(playerName);
          window.location.href = `game.html?id=${playerId}&name=${pn}&numQuestions=${g.numQuestions}`;
        }
      });
    }
  });
}

// --- After round: clear host and gameStarted ---
function saveGameHistory() {
  db.ref('players').once('value').then(snap => {
    const players = snap.val() || {};
    let champ = '', top = -1;
    Object.values(players).forEach(p => {
      if (p.score > top) { top = p.score; champ = p.name; }
    });

    // Push to history
    db.ref('history').push({
      date: new Date().toISOString(),
      players: players,
      champion: champ
    });

    // Clear round data
    db.ref('players').remove();
    db.ref('gameStarted').remove();
    hostRef.remove();  // Reset host for next round
  });
}
