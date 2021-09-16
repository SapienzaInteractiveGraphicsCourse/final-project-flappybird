// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-analytics.js";
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
} from "https://www.gstatic.com/firebasejs/9.0.2/firebase-database.js";
import { score } from "./index.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAfiJPQkynYVMXX0gmWmlg9gMRBTlyenJ4",
  authDomain: "flappy-b509f.firebaseapp.com",
  projectId: "flappy-b509f",
  storageBucket: "flappy-b509f.appspot.com",
  messagingSenderId: "1080403890703",
  appId: "1:1080403890703:web:09ac583e4988baa83e097a",
  measurementId: "G-KJNN380V1L",
  databaseURL:
    "https://flappy-b509f-default-rtdb.europe-west1.firebasedatabase.app",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log(app);
const db = getDatabase(app);
let highscores = [];
let table, title;

const highscoreUI = document.getElementById("highscoretable");
document.getElementById("showleaderboard").addEventListener("click", () => {
  showLeaderboard();
});

const highscoreRef = ref(db, "highscores/");
onValue(highscoreRef, (snapshot) => {
  const data = snapshot.val();
  console.log(JSON.stringify(data));
  highscores = data;
  highscores.sort((a, b) => {
    return b.score - a.score;
  });
  highscores = highscores.slice(0, 10);
  showHighscore();
});

function showLeaderboard() {
  get(highscoreRef).then((snapshot) => {
    const data = snapshot.val();
    console.log(JSON.stringify(data));
    highscores = data;
    highscores.sort((a, b) => {
      return b.score - a.score;
    });
    highscores = highscores.slice(0, 10);
    showHighscore();
  });
}

function showHighscore() {
  if (table && title) {
    highscoreUI.removeChild(table);
    highscoreUI.removeChild(title);
  }
  document.getElementById("showleaderboard").style.display = "none";
  let i = 1;
  table = document.createElement("table");
  for (const score of highscores) {
    var tr = document.createElement("tr");
    var td = document.createElement("td");
    td.innerHTML = i + ".";
    tr.appendChild(td);
    td = document.createElement("td");
    td.innerHTML = score.name;
    tr.appendChild(td);
    td = document.createElement("td");
    td.innerHTML = score.score;
    tr.appendChild(td);
    table.appendChild(tr);
    i++;
  }
  title = document.createElement("h2");
  title.innerHTML = "HIGH SCORES";
  highscoreUI.appendChild(title);
  highscoreUI.appendChild(table);
}

document.getElementById("name").addEventListener("change", (e) => {
  document
    .getElementById("newhighscore")
    .removeChild(document.getElementById("nameinput"));
  let name = e.target.value;
  if (/<\/?[a-z][\s\S]*>/i.test(name)) {
    name = "TriedHackingDidntWork";
  }
  name = name.slice(0, 25);
  const newScore = score;
  get(highscoreRef).then((snapshot) => {
    highscores = snapshot.val();
    console.log("DAMANE", highscores);
    highscores.push({ name: name, score: newScore });
    writeToDB();
  });
});

function writeToDB() {
  highscores.sort((a, b) => {
    return b.score - a.score;
  });
  set(ref(db, "/"), {
    highscores: highscores,
  });
}
