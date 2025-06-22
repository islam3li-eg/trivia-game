/********************  Firebase init  ********************/
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

/********************  Auth setup  ********************/
// Keep users signed-in across visits
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// Central listener for both initial load and popup sign-in
auth.onAuthStateChanged(user => {
  if (!user) {
    console.log('No user – show login');
    document.getElementById('login-page').style.display = 'block';
    document.getElementById('lobby-page').style.display = 'none';
    return;
  }

  console.log('Logged in as', user.displayName);
  playerId   = user.uid;
  playerName = user.displayName || user.email;

  // Show lobby
  document.getElementById('player-name').textContent  = playerName;
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('lobby-page').style.display = 'block';

  joinLobby();
});

// Trigger Google popup
function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
      .catch(err => console.warn('Popup failed:', err.code));
}

// Optional sign-out
function signOutOfGame() {
  auth.signOut();
}

/********************  Globals  ********************/
let playerId   = '';
let playerName = '';
let isHost     = false;

/********************  Lobby logic  ********************/
function joinLobby() {
  const ref = db.ref('lobby/' + playerId);
  ref.once('value').then(snap => {
    if (!snap.exists()) {
      ref.set({ name: playerName, ready: false });
      ref.onDisconnect().remove();
    }
    db.ref('lobby').once('value').then(s => {
      if (s.numChildren() === 1) isHost = true;
      listenForPlayers();
      listenForGameStart();
    });
  });
}

function listenForPlayers() {
  db.ref('lobby').on('value', snap => {
    const players = snap.val() || {};
    const ids     = Object.keys(players);
    const ul      = document.getElementById('player-list');
    ul.innerHTML  = '';
    let allReady  = true;

    ids.forEach((id,i) => {
      const p      = players[id];
      let label    = p.name;
      if (id === playerId) label += ' 👉 (You)';
      if (p.ready)         label += ' ✅ Ready'; else allReady = false;
      if (i === 0)         label += ' (Host)';
      const li = document.createElement('li');
      li.textContent = label;
      ul.appendChild(li);
    });

    document.getElementById('start-button').style.display =
      (isHost && allReady && ids.length > 1) ? 'block' : 'none';
  });
}

function markReady() {
  db.ref('lobby/' + playerId).update({ ready: true });
}

function startGame() {
  db.ref('lobby').once('value').then(snap => {
    const roundPlayers = {};
    snap.forEach(child => {
      const p = child.val();
      if (p.ready) {
        roundPlayers[child.key] = {
          name: p.name, score: 0,
          finished: false, completionTime: 0,
          disconnected: false
        };
      }
    });
    db.ref('players').set(roundPlayers);
    db.ref('gameStarted').set({ active: true, timestamp: Date.now() });
    db.ref('lobby').remove();
  });
}

function listenForGameStart() {
  db.ref('gameStarted').on('value', snap => {
    const g = snap.val();
    if (g && g.active) {
      const pn = encodeURIComponent(playerName);
      window.location.href = `game.html?id=${playerId}&name=${pn}`;
    }
  });
}

/********************  History helper  ********************/
function saveGameHistory() {
  db.ref('players').once('value').then(snap => {
    const players = snap.val() || {};
    let champ     = '', top = -1;
    Object.values(players).forEach(p => {
      if (p.score > top) { top = p.score; champ = p.name; }
    });
    db.ref('history').push({
      date: new Date().toISOString(),
      players: players,
      champion: champ
    });
    db.ref('players').remove();
    db.ref('gameStarted').set({ active: false });
  });
}
