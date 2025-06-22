/*********************  Firebase init  ************************/
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

/*********************  Globals  ************************/
let playerId   = '';
let playerName = '';
let isHost     = false;

/*********************  Auth flow  ************************/
// 1️⃣  keep user signed-in between visits
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// 2️⃣  main listener – fires:
//      • after a redirect login
//      • on every refresh if user is already signed-in
auth.onAuthStateChanged(user => {
  if (!user) {
    // Not logged in → stay on login page
    console.log('No user – show login page');
    document.getElementById('login-page').style.display  = 'block';
    document.getElementById('lobby-page').style.display  = 'none';
    return;
  }

  // Logged-in user detected
  playerId   = user.uid;
  playerName = user.displayName || user.email;

  console.log('User signed-in:', playerName);

  // Show lobby UI
  document.getElementById('player-name').textContent     = playerName;
  document.getElementById('login-page').style.display    = 'none';
  document.getElementById('lobby-page').style.display    = 'block';

  joinLobby();           // continue normal flow
});

// 3️⃣  button triggers redirect login
function signInWithGoogle () {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithRedirect(provider);
}

// 4️⃣  optional logout button
function signOut () {
  auth.signOut();
}

/*********************  Lobby logic  ************************/
function joinLobby() {
  const playerRef = db.ref('lobby/' + playerId);

  // add if not already present
  playerRef.once('value').then(snap => {
    if (!snap.exists()) {
      playerRef.set({ name: playerName, ready: false });
      playerRef.onDisconnect().remove();
    }

    // host = first player in list
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

    ids.forEach((id,i) => {
      const p  = players[id];
      let txt  = p.name;
      if (id === playerId)     txt += ' 👉 (You)';
      if (p.ready)             txt += ' ✅ Ready';
      else                     allReady = false;
      if (i === 0)             txt += ' (Host)';

      const li = document.createElement('li');
      li.textContent = txt;
      ul.appendChild(li);
    });

    const startBtn = document.getElementById('start-button');
    startBtn.style.display =
      (isHost && allReady && ids.length > 1) ? 'block' : 'none';
  });
}

function markReady() {
  db.ref('lobby/' + playerId).update({ ready:true });
}

function startGame() {
  db.ref('lobby').once('value').then(snap => {
    const roundPlayers = {};
    snap.forEach(child => {
      const p = child.val();
      if (p.ready) {
        roundPlayers[child.key] = {
          name: p.name, score:0, finished:false,
          completionTime:0, disconnected:false
        };
      }
    });

    db.ref('players').set(roundPlayers);
    db.ref('gameStarted').set({ active:true, timestamp:Date.now() });
    db.ref('lobby').remove();           // clear lobby for next round
  });
}

function listenForGameStart() {
  db.ref('gameStarted').on('value', snap => {
    const g = snap.val();
    if (g && g.active) {
      window.location.href =
        `game.html?id=${playerId}&name=${encodeURIComponent(playerName)}`;
    }
  });
}

/*********************  Round-history helper (unchanged)  ************************/
function saveGameHistory() {
  db.ref('players').once('value').then(snap => {
    const players = snap.val() || {};
    let topName   = '', topScore = -1;

    Object.values(players).forEach(p => {
      if (p.score > topScore) { topScore = p.score; topName = p.name; }
    });

    db.ref('history').push({
      date: new Date().toISOString(),
      players: players,
      champion: topName
    });

    db.ref('players').remove();
    db.ref('gameStarted').set({ active:false });
  });
}
