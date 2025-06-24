// script.js

/******************** Firebase initialization ********************/
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

/******************** Authentication setup ********************/
// Persist auth state across sessions
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// Central listener: fires on login, redirect return, or page reload
auth.onAuthStateChanged(user => {
  if (!user) {
    // Show login page
    document.getElementById('login-page').style.display = 'block';
    document.getElementById('lobby-page').style.display = 'none';
    return;
  }

  // User is signed in
  playerId   = user.uid;
  playerName = user.displayName || user.email;

  document.getElementById('player-name').textContent   = playerName;
  document.getElementById('login-page').style.display  = 'none';
  document.getElementById('lobby-page').style.display  = 'block';

  joinLobby();
});

// Trigger Google Sign-In (popup on desktop, redirect on mobile)
function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    auth.signInWithRedirect(provider);
  } else {
    auth.signInWithPopup(provider)
      .catch(() => auth.signInWithRedirect(provider));
  }
}

// Sign out and show login again
function signOutOfGame() {
  auth.signOut();
  document.getElementById('login-page').style.display = 'block';
  document.getElementById('lobby-page').style.display = 'none';
}

/******************** Global variables ********************/
let playerId   = '';
let playerName = '';
let hostId     = '';
let isHost     = false;

const hostRef = db.ref('host');

/******************** Lobby logic ********************/
function joinLobby() {
  const meRef = db.ref('lobby/' + playerId);

  // Add self to lobby if not already present
  meRef.once('value').then(snap => {
    if (!snap.exists()) {
      meRef.set({ name: playerName, ready: false });
      meRef.onDisconnect().remove();
    }
    // Claim host slot if empty
    hostRef.transaction(current => current || playerId);
  });

  // React to host assignments/changes
  hostRef.on('value', snap => {
    hostId = snap.val();
    isHost = (hostId === playerId);

    // Ensure host slot clears on host disconnect
    if (isHost) {
      hostRef.onDisconnect().remove();
    }

    // Show number-of-questions input only to host
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
      if (p.ready)         label += ' ✅ Ready';
      else                 allReady = false;
      if (id === hostId)   label += ' (Host)';

      const li = document.createElement('li');
      li.textContent = label;
      ul.appendChild(li);
    });

    // Only host sees Start button when >1 players and all ready
    document.getElementById('start-button').style.display =
      (isHost && allReady && ids.length > 1) ? 'block' : 'none';
  });
}

function markReady() {
  db.ref('lobby/' + playerId).update({ ready: true });
}

/******************** Start game & save history ********************/
function startGame() {
  // 1) Snapshot /history from previous round (if any)
  db.ref('players').once('value').then(snapshot => {
    const players = snapshot.val() || {};
    let champion = '', topScore = -1;
    Object.values(players).forEach(p => {
      if (p.score > topScore) {
        topScore = p.score;
        champion = p.name;
      }
    });
    // Push date + champion
    return db.ref('history').push({
      date: new Date().toISOString(),
      champion: champion
    });
  })
  .then(() => {
    // 2) Begin new round
    const nq = parseInt(document.getElementById('numQuestions').value, 10);
    if (isNaN(nq) || nq < 1) {
      alert('Please enter a valid number of questions.');
      return;
    }

    return db.ref('lobby').once('value').then(snap => {
      const roundPlayers = {};
      snap.forEach(child => {
        const p = child.val();
        if (p.ready) {
          roundPlayers[child.key] = {
            name: p.name,
            score: 0,
            finished: false,
            completionTime: 0,
            disconnected: false
          };
        }
      });
      // Set up new game state
      db.ref('players').set(roundPlayers);
      db.ref('gameStarted').set({
        active: true,
        timestamp: Date.now(),
        numQuestions: nq
      });
      db.ref('lobby').remove();
    });
  })
  .catch(err => {
    console.error('Error in startGame/history:', err);
  });
}

/******************** Listen for game start ********************/
function listenForGameStart() {
  db.ref('gameStarted').on('value', snapGame => {
    const g = snapGame.val();
    if (g && g.active) {
      // Only redirect if I’m part of the new /players
      db.ref(`players/${playerId}`).once('value').then(snapP => {
        if (snapP.exists()) {
          const pn = encodeURIComponent(playerName);
          window.location.href = `game.html?id=${playerId}&name=${pn}&numQuestions=${g.numQuestions}`;
        }
      });
    }
  });
}
