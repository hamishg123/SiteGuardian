
// app.js

const firebaseConfig = {
apiKey: "AIzaSyAaSH_-zEHnM_xdUaxc2UkuFuEU5K-qu-0",
authDomain: "siteguardian-a4905.firebaseapp.com",
projectId: "siteguardian-a4905"
};

firebase.initializeApp(firebaseConfig);

const auth=firebase.auth();
const db=firebase.firestore();

const loginBtn=document.getElementById("loginBtn");
const dashboard=document.getElementById("dashboard");

loginBtn.onclick=()=>{

const provider=new firebase.auth.GoogleAuthProvider();
auth.signInWithPopup(provider);

};

auth.onAuthStateChanged(async user=>{

if(user){

loginBtn.innerText=user.displayName;

dashboard.style.display="block";

const ref=db.collection("users").doc(user.uid);
const doc=await ref.get();

if(!doc.exists){
await ref.set({tests:0});
};
