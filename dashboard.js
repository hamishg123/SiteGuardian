// ================= dashboard.js =================

const firebaseConfig = {
  apiKey: "AIzaSyAaSH_-zEHnM_xdUaxc2UkuFuEU5K-qu-0",
  authDomain: "siteguardian-a4905.firebaseapp.com",
  projectId: "siteguardian-a4905",
  storageBucket: "siteguardian-a4905.firebasestorage.app",
  messagingSenderId: "335620604777",
  appId: "1:335620604777:web:80feb62080089909dd33f8",
  measurementId: "G-25GJQ6FBQN"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let securityChart, seoChart;

// ================= AUTH CHECK =================
auth.onAuthStateChanged(async user => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    document.getElementById("profilePic").src = user.photoURL || "https://via.placeholder.com/36";
    document.getElementById("signOutBtn").onclick = () => {
        auth.signOut().then(() => {
            window.location.href = "index.html";
        });
    };

    await loadDashboardData(user.uid);
});

// ================= LOAD DASHBOARD DATA =================
async function loadDashboardData(userId) {
    try {
        const testsRef = db.collection("users").doc(userId).collection("tests");
        const snapshot = await testsRef.orderBy("timestamp", "desc").get();

        const tests = [];
        let totalSecurityScore = 0;
        let totalSeoScore = 0;
        let totalPerformanceScore = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            tests.push({
                id: doc.id,
                ...data
            });
            totalSecurityScore += data.securityScore || 0;
            totalSeoScore += data.seoScore || 0;
            totalPerformanceScore += data.performanceScore || 0;
        });

        // Update stats
        document.getElementById("totalTests").innerText = tests.length;
        
        if (tests.length > 0) {
            document.getElementById("avgSecurityScore").innerText = Math.round(totalSecurityScore / tests.length) + "%";
            document.getElementById("avgSeoScore").innerText = Math.round(totalSeoScore / tests.length) + "%";
            document.getElementById("avgPerformance").innerText = Math.round(totalPerformanceScore / tests.length) + "%";
        }

        // Render test results
        renderTestResults(tests);

        // Initialize charts
        initCharts(tests);

    } catch (err) {
        console.error("Error loading dashboard:", err);
    }
}

// ================= RENDER TEST RESULTS =================
function renderTestResults(tests) {
    const testsList = document.getElementById("testsList");
    
    if (tests.length === 0) {
        testsList.innerHTML = `
            <div class="text-center py-12 text-gray-400">
                <p>No tests yet. <a href="index.html" class="text-green-400 hover:text-green-300">Run your first test</a></p>
            </div>
        `;
        return;
    }

    testsList.innerHTML = tests.map(test => {
        const date = new Date(test.timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const securityRating = getRating(test.securityScore);
        const seoRating = getRating(test.seoScore);
        const performanceRating = getRating(test.performanceScore);

        return `
            <div class="p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-green-500/30 transition-colors">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div class="flex-1">
                        <h3 class="font-bold text-lg mb-2">${test.url}</h3>
                        <p class="text-sm text-gray-500">${date}</p>
                    </div>
                    <div class="grid grid-cols-3 gap-4">
                        <div class="text-center">
                            <p class="text-xs text-gray-400 mb-1">Security</p>
                            <p class="text-2xl font-bold ${securityRating.color}">${test.securityScore}%</p>
                            <p class="text-xs text-gray-500">${securityRating.label}</p>
                        </div>
                        <div class="text-center">
                            <p class="text-xs text-gray-400 mb-1">SEO</p>
                            <p class="text-2xl font-bold ${seoRating.color}">${test.seoScore}%</p>
                            <p class="text-xs text-gray-500">${seoRating.label}</p>
                        </div>
                        <div class="text-center">
                            <p class="text-xs text-gray-400 mb-1">Performance</p>
                            <p class="text-2xl font-bold ${performanceRating.color}">${test.performanceScore}%</p>
                            <p class="text-xs text-gray-500">${performanceRating.label}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

// ================= GET RATING =================
function getRating(score) {
    if (score >= 80) {
        return { label: "Excellent", color: "text-green-400" };
    } else if (score >= 60) {
        return { label: "Good", color: "text-yellow-400" };
    } else if (score >= 40) {
        return { label: "Fair", color: "text-orange-400" };
    } else {
        return { label: "Poor", color: "text-red-400" };
    }
}

// ================= INIT CHARTS =================
function initCharts(tests) {
    if (tests.length === 0) return;

    // Prepare data
    const labels = tests.slice(0, 10).reverse().map((test, idx) => `Test ${idx + 1}`);
    const securityData = tests.slice(0, 10).reverse().map(test => test.securityScore);
    const seoData = tests.slice(0, 10).reverse().map(test => test.seoScore);

    // Security Chart
    const securityCtx = document.getElementById("securityChart").getContext("2d");
    securityChart = new Chart(securityCtx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Security Score",
                data: securityData,
                borderColor: "#22c55e",
                backgroundColor: "rgba(34, 197, 94, 0.1)",
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "#22c55e",
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: "#d1d5db",
                        font: { family: "'Inter', sans-serif" }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: "rgba(255, 255, 255, 0.05)" },
                    ticks: { color: "#9ca3af" }
                },
                x: {
                    grid: { color: "rgba(255, 255, 255, 0.05)" },
                    ticks: { color: "#9ca3af" }
                }
            }
        }
    });

    // SEO Chart
    const seoCtx = document.getElementById("seoChart").getContext("2d");
    seoChart = new Chart(seoCtx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "SEO Score",
                data: seoData,
                borderColor: "#22c55e",
                backgroundColor: "rgba(34, 197, 94, 0.1)",
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "#22c55e",
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: "#d1d5db",
                        font: { family: "'Inter', sans-serif" }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: "rgba(255, 255, 255, 0.05)" },
                    ticks: { color: "#9ca3af" }
                },
                x: {
                    grid: { color: "rgba(255, 255, 255, 0.05)" },
                    ticks: { color: "#9ca3af" }
                }
            }
        }
    });
}
