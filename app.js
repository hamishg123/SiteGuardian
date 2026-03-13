
// ================= app.js =================

const firebaseConfig={
apiKey:"YOUR_API_KEY",
authDomain:"YOUR_PROJECT.firebaseapp.com",
projectId:"YOUR_PROJECT"
};

firebase.initializeApp(firebaseConfig);

const auth=firebase.auth();
const db=firebase.firestore();

const loginBtn=document.getElementById("loginBtn");
const profilePic=document.getElementById("profilePic");
const testsLeftText=document.getElementById("testsLeft");

loginBtn.onclick=()=>{

const provider=new firebase.auth.GoogleAuthProvider();
auth.signInWithPopup(provider);

};


auth.onAuthStateChanged(async user=>{

if(user){

loginBtn.classList.add("hidden");

profilePic.src=user.photoURL;
profilePic.classList.remove("hidden");

const ref=db.collection("users").doc(user.uid);

const doc=await ref.get();

if(!doc.exists){
await ref.set({tests:0});
}

updateTests();

}

});


async function updateTests(){

const user=auth.currentUser;
const ref=db.collection("users").doc(user.uid);

const data=(await ref.get()).data();

const freeLeft=1-data.tests;

if(freeLeft>0){
testsLeftText.innerText=`Free tests left: ${freeLeft}`;
}else{
testsLeftText.innerText="No free tests left. Upgrade below.";
}

}



document.getElementById("testBtn").onclick=async()=>{

const url=document.getElementById("urlInput").value;

const user=auth.currentUser;

if(!user){
alert("Please sign in first");
return;
}

const ref=db.collection("users").doc(user.uid);

const data=(await ref.get()).data();

if(data.tests>=1){
alert("Free test used. Please upgrade.");
return;
}


await fetch("http://YOUR_PI_IP:5000/test",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({url:url})
});


await ref.update({tests:data.tests+1});

updateTests();


document.getElementById("result").innerText="AI agent started scanning your website...";

};
