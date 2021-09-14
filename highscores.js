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
let showhighscores = false;

const highscoreUI = document.getElementById("highscoretable");

const highscoreRef = ref(db, "highscores/");
onValue(highscoreRef, (snapshot) => {
  const data = snapshot.val();
  console.log(JSON.stringify(data));
  highscores = data;
  highscores.sort((a, b) => {
    return b.score - a.score;
  });
  highscores = highscores.slice(0, 10);
  if (showhighscores) {
    let i = 1;
    var table = document.createElement("table");
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
    let title = document.createElement("h2");
    title.innerHTML = "HIGH SCORES";
    highscoreUI.appendChild(title);
    highscoreUI.appendChild(table);
  }
});

document.getElementById("name").addEventListener("change", (e) => {
  const name = e.target.value;
  const score = document.getElementById("endscore").innerHTML;
  showhighscores = true;
  get(highscoreRef).then((snapshot) => {
    highscores = snapshot.val();
    console.log("DAMANE", highscores);
    highscores.push({ name: name, score: score });
    writeToDB();
  });
});

function writeToDB() {
  set(ref(db, "/"), {
    highscores: highscores,
  });
}
