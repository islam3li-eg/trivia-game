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

/******************** Auth setup ********************/
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

auth.onAuthStateChanged(user => {
  if (!user) {
    document.getElementById('login-page').style.display  = 'block';
    document.getElementById('lobby-page').style.display  = 'none';
    return;
  }
  // Signed in
  playerId   = user.uid;
  playerName = user.displayName || user.email;
  document.getElementById('player-name').textContent  = playerName;
  document.getElementById('login-page').style.display  = 'none';
  document.getElementById('lobby-page').style.display  = 'block';
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

/******************** Globals ********************/
let playerId   = '';
let playerName = '';
let hostId     = '';
let isHost     = false;
const hostRef  = db.ref('host');

/******************** Lobby logic ********************/
function joinLobby() {
  const meRef = db.ref('lobby/' + playerId);
  meRef.once('value').then(snap => {
    if (!snap.exists()) {
      meRef.set({ name: playerName, ready: false });
      meRef.onDisconnect().remove();
    }
    hostRef.transaction(curr => curr || playerId);
  });

  hostRef.on('value', snap => {
    hostId = snap.val();
    isHost = (hostId === playerId);
    if (isHost) hostRef.onDisconnect().remove();

    document.getElementById('numQuestionsDiv').style.display =
      isHost ? 'block' : 'none';

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
      const p   = players[id];
      let label = p.name;
      if (id === playerId) label += ' 👉 (You)';
      if (p.ready)         label += ' ✅ Ready';
      else                 allReady = false;
      if (id === hostId)   label += ' (Host)';
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

/******************** Start Game & History ********************/
function startGame() {
  // 1) Snapshot previous round
  db.ref('players').once('value').then(snap => {
    const players   = snap.val() || {};
    let champion    = '', topScore = -1;
    Object.values(players).forEach(p => {
      if (p.score > topScore) { topScore = p.score; champion = p.name; }
    });
    return db.ref('history').push({
      date:     new Date().toISOString(),
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
        if (child.val().ready) {
          roundPlayers[child.key] = {
            name: child.val().name,
            score: 0,
            finished: false,
            completionTime: 0,
            disconnected: false
          };
        }
      });
      db.ref('players').set(roundPlayers);
      db.ref('gameStarted').set({
        active:        true,
        timestamp:     Date.now(),
        numQuestions:  nq
      });
      db.ref('lobby').remove();
    });
  })
  .catch(err => console.error(err));
}

/******************** Listen for Start ********************/
function listenForGameStart() {
  db.ref('gameStarted').on('value', snapGame => {
    const g = snapGame.val();
    if (g && g.active) {
      db.ref(`players/${playerId}`).once('value').then(snapP => {
        if (snapP.exists()) {
          const pn = encodeURIComponent(playerName);
          window.location.href =
            `game.html?id=${playerId}&name=${pn}&numQuestions=${g.numQuestions}`;
        }
      });
    }
  });
}db.ref('gameStarted').set({ active: true, timestamp: Date.now() });
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
