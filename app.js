const firebaseConfig = {
apiKey: "AIzaSyAaSH_-zEHnM_xdUaxc2UkuFuEU5K-qu-0",
authDomain: "siteguardian-a4905.firebaseapp.com",
projectId: "siteguardian-a4905"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

const loginBtn = document.getElementById("loginBtn");
const dashboard = document.getElementById("dashboard");
const pricing = document.getElementById("pricing");

loginBtn.onclick = () => {

const provider = new firebase.auth.GoogleAuthProvider();

auth.signInWithPopup(provider);

};

auth.onAuthStateChanged(async user => {

if(user){

loginBtn.style.display="none";
dashboard.classList.remove("hidden");

const doc = await db.collection("users").doc(user.uid).get();

if(!doc.exists){

db.collection("users").doc(user.uid).set({
tests:0
});

}

}

});

document.getElementById("testBtn").onclick = async () => {

const url = document.getElementById("urlInput").value;

const user = auth.currentUser;

const userRef = db.collection("users").doc(user.uid);

const data = (await userRef.get()).data();

if(data.tests >= 1){

pricing.classList.remove("hidden");
return;

}

document.getElementById("result").innerText = "Testing...";

await fetch("http://YOUR_PI_IP:5000/test",{

method:"POST",
headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({url:url})

});

userRef.update({
tests:data.tests + 1
});

document.getElementById("result").innerText="Test sent. Results will appear soon.";

};
