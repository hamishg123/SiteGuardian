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

let securityChart, performanceChart;

// ================= AUTH CHECK =================
auth.onAuthStateChanged(async user => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }

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
        let totalPerformanceScore = 0;
        let totalSeoScore = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            tests.push({
                id: doc.id,
                ...data
            });
            totalSecurityScore += data.securityScore || 0;
            totalPerformanceScore += data.performanceScore || 0;
            totalSeoScore += data.seoScore || 0;
        });

        // Render test results
        renderTestResults(tests);

        // Initialize charts
        if (tests.length > 0) {
            initCharts(tests);
        }

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
                <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <p>No tests yet. <a href="index.html" class="text-green-400 hover:text-green-300 font-semibold">Run your first test</a></p>
            </div>
        `;
        return;
    }

    testsList.innerHTML = tests.slice(0, 5).map(test => {
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
            <div class="p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-green-500/30 transition-all hover:bg-white/8">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div class="flex-1">
                        <h3 class="font-bold text-lg mb-2 truncate">${test.url}</h3>
                        <p class="text-sm text-gray-500">${date}</p>
                    </div>
                    <div class="grid grid-cols-3 gap-6">
                        <div class="text-center">
                            <p class="text-xs text-gray-400 mb-2 uppercase tracking-wider font-semibold">Security</p>
                            <p class="text-3xl font-black ${securityRating.color}">${test.securityScore}</p>
                            <p class="text-xs text-gray-500 mt-1">${securityRating.label}</p>
                        </div>
                        <div class="text-center">
                            <p class="text-xs text-gray-400 mb-2 uppercase tracking-wider font-semibold">SEO</p>
                            <p class="text-3xl font-black ${seoRating.color}">${test.seoScore}</p>
                            <p class="text-xs text-gray-500 mt-1">${seoRating.label}</p>
                        </div>
                        <div class="text-center">
                            <p class="text-xs text-gray-400 mb-2 uppercase tracking-wider font-semibold">Performance</p>
                            <p class="text-3xl font-black ${performanceRating.color}">${test.performanceScore}</p>
                            <p class="text-xs text-gray-500 mt-1">${performanceRating.label}</p>
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
    const performanceData = tests.slice(0, 10).reverse().map(test => test.performanceScore);

    // Security Chart
    const securityCtx = document.getElementById("securityChart");
    if (securityCtx) {
        securityChart = new Chart(securityCtx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: "Security Score",
                    data: securityData,
                    borderColor: "#ef4444",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: "#ef4444",
                    pointBorderColor: "#fff",
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: "#d1d5db",
                            font: { family: "'Inter', sans-serif", size: 12, weight: 'bold' },
                            padding: 20
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: "rgba(255, 255, 255, 0.05)", drawBorder: false },
                        ticks: { color: "#9ca3af", font: { family: "'Inter', sans-serif" } }
                    },
                    x: {
                        grid: { color: "rgba(255, 255, 255, 0.05)", drawBorder: false },
                        ticks: { color: "#9ca3af", font: { family: "'Inter', sans-serif" } }
                    }
                }
            }
        });
    }

    // Performance Chart
    const performanceCtx = document.getElementById("performanceChart");
    if (performanceCtx) {
        performanceChart = new Chart(performanceCtx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: "Performance Score",
                    data: performanceData,
                    borderColor: "#3b82f6",
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: "#3b82f6",
                    pointBorderColor: "#fff",
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: "#d1d5db",
                            font: { family: "'Inter', sans-serif", size: 12, weight: 'bold' },
                            padding: 20
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: "rgba(255, 255, 255, 0.05)", drawBorder: false },
                        ticks: { color: "#9ca3af", font: { family: "'Inter', sans-serif" } }
                    },
                    x: {
                        grid: { color: "rgba(255, 255, 255, 0.05)", drawBorder: false },
                        ticks: { color: "#9ca3af", font: { family: "'Inter', sans-serif" } }
                    }
                }
            }
        });
    }
}
