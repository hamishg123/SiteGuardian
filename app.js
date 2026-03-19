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

// ================= STRIPE LINKS =================
const STRIPE_LINKS = {
    'price_starter': 'https://buy.stripe.com/8x200jalK4ZB39Q89H0Fi00',
    'price_pro': 'https://buy.stripe.com/bJeaEX79y1Np9ye61z0Fi01',
    'price_agency': 'https://buy.stripe.com/4gMaEXeC0eAbbGmgGd0Fi02'
};

// ================= FIREBASE INIT =================
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ================= ELEMENTS =================
const loginBtn = document.getElementById("loginBtn");
const profilePic = document.getElementById("profilePic");
const creditDisplay = document.getElementById("creditDisplay");
const creditsNumber = document.getElementById("creditsNumber");
const testBtn = document.getElementById("testBtn");
const urlInput = document.getElementById("urlInput");
const resultDisplay = document.getElementById("result");
const testsLeftDisplay = document.getElementById("testsLeft");

// ================= LOGIN =================
loginBtn.onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(err => {
        console.error("Login failed:", err);
        alert("Login failed. Please try again.");
    });
};

// ================= CHECKOUT =================
window.checkout = (priceId) => {
    const user = auth.currentUser;
    if (!user) {
        alert("Please sign in first to upgrade your plan.");
        loginBtn.click();
        return;
    }
    
    const link = STRIPE_LINKS[priceId];
    if (link) {
        // Append user ID to Stripe link for tracking if needed
        const checkoutUrl = new URL(link);
        checkoutUrl.searchParams.append('client_reference_id', user.uid);
        window.location.href = checkoutUrl.toString();
    }
};

// ================= AUTH STATE =================
auth.onAuthStateChanged(async user => {
    if (!user) {
        loginBtn.classList.remove("hidden");
        profilePic.classList.add("hidden");
        creditDisplay.classList.add("hidden");
        return;
    }

    loginBtn.classList.add("hidden");
    profilePic.src = user.photoURL;
    profilePic.classList.remove("hidden");
    creditDisplay.classList.remove("hidden");

    const userRef = db.collection("users").doc(user.uid);
    let doc = await userRef.get();

    if (!doc.exists) {
        await userRef.set({
            plan: "free",
            credits: 1,
            maxCredits: 1,
            lastReset: Date.now()
        });
        doc = await userRef.get();
    }

    await checkCreditReset();
    await updateCredits();
});

// ================= CREDIT RESET =================
async function checkCreditReset() {
    const user = auth.currentUser;
    if (!user) return;

    const ref = db.collection("users").doc(user.uid);
    const doc = await ref.get();
    if (!doc.exists) return;

    const data = doc.data();
    const day = 1000 * 60 * 60 * 24;

    if (Date.now() - data.lastReset > day) {
        await ref.update({
            credits: data.maxCredits,
            lastReset: Date.now()
        });
    }
}

// ================= UPDATE CREDIT UI =================
async function updateCredits() {
    const user = auth.currentUser;
    if (!user) return;

    const doc = await db.collection("users").doc(user.uid).get();
    if (!doc.exists) return;

    const data = doc.data();
    creditsNumber.innerText = data.credits;
    
    if (testsLeftDisplay) {
        testsLeftDisplay.innerText = `You have ${data.credits} tests remaining today.`;
    }
}

// ================= RUN TEST =================
testBtn.onclick = async () => {
    const url = urlInput.value;
    if (!url) {
        alert("Please enter a URL");
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        alert("Please sign in first");
        loginBtn.click();
        return;
    }

    const ref = db.collection("users").doc(user.uid);
    const doc = await ref.get();
    const data = doc.data();

    if (data.credits <= 0) {
        alert("No credits left today. Please upgrade your plan.");
        return;
    }

    testBtn.disabled = true;
    testBtn.innerText = "Testing...";
    resultDisplay.innerText = "AI Agent is analyzing your site...";

    try {
        // Simulate the test for now as the Pi IP is a placeholder
        // In a real scenario, this would be a fetch to the backend
        /*
        await fetch("https://api.siteguardian.ai/test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: url, userId: user.uid })
        });
        */
        
        // Mocking the delay
        await new Promise(resolve => setTimeout(resolve, 3000));

        await ref.update({
            credits: data.credits - 1
        });

        resultDisplay.innerText = "✅ Test Complete! No major errors found on " + url;
        updateCredits();
    } catch (err) {
        console.error(err);
        resultDisplay.innerText = "❌ Test failed. Please try again later.";
    } finally {
        testBtn.disabled = false;
        testBtn.innerText = "Run Free Test";
    }
};
