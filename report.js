// ================= report.js =================

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

let currentTest = null;

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

    // Get test ID from URL or sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('testId') || sessionStorage.getItem('selectedTestId');

    if (testId) {
        await loadTestReport(user.uid, testId);
    } else {
        window.location.href = "dashboard.html";
    }
});

// ================= LOAD TEST REPORT =================
async function loadTestReport(userId, testId) {
    try {
        console.log("Loading test report for:", testId);
        
        const testRef = db.collection("users").doc(userId).collection("tests").doc(testId);
        const doc = await testRef.get();

        if (!doc.exists) {
            console.error("Test not found");
            window.location.href = "dashboard.html";
            return;
        }

        currentTest = doc.data();
        console.log("Test data loaded:", currentTest);
        displayTestReport(currentTest);

    } catch (err) {
        console.error("Error loading test report:", err);
        window.location.href = "dashboard.html";
    }
}

// ================= DISPLAY TEST REPORT =================
function displayTestReport(test) {
    // Update header
    document.getElementById("reportUrl").innerText = test.url || "N/A";
    const date = new Date(test.timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById("reportDate").innerText = `Test Date: ${date}`;

    // Update score circles
    updateScoreCircles(test);

    // Display security metrics
    displaySecurityMetrics(test);

    // Display performance metrics
    displayPerformanceMetrics(test);

    // Display SEO metrics
    displaySeoMetrics(test);

    // Display recommendations
    displayRecommendations(test);
}

// ================= UPDATE SCORE CIRCLES =================
function updateScoreCircles(test) {
    const security = test.securityScore || 0;
    const performance = test.performanceScore || 0;
    const seo = test.seoScore || 0;

    const securityPercent = security > 0 ? (security / 100) * 100 : 0;
    const performancePercent = performance > 0 ? (performance / 100) * 100 : 0;
    const seoPercent = seo > 0 ? (seo / 100) * 100 : 0;

    // Security
    document.getElementById("securityScoreCircle").style.setProperty('--score-percent', securityPercent);
    document.getElementById("securityScoreValue").innerText = security > 0 ? security : "N/A";
    const securityRating = getRating(security);
    document.getElementById("securityRating").innerText = securityRating.label;
    document.getElementById("securityRating").className = `font-bold text-lg mb-6 ${securityRating.color}`;

    // Performance
    document.getElementById("performanceScoreCircle").style.setProperty('--score-percent', performancePercent);
    document.getElementById("performanceScoreValue").innerText = performance > 0 ? performance : "N/A";
    const performanceRating = getRating(performance);
    document.getElementById("performanceRating").innerText = performanceRating.label;
    document.getElementById("performanceRating").className = `font-bold text-lg mb-6 ${performanceRating.color}`;

    // SEO
    document.getElementById("seoScoreCircle").style.setProperty('--score-percent', seoPercent);
    document.getElementById("seoScoreValue").innerText = seo > 0 ? seo : "N/A";
    const seoRating = getRating(seo);
    document.getElementById("seoRating").innerText = seoRating.label;
    document.getElementById("seoRating").className = `font-bold text-lg mb-6 ${seoRating.color}`;
}

// ================= DISPLAY SECURITY METRICS =================
function displaySecurityMetrics(test) {
    const metrics = test.securityMetrics || {};
    const container = document.getElementById("securityMetrics");

    const securityChecks = [
        { name: "SSL/TLS Certificate", key: "ssl", icon: "🔒" },
        { name: "XSS Vulnerabilities", key: "xss", icon: "⚠️" },
        { name: "SQL Injection Risks", key: "sqlInjection", icon: "🔓" },
        { name: "CSRF Protection", key: "csrf", icon: "🛡️" },
        { name: "Exposed API Keys", key: "apiKeys", icon: "🔑" }
    ];

    container.innerHTML = securityChecks.map(check => {
        const status = metrics[check.key] || null;
        const isPass = status === "pass" || status === "safe" || status === "valid" || status === true;
        const isFail = status === "fail" || status === "unsafe" || status === "invalid" || status === false;
        const color = isPass ? "text-green-400" : isFail ? "text-red-400" : "text-gray-400";
        const icon = isPass ? "✓" : isFail ? "✗" : "?";
        const statusText = isPass ? "Pass" : isFail ? "Fail" : "N/A";

        return `
            <div class="metric-row" style="--metric-color: ${isPass ? '#22c55e' : isFail ? '#ef4444' : '#9ca3af'};">
                <div class="flex items-center gap-3">
                    <span class="text-xl">${check.icon}</span>
                    <span class="font-semibold">${check.name}</span>
                </div>
                <span class="font-bold ${color}">${icon} ${statusText}</span>
            </div>
        `;
    }).join("");
}

// ================= DISPLAY PERFORMANCE METRICS =================
function displayPerformanceMetrics(test) {
    const metrics = test.performanceMetrics || {};
    const container = document.getElementById("performanceMetrics");

    const performanceChecks = [
        { name: "Page Load Time", key: "loadTime", unit: "s", icon: "⚡" },
        { name: "Largest Contentful Paint (LCP)", key: "lcp", unit: "s", icon: "📊" },
        { name: "Cumulative Layout Shift (CLS)", key: "cls", unit: "", icon: "📐" },
        { name: "First Input Delay (FID)", key: "fid", unit: "ms", icon: "👆" },
        { name: "Time to First Byte (TTFB)", key: "ttfb", unit: "ms", icon: "⏱️" }
    ];

    container.innerHTML = performanceChecks.map(check => {
        const value = metrics[check.key];
        const displayValue = value !== undefined && value !== null ? `${value}${check.unit}` : "N/A";
        
        // Determine if it's good or needs improvement
        let isGood = true;
        if (value !== undefined && value !== null) {
            if (check.key === "loadTime" && value > 3) isGood = false;
            if (check.key === "lcp" && value > 2.5) isGood = false;
            if (check.key === "cls" && value > 0.1) isGood = false;
            if (check.key === "fid" && value > 100) isGood = false;
            if (check.key === "ttfb" && value > 600) isGood = false;
        } else {
            isGood = null;
        }

        const color = isGood === true ? "text-green-400" : isGood === false ? "text-yellow-400" : "text-gray-400";
        const borderColor = isGood === true ? '#22c55e' : isGood === false ? '#f59e0b' : '#9ca3af';

        return `
            <div class="metric-row" style="--metric-color: ${borderColor};">
                <div class="flex items-center gap-3">
                    <span class="text-xl">${check.icon}</span>
                    <span class="font-semibold">${check.name}</span>
                </div>
                <span class="font-bold ${color}">${displayValue}</span>
            </div>
        `;
    }).join("");
}

// ================= DISPLAY SEO METRICS =================
function displaySeoMetrics(test) {
    const metrics = test.seoMetrics || {};
    const container = document.getElementById("seoMetrics");

    const seoChecks = [
        { name: "Meta Tags", key: "metaTags", icon: "🏷️" },
        { name: "Mobile Responsive", key: "mobileResponsive", icon: "📱" },
        { name: "Page Speed", key: "pageSpeed", icon: "⚡" },
        { name: "Sitemap.xml", key: "sitemap", icon: "🗺️" },
        { name: "Robots.txt", key: "robots", icon: "🤖" }
    ];

    container.innerHTML = seoChecks.map(check => {
        const status = metrics[check.key] || null;
        const isPass = status === "pass" || status === "yes" || status === "present" || status === true;
        const isFail = status === "fail" || status === "no" || status === "missing" || status === false;
        const color = isPass ? "text-green-400" : isFail ? "text-orange-400" : "text-gray-400";
        const icon = isPass ? "✓" : isFail ? "⚠" : "?";
        const statusText = isPass ? "Present" : isFail ? "Missing" : "N/A";

        return `
            <div class="metric-row" style="--metric-color: ${isPass ? '#22c55e' : isFail ? '#f59e0b' : '#9ca3af'};">
                <div class="flex items-center gap-3">
                    <span class="text-xl">${check.icon}</span>
                    <span class="font-semibold">${check.name}</span>
                </div>
                <span class="font-bold ${color}">${icon} ${statusText}</span>
            </div>
        `;
    }).join("");
}

// ================= DISPLAY RECOMMENDATIONS =================
function displayRecommendations(test) {
    const recommendations = test.recommendations || [];
    const container = document.getElementById("recommendations");

    if (recommendations.length === 0) {
        container.innerHTML = `
            <div class="p-6 bg-green-500/10 border-l-4 border-green-500 rounded-lg">
                <h4 class="font-bold text-green-400 mb-2">✓ Excellent Job!</h4>
                <p class="text-gray-400">No recommendations at this time. Your website is performing well!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = recommendations.map(rec => {
        let borderColor = "#f59e0b";
        let bgColor = "yellow-500/10";
        let textColor = "yellow-400";
        let icon = "⚠️";

        if (rec.severity === "critical") {
            borderColor = "#ef4444";
            bgColor = "red-500/10";
            textColor = "red-400";
            icon = "🔴";
        } else if (rec.severity === "info") {
            borderColor = "#3b82f6";
            bgColor = "blue-500/10";
            textColor = "blue-400";
            icon = "ℹ️";
        }

        return `
            <div class="p-6 bg-${bgColor} border-l-4 rounded-lg" style="border-left-color: ${borderColor};">
                <h4 class="font-bold text-${textColor} mb-2">${icon} ${rec.title || "Recommendation"}</h4>
                <p class="text-gray-400 mb-3">${rec.description || "N/A"}</p>
                <p class="text-sm text-gray-500"><strong>Action:</strong> ${rec.action || "N/A"}</p>
            </div>
        `;
    }).join("");
}

// ================= GET RATING =================
function getRating(score) {
    if (!score || score === 0) {
        return { label: "N/A", color: "text-gray-400" };
    }
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
