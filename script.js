/********************  Firebase initialisation  ********************/
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

/********************  Auth setup  ************************/
/* Keep user signed-in between visits */
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

/* Centralised auth handler:
   – fires after Google redirect returns
   – fires on every page refresh if user still signed-in */
auth.onAuthStateChanged(user => {
  if (!user) {
    console.log('No user – show login page');
    document.getElementById('login-page').style.display  = 'block';
    document.getElementById('lobby-page').style.display  = 'none';
    return;
  }
  console.log('Logged-in as', user.displayName);

  playerId   = user.uid;
  playerName = user.displayName || user.email;

  document.getElementById('player-name').textContent = playerName;
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('lobby-page').style.display = 'block';

  joinLobby();          // continue normal flow
});

/* Trigger Google login (redirect) */
function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithRedirect(provider);
}

/* Optional logout button */
function signOutOfGame() {
  auth.signOut();
}

/********************  Global vars  ************************/
let playerId   = '';
let playerName = '';
let isHost     = false;

/********************  Lobby logic  ************************/
function joinLobby() {
  const playerRef = db.ref('lobby/' + playerId);

  /* Add player if not already present */
  playerRef.once('value').then(snap => {
    if (!snap.exists()) {
      playerRef.set({ name: playerName, ready: false });
      playerRef.onDisconnect().remove();
    }

    /* First player becomes host */
    db.ref('lobby').once('value').then(s => {
      if (s.numChildren() === 1) isHost = true;
      listenForPlayers();
      listenForGameStart();
    });
  });
}

function listenForPlayers() {
  db.ref('lobby').on('value', snap => {
    const ul = document.getElementById('player-list');
    ul.innerHTML = '';

    const players = snap.val() || {};
    const ids     = Object.keys(players);
    let allReady  = true;

    ids.forEach((id, index) => {
      const p   = players[id];
      let label = p.name;
      if (id === playerId) label += ' 👉 (You)';
      if (p.ready)         label += ' ✅ Ready';
      else                 allReady = false;
      if (index === 0)     label += ' (Host)';

      const li = document.createElement('li');
      li.textContent = label;
      ul.appendChild(li);
    });

    const startBtn = document.getElementById('start-button');
    startBtn.style.display =
      (isHost && allReady && ids.length > 1) ? 'block' : 'none';
  });
}

function markReady() {
  db.ref('lobby/' + playerId).update({ ready: true });
}

function startGame() {
  /* Host bundles only the ready players into /players, then starts game */
  db.ref('lobby').once('value').then(snap => {
    const players      = snap.val() || {};
    const roundPlayers = {};

    Object.entries(players).forEach(([id, pdata]) => {
      if (pdata.ready) {
        roundPlayers[id] = {
          name: pdata.name,
          score: 0,
          finished: false,
          completionTime: 0,
          disconnected: false
        };
      }
    });

    db.ref('players').set(roundPlayers);
    db.ref('gameStarted').set({ active: true, timestamp: Date.now() });
    db.ref('lobby').remove();                // clear lobby for next round
  });
}

function listenForGameStart() {
  db.ref('gameStarted').on('value', snap => {
    const g = snap.val();
    if (g && g.active) {
      /* encode playerName to be URL-safe */
      const pn = encodeURIComponent(playerName);
      window.location.href = `game.html?id=${playerId}&name=${pn}`;
    }
  });
}

/********************  Round-history helper  ************************/
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
