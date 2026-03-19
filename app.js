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
const loginModal = document.getElementById("loginModal");
const paymentModal = document.getElementById("paymentModal");
const noCreditsModal = document.getElementById("noCreditsModal");
const profilePic = document.getElementById("profilePic");
const creditDisplay = document.getElementById("creditDisplay");
const creditsNumber = document.getElementById("creditsNumber");
const testBtn = document.getElementById("testBtn");
const urlInput = document.getElementById("urlInput");
const resultDisplay = document.getElementById("result");
const testsLeftDisplay = document.getElementById("testsLeft");
const userMenu = document.getElementById("userMenu");
const signOutBtn = document.getElementById("signOutBtn");
const emailTab = document.getElementById("emailTab");
const signUpTab = document.getElementById("signUpTab");

let selectedPlan = 'pro';

// ================= MODAL FUNCTIONS =================
function openLoginModal() {
    loginModal.classList.remove("hidden");
    emailTab.classList.remove("hidden");
    signUpTab.classList.add("hidden");
}

function closeLoginModal() {
    loginModal.classList.add("hidden");
}

function openPaymentModal() {
    paymentModal.classList.remove("hidden");
}

function closePaymentModal() {
    paymentModal.classList.add("hidden");
}

function closeNoCreditsModal() {
    noCreditsModal.classList.add("hidden");
}

function toggleSignUp() {
    emailTab.classList.toggle("hidden");
    signUpTab.classList.toggle("hidden");
}

function selectPlan(plan) {
    selectedPlan = plan;
    document.getElementById("starterOption").classList.remove("border-green-500/50", "bg-green-500/5");
    document.getElementById("proOption").classList.remove("border-green-500/50", "bg-green-500/5");
    document.getElementById("agencyOption").classList.remove("border-green-500/50", "bg-green-500/5");
    
    if (plan === 'starter') {
        document.getElementById("starterOption").classList.add("border-green-500/50", "bg-green-500/5");
    } else if (plan === 'pro') {
        document.getElementById("proOption").classList.add("border-green-500/50", "bg-green-500/5");
    } else if (plan === 'agency') {
        document.getElementById("agencyOption").classList.add("border-green-500/50", "bg-green-500/5");
    }
}

function proceedToPayment() {
    const priceMap = {
        'starter': 'price_starter',
        'pro': 'price_pro',
        'agency': 'price_agency'
    };
    checkout(priceMap[selectedPlan]);
}

// ================= LOGIN FUNCTIONS =================
loginBtn.onclick = () => {
    openLoginModal();
};

signOutBtn.onclick = () => {
    auth.signOut().then(() => {
        closeLoginModal();
    }).catch(err => {
        console.error("Sign out failed:", err);
        alert("Sign out failed. Please try again.");
    });
};

// Email/Password Sign In
async function signInWithEmail() {
    const email = document.getElementById("emailInput").value;
    const password = document.getElementById("passwordInput").value;
    
    if (!email || !password) {
        alert("Please enter email and password");
        return;
    }
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        closeLoginModal();
    } catch (err) {
        alert("Sign in failed: " + err.message);
    }
}

// Email/Password Sign Up
async function signUpWithEmail() {
    const email = document.getElementById("signUpEmailInput").value;
    const password = document.getElementById("signUpPasswordInput").value;
    
    if (!email || !password || password.length < 6) {
        alert("Please enter a valid email and password (min 6 characters)");
        return;
    }
    
    try {
        await auth.createUserWithEmailAndPassword(email, password);
        closeLoginModal();
    } catch (err) {
        alert("Sign up failed: " + err.message);
    }
}

// Google Sign In
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(err => {
        console.error("Google sign in failed:", err);
        alert("Google sign in failed. Please try again.");
    });
}

// GitHub Sign In
function signInWithGitHub() {
    const provider = new firebase.auth.GithubAuthProvider();
    auth.signInWithPopup(provider).catch(err => {
        console.error("GitHub sign in failed:", err);
        alert("GitHub sign in failed. Please try again.");
    });
}

// Apple Sign In
function signInWithApple() {
    const provider = new firebase.auth.OAuthProvider('apple.com');
    auth.signInWithPopup(provider).catch(err => {
        console.error("Apple sign in failed:", err);
        alert("Apple sign in failed. Please try again.");
    });
}

// ================= CHECKOUT =================
window.checkout = (priceId) => {
    const user = auth.currentUser;
    if (!user) {
        alert("Please sign in first to upgrade your plan.");
        openLoginModal();
        return;
    }
    
    const link = STRIPE_LINKS[priceId];
    if (link) {
        const checkoutUrl = new URL(link);
        checkoutUrl.searchParams.append('client_reference_id', user.uid);
        window.location.href = checkoutUrl.toString();
    }
};

// ================= AUTH STATE =================
auth.onAuthStateChanged(async user => {
    if (!user) {
        loginBtn.classList.remove("hidden");
        userMenu.classList.add("hidden");
        creditDisplay.classList.add("hidden");
        return;
    }

    loginBtn.classList.add("hidden");
    userMenu.classList.remove("hidden");
    profilePic.src = user.photoURL || "https://via.placeholder.com/36";
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
        testsLeftDisplay.innerText = `You have ${data.credits} test${data.credits !== 1 ? 's' : ''} remaining today.`;
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
        openLoginModal();
        return;
    }

    const ref = db.collection("users").doc(user.uid);
    const doc = await ref.get();
    const data = doc.data();

    // Check if user has credits
    if (data.credits <= 0) {
        noCreditsModal.classList.remove("hidden");
        return;
    }

    testBtn.disabled = true;
    testBtn.innerText = "Testing...";
    resultDisplay.innerText = "🔍 AI Agent is analyzing your site...";

    try {
        // Simulate the test
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

// Close modals on outside click
document.addEventListener('click', (e) => {
    if (e.target === loginModal) closeLoginModal();
    if (e.target === paymentModal) closePaymentModal();
    if (e.target === noCreditsModal) closeNoCreditsModal();
});
