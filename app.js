
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
const creditDisplay = document.getElementById("creditDisplay");
const creditsNumber = document.getElementById("creditsNumber");

loginBtn.onclick = () => {
const provider = new firebase.auth.GoogleAuthProvider();
auth.signInWithPopup(provider);
};

auth.onAuthStateChanged(async user=>{

if(!user) return;

loginBtn.classList.add("hidden");
profilePic.src=user.photoURL;
profilePic.classList.remove("hidden");

creditDisplay.classList.remove("hidden");

const userRef=db.collection("users").doc(user.uid);
const doc=await userRef.get();

if(!doc.exists){
await userRef.set({
plan:"free",
credits:1,
maxCredits:1,
lastReset:Date.now()
});
}

checkCreditReset();
updateCredits();

});

async function checkCreditReset(){

const user=auth.currentUser;
const ref=db.collection("users").doc(user.uid);
const doc=await ref.get();
const data=doc.data();

const day=1000*60*60*24;

if(Date.now()-data.lastReset>day){

await ref.update({
credits:data.maxCredits,
lastReset:Date.now()
});

}

}

async function updateCredits(){

const user=auth.currentUser;
const doc=await db.collection("users").doc(user.uid).get();
creditsNumber.innerText=doc.data().credits;

}

document.getElementById("testBtn").onclick=async ()=>{

const url=document.getElementById("urlInput").value;
const user=auth.currentUser;

if(!user){
alert("Please sign in first");
return;
}

const ref=db.collection("users").doc(user.uid);
const doc=await ref.get();
const data=doc.data();

if(data.credits<=0){
alert("No credits left today");
return;
}

await fetch("http://YOUR_PI_IP:5000/test",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({url:url})
});

await ref.update({
credits:data.credits-1
});

updateCredits();

};
