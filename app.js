
// ================= app.js =================

const firebaseConfig = {
  apiKey: "AIzaSyAaSH_-zEHnM_xdUaxc2UkuFuEU5K-qu-0",
  authDomain: "siteguardian-a4905.firebaseapp.com",
  projectId: "siteguardian-a4905",
  storageBucket: "siteguardian-a4905.firebasestorage.app",
  messagingSenderId: "335620604777",
  appId: "1:335620604777:web:80feb62080089909dd33f8",
  measurementId: "G-25GJQ6FBQN"
};

// ================= FIREBASE CONFIG =================



firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

const loginBtn = document.getElementById("loginBtn");
const profilePic = document.getElementById("profilePic");
const testsLeftText = document.getElementById("testsLeft");


// ================= LOGIN =================

loginBtn.onclick = () => {

const provider = new firebase.auth.GoogleAuthProvider();
auth.signInWithPopup(provider);

};


// ================= USER STATE =================

auth.onAuthStateChanged(async user => {

if(!user) return;

loginBtn.classList.add("hidden");

profilePic.src = user.photoURL;
profilePic.classList.remove("hidden");

const userRef = db.collection("users").doc(user.uid);
const doc = await userRef.get();

if(!doc.exists){

await userRef.set({
plan:"free",
credits:1,
maxCredits:1,
lastReset:Date.now()
});

}

await checkCreditReset();
updateCreditsDisplay();

});


// ================= CREDIT RESET =================

async function checkCreditReset(){

const user = auth.currentUser;
const userRef = db.collection("users").doc(user.uid);

const doc = await userRef.get();
const data = doc.data();

const now = Date.now();
const day = 1000 * 60 * 60 * 24;

if(now - data.lastReset > day){

await userRef.update({
credits:data.maxCredits,
lastReset:now
});

}

}


// ================= UPDATE UI =================

async function updateCreditsDisplay(){

const user = auth.currentUser;
const doc = await db.collection("users").doc(user.uid).get();
const data = doc.data();

testsLeftText.innerText = `Credits remaining today: ${data.credits}`;

}


// ================= RUN TEST =================

document.getElementById("testBtn").onclick = async () => {

const url = document.getElementById("urlInput").value;

const user = auth.currentUser;

if(!user){
alert("Please sign in first");
return;
}

const userRef = db.collection("users").doc(user.uid);
const doc = await userRef.get();
const data = doc.data();

if(data.credits <= 0){

alert("No credits left today. Upgrade your plan.");

return;

}


// send test to Raspberry Pi

await fetch("http://YOUR_PI_IP:5000/test",{

method:"POST",
headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({url:url})

});


// remove credit

await userRef.update({
credits:data.credits - 1
});


updateCreditsDisplay();

document.getElementById("result").innerText =
"AI agent started scanning your website...";

};
