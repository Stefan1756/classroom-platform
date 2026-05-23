import { db } from "../../core/firebase.js";
import { navigate } from "../../core/router.js";
import { getUser } from "../../core/auth.js";
import { openClassroomHome } from "./classroomHome.js";
import { openEnrollmentPage } from "./tabs/allClassesTab.js";

import { 
    collection,
    query,
    where,
    getDocs,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { showToast } from "../../core/ui.js";

export function loadSearch() {
    const container = document.getElementById("contentArea");
    container.innerHTML = `
        <div class="search-page">
            <div class="search-header">
                <span class="material-icons back-btnn" id="backBtn">
                    arrow_back_ios
                </span>
                <h2>Search</h2>
            </div>
            <div class="search-input-wrapper">
                <span class="material-icons">search</span>
                <input type="text" id="searchInput"
                    placeholder="Search classes, exam, teachers..." />
            </div>

            <div class="search-section" id="recentSection">
                <div class="section-top">
                    <h3>Recent Searches</h3>
                </div>

                <div id="recentSearches"></div>
            </div>

            <div class="search-section" id="trendingSection">
                <div class="section-top">
                    <h3>Most Search Classes</h3>
                </div>

                <div id="trendingClasses" class="trending-scroll"></div>
            </div>

            <div id="searchResults" class="search-results"></div>
        </div>
    `;
    document.getElementById("backBtn").onclick = () => {
        navigate("dashboard");
    };
    initSearch();
    loadRecentSearches();
    loadTrendingClasses();
}

function initSearch() {
    const input = document.getElementById("searchInput");
    const results = document.getElementById("searchResults");

    let timeout;

    input.addEventListener("input", (e) => {
        const value = e.target.value.trim();

        clearTimeout(timeout);

        if (!value) {
            results.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">search</span>
                    <p>Start typing to discover learning content</p>
                </div>
            `;
            return;
        }
        timeout = setTimeout(() => {
            performSearch(value);
        }, 400);

        const recentSection = document.getElementById("recentSection");
        const trendingSection = document.getElementById("trendingSection");

        if (value) {
            recentSection.classList.add("minimized");
            trendingSection.classList.add("minimized");
        } else {
            recentSection.classList.remove("minimized");
            trendingSection.classList.remove("minimized");
        }
    });
}

async function performSearch(keyword) {
    const results = document.getElementById("searchResults");
    const q = query(collection(db, "classes"));
    const snap = await getDocs(q);
    const filtered = snap.docs
        .map(d => ({ id: d.id, ...d.data()}))
        .filter(c =>
            c.name?.toLowerCase().includes(keyword.toLowerCase()) ||
            c.description?.toLowerCase().includes(keyword.toLowerCase())
        );
    renderResults(filtered);
    saveRecentSearch(keyword);
}

function renderResults(items) {
    const results = document.getElementById("searchResults");
    if (!items.length) {
        results.innerHTML = `
            <div class="empty-state">
                <span class="material-icons">sentiment_dissatisfied</span>
                <p>No results found</p>
            </div>
        `;
        return;
    }

    results.innerHTML = "";

    items.forEach(item => {
        const card = document.createElement("div");
        card.className = "search-card";
        const image =
            item.image ||
            getClassImage(item.name)
        card.innerHTML = `
            <img src="${image}" />
            
            <div class="search-card-body">
                <h3>${item.name}</h3>
                <p>${item.description || "No description"}</p>
                
                <button class="open-btn">
                    Open Class
                </button>
            </div>
        `;
        const openBtn = card.querySelector(".open-btn");
        if (openBtn) {
            openBtn.onclick = () => {
                handleClassAccess(item.id, item);
            };
        }
        results.appendChild(card);
    });
}

async function handleClassAccess(classId, classData) {
    const userId = getUser().uid;
    const enrollQuery = query(
        collection(db, "enrollments"),
        where("studentId", "==", userId),
        where("classId", "==", classId)
    );

    const enrollSnap = await getDocs(enrollQuery);

    if (enrollSnap.empty) {
        openEnrollmentPage(classId, classData);
        return;
    }
    const enrollment = enrollSnap.docs[0].data();

    if (enrollment.status === "pending") {
        showToast("Enrollment pending approval");
        openEnrollmentPage(classId, classData);
        return;
    }

    if (enrollment.status === "approved") {
        openClassroomHome(classId, classData);
    }
}

function saveRecentSearch(keyword) {
    let searches = JSON.parse(localStorage.getItem("recentSearches")) || [];
    searches = searches.filter(s => s !== keyword);
    searches.unshift(keyword);
    searches = searches.slice(0, 5);
    localStorage.setItem(
        "recentSearches",
        JSON.stringify(searches)
    );
    loadRecentSearches();
}

function loadRecentSearches() {
    const container = document.getElementById("recentSearches");
    const searches = JSON.parse(localStorage.getItem("recentSearches")) || [];
    if (!searches.length) {
        container.innerHTML = `
            <p class="empty-small">
                No recent searches
            </p>
        `;
        return;
    }
    container.innerHTML = "";
    searches.forEach(term => {
        const item = document.createElement("div");
        item.className = "recent-item";
        item.innerHTML = `
            <span class="material-icons">
                history
            </span>
            
            <p>${term}</p>
        `;
        item.onclick = () => {
            document.getElementById("searchInput").value = term;
            performSearch(term);
        };
        container.appendChild(item);
    });
}

async function loadTrendingClasses() {
    const container = document.getElementById("trendingClasses");
    const snap = await getDocs(
        query(collection(db, "classes"))
    );
    const classes = snap.docs
        .map(d => ({
            id: d.id,
            ...d.data()
        }))
        .sort((a, b) =>
            (b.searchCount || 0) -
            (a.searchCount || 0)
        )
        .slice(0, 10);
    
    container.innerHTML = "";
    classes.forEach(cls => {
        const card = document.createElement("div");
        card.className = "trend-card";
        const image =
            cls.image ||
            getClassImage(cls.name)
        card.innerHTML = `
            <img src="${image}">
            
            <div class="trend-overlay">
                <h4>${cls.name}</h4>
                <small>
                    ${cls.searchCount || 0} searches
                </small>
            </div>
        `;
        container.appendChild(card);
    });
}

function getClassImage(name = "") {

    const subject = name.toLowerCase();

    if (subject.includes("biology")) {
        return "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=752&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
    }
    if (subject.includes("classification")) {
        return "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=752&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
    }
    if (subject.includes("chemistry")) {
        return "https://images.unsplash.com/photo-1694230155228-cdde50083573?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y2hlbWlzdHJ5fGVufDB8fDB8fHww";
    }
    if (subject.includes("bonding")) {
        return "https://images.unsplash.com/photo-1694230155228-cdde50083573?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y2hlbWlzdHJ5fGVufDB8fDB8fHww";
    }
    if (subject.includes("physics")) {
        return "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGh5c2ljc3xlbnwwfHwwfHx8MA%3D%3D";
    }
    if (subject.includes("mathematics")) { 
        return "https://images.unsplash.com/photo-1676302440263-c6b4cea29567?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fG1hdGhlbWF0aWNzfGVufDB8fDB8fHww";
    }
    if (subject.includes("algebra")) { 
        return "https://images.unsplash.com/photo-1676302440263-c6b4cea29567?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fG1hdGhlbWF0aWNzfGVufDB8fDB8fHww";
    }
    if (subject.includes("economics")) { 
       return "https://plus.unsplash.com/premium_photo-1676673189320-76524a64684a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGVjb25vbWljc3xlbnwwfHwwfHx8MA%3D%3D";
    }
    if (subject.includes("history")) {
       return "https://plus.unsplash.com/premium_photo-1674727219372-4ba6644106bc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjF8fGhpc3Rvcnl8ZW58MHx8MHx8fDA%3D";
    }
    if (subject.includes("commerce")) {
        return "https://plus.unsplash.com/premium_photo-1683141154082-324d296f3c66?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8Y29tbWVyY2V8ZW58MHx8MHx8fDA%3D";
    }
    if (subject.includes("geography")) {
        return "https://images.unsplash.com/photo-1604351888999-9ea0a2851e61?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Z2VvZ3JhcGh5fGVufDB8fDB8fHww";
    };

    return "https://plus.unsplash.com/premium_photo-1682125773446-259ce64f9dd7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8c2Nob29sfGVufDB8fDB8fHww";
}