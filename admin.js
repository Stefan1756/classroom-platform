import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { 
    getFirestore,
    onSnapshot,
    collection,
    query,
    where,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    serverTimestamp,
    Timestamp,
    doc} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { loadUsers, initUserControls } from "./admin-users.js";
import { getUser } from "./core/auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDq_02L2kHPr5jgjblWk_Vrs_JcRrjSBdA",
  authDomain: "myapp-dd546.firebaseapp.com",
  projectId: "myapp-dd546",
  storageBucket: "myapp-dd546.firebasestorage.app",
  messagingSenderId: "383342847380",
  appId: "1:383342847380:web:d3d9ded6ec57d87f395b81",
  measurementId: "G-DVX1Q0ZZMM"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const navItems = document.querySelectorAll(".nav-item");
const contentArea = document.getElementById("contentArea");

function loadPage(page) {
    contentArea.innerHTML = "";

    if (page === "dashboard") {
        loadDashboard();
    }

    if (page === "users") {
        contentArea.innerHTML = `
            <h3>User Management</h3>

            <div class="search-box">
                <span class="material-icons">search</span>
                <input type="text" id="searchInput" placeholder="Search users..." />
            </div>

            <div class="filters">
                <button class="filter-btn active" data-filter="all">All</button>
                <button class="filter-btn" data-filter="student">Students</button>
                <button class="filter-btn" data-filter="teacher">Teachers</button>
                <button class="filter-btn" data-filter="pending">Pending</button>
            </div>

            <div id="usersList" class="users-list"></div>
        `;

        loadUsers();
        initUserControls();
    }

    if (page === "subscriptions") {
        loadSubscriptionsPage();
    }

    if (page === "payments") {
        loadWithdrawPage();
    }
}

navItems.forEach(item => {
    item.addEventListener("click", () => {
        navItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");

        const page = item.getAttribute("data-page");
        loadPage(page);
    });
});

async function loadDashboard() {

    contentArea.innerHTML = `
    
        <div class="admin-dashboard">

            <div class="admin-header">

                <div>
                    <h2>TuityHub Admin</h2>
                    <p>Monitor your learning platform</p>
                </div>

                <div class="admin-header-actions">

                    <div class="admin-notification" id="openNotifications">
                        <span class="material-icons">notifications</span>
                        <span class="notif-badge" id="notifCount">0</span>
                    </div>

                    <div class="admin-avatar">
                        <img src="logo.png" />
                    </div>

                </div>
            </div>

            <div class="analytics-grid">

                <div class="analytics-card">
                    <div class="analytics-icon blue">
                        <span class="material-icons">groups</span>
                    </div>

                    <div>
                        <h3 id="totalUsers">0</h3>
                        <p>Total Users</p>
                    </div>
                </div>

                <div class="analytics-card">
                    <div class="analytics-icon purple">
                        <span class="material-icons">school</span>
                    </div>

                    <div>
                        <h3 id="totalTeachers">0</h3>
                        <p>Active Teachers</p>
                    </div>
                </div>

                <div class="analytics-card">
                    <div class="analytics-icon orange">
                        <span class="material-icons">hourglass_top</span>
                    </div>

                    <div>
                        <h3 id="pendingTeachers">0</h3>
                        <p>Pending Approval</p>
                    </div>
                </div>

                <div class="analytics-card">
                    <div class="analytics-icon green">
                        <span class="material-icons">payments</span>
                    </div>

                    <div>
                        <h3 id="activeSubscriptions">0</h3>
                        <p>Teacher Subscriptions</p>
                    </div>
                </div>

            </div>

            <div class="dashboard-section">

                <div class="dashboard-card revenue-card">

                    <div class="card-top">
                        <h3>Platform Revenue</h3>
                        <span class="material-icons">trending_up</span>
                    </div>

                    <h1 id="platformRevenue">TZS 0</h1>

                    <p>
                        Revenue from teacher subscriptions
                    </p>

                </div>

                <div class="dashboard-card quick-actions">

                    <div class="card-top">
                        <h3>Quick Actions</h3>
                    </div>

                    <div class="quick-grid">

                        <button class="quick-btn" id="openTeachers">
                            <span class="material-icons">school</span>
                            Teachers
                        </button>

                        <button class="quick-btn" id="openSubscriptionsBtn">
                            <span class="material-icons">workspace_premium</span>
                            Subscriptions
                        </button>

                        <button class="quick-btn" id="openPaymentsBtn">
                            <span class="material-icons">payments</span>
                            Withdraws
                        </button>

                        <button class="quick-btn" id="openUsersBtn">
                            <span class="material-icons">groups</span>
                            Users
                        </button>

                    </div>

                </div>

            </div>
            

            <div class="dashboard-card recent-activity">

                <div class="card-top">
                    <h3>Recent Activity</h3>
                    <span class="material-icons">history</span>
                </div>

                <div id="activityList"></div>

            </div>

        </div>
    `;

    loadDashboardStats();
    loadRecentActivities();

    document.getElementById("openNotifications").onclick = () => {
        loadNotificationPage();
    };

    document.getElementById("openUsersBtn").onclick = () => {
        document.querySelector('[data-page="users"]').click();
    };

    document.getElementById("openSubscriptionsBtn").onclick = () => {
        document.querySelector('[data-page="subscriptions"]').click();
    };

    document.getElementById("openPaymentsBtn").onclick = () => {
        document.querySelector('[data-page="payments"]').click();
    };
}

function loadDashboardStats() {

    onSnapshot(collection(db, "users"), async (snapshot) => {

        let totalUsers = 0;
        let teachers = 0;
        let pending = 0;

        snapshot.forEach(docSnap => {

            const user = docSnap.data();

            totalUsers++;

            if (
                user.role === "teacher" &&
                user.status === "active"
            ) {
                teachers++;
            }

            if (
                user.role === "teacher" &&
                user.status === "pending"
            ) {
                pending++;
            }
        });

        document.getElementById("totalUsers").textContent = totalUsers;

        document.getElementById("totalTeachers").textContent = teachers;

        document.getElementById("pendingTeachers").textContent = pending;
    });

    onSnapshot(collection(db, "subscriptions"), (snapshot) => {

        let activeSubscriptions = 0;
        let revenue = 0;

        snapshot.forEach(docSnap => {

            const sub = docSnap.data();

            if (sub.status === "approved") {

                activeSubscriptions++;

                revenue += Number(sub.amount || 0);
            }
        });

        document.getElementById("activeSubscriptions")
            .textContent = activeSubscriptions;

        document.getElementById("platformRevenue")
            .textContent =
            `TZS ${revenue.toLocaleString()}`;
    });

    onSnapshot(collection(db, "notifications"), (snapshot) => {

        document.getElementById("notifCount")
            .textContent = snapshot.size;
    });
}

function loadRecentActivities() {

    const list = document.getElementById("activityList");

    onSnapshot(collection(db, "notifications"), (snapshot) => {

        list.innerHTML = "";

        if (snapshot.empty) {
            list.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">notifications_off</span>
                    <h4>No new activity</h4>
                    <p>System activity will appear here in real time</p>
                </div>
            `;
            return;
        }

        // convert + sort by latest first
        const activities = [];

        snapshot.forEach(docSnap => {
            activities.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        activities.sort((a, b) => {
            return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });

        // keep only latest 5
        const latest = activities.slice(0, 5);

        // header with clear all
        const header = document.createElement("div");
        header.className = "activity-header";

        header.innerHTML = `
            <h3>Recent Activity</h3>
            <button id="clearActivityBtn" class="clear-btn">
                Clear All
            </button>
        `;

        list.appendChild(header);

        // render items
        latest.forEach(data => {

            const item = document.createElement("div");
            item.className = "activity-card";

            item.innerHTML = `
                <div class="activity-icon">
                    <span class="material-icons">notifications</span>
                </div>

                <div>
                    <h4>${data.message}</h4>
                    <small>
                        ${
                            data.createdAt?.toDate
                            ? data.createdAt.toDate().toLocaleString()
                            : "Just now"
                        }
                    </small>
                </div>
            `;

            list.appendChild(item);
        });

        // clear all handler
        document.getElementById("clearActivityBtn").onclick = async () => {

            if (!confirm("Clear all activity logs?")) return;

            const allDocs = await getDocs(collection(db, "notifications"));

            const deletes = allDocs.docs.map(d =>
                deleteDoc(doc(db, "notifications", d.id))
            );

            await Promise.all(deletes);
        };
    });
}

function loadNotificationPage() {

    const content = document.getElementById("contentArea");

    content.innerHTML = `
        <div class="notif-page">

            <div class="notif-page-header">
                <span class="material-icons back-btn" id="backToDashboard">
                    arrow_back
                </span>

                <h2>Notifications</h2>
            </div>

            <div class="notif-filters">
                <button class="notif-filter active" data-type="all">All</button>
                <button class="notif-filter" data-type="payment">Payments</button>
                <button class="notif-filter" data-type="teacher">Teachers</button>
                <button class="notif-filter" data-type="system">System</button>
                <button class="notif-filter" data-type="warning">Warnings</button>
            </div>

            <div id="notifList" class="notif-list"></div>

        </div>
    `;

    document.getElementById("backToDashboard").onclick = () => {
        loadPage("dashboard");
    };

    initNotificationEngine();
}

let allNotifications = [];
let activeFilter = "all";

function initNotificationEngine() {

    const list = document.getElementById("notifList");

    onSnapshot(collection(db, "notifications"), (snapshot) => {

        allNotifications = [];

        snapshot.forEach(docSnap => {
            allNotifications.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        updateBadge(allNotifications);
        renderNotifications();
        setupFilters();
    });

    function renderNotifications() {

        list.innerHTML = "";

        let filtered = allNotifications;

        if (activeFilter !== "all") {
            filtered = filtered.filter(n => n.type === activeFilter);
        }

        if (filtered.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">notifications_off</span>
                    <h4>No notifications</h4>
                    <p>System events will appear here</p>
                </div>
            `;
            return;
        }

        filtered.sort((a, b) =>
            (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        );

        filtered.forEach(n => {

            const card = document.createElement("div");
            card.className = `notif-card ${n.type}`;

            card.innerHTML = `
                <div class="notif-icon">
                    <span class="material-icons">
                        ${
                            n.type === "payment" ? "payments" :
                            n.type === "teacher" ? "school" :
                            n.type === "warning" ? "warning" :
                            "notifications"
                        }
                    </span>
                </div>

                <div class="notif-content">
                    <h4>${n.message}</h4>
                    <small>
                        ${
                            n.createdAt?.toDate
                            ? n.createdAt.toDate().toLocaleString()
                            : "Just now"
                        }
                    </small>
                </div>

                <div class="dot ${n.read ? "read" : "unread"}"></div>
            `;

            list.appendChild(card);
        });
    }

    function setupFilters() {

        document.querySelectorAll(".notif-filter").forEach(btn => {

            btn.onclick = () => {

                document.querySelectorAll(".notif-filter")
                    .forEach(b => b.classList.remove("active"));

                btn.classList.add("active");

                activeFilter = btn.dataset.type;

                renderNotifications();
            };
        });
    }
}

function updateBadge(notifications) {

    const badge = document.getElementById("notifCount");

    if (!badge) {
        // UI not ready or not on dashboard page
        return;
    }

    const unread = notifications.filter(n => !n.read).length;

    badge.textContent = unread;

    badge.style.display = unread > 0 ? "flex" : "none";
}

function loadWithdrawPage() {
    contentArea.innerHTML = `
        <h3>Withdraws Verification</h3>
        
        <div class="card">
            <h4>Pending Payouts</h4>
            <div id="adminWithdrawList"></div>
        </div>
    `;

    renderWithdrawRequests();
}

function loadSubscriptionsPage() {

    const content = document.getElementById("contentArea");

    content.innerHTML = `
        <div class="subs-page">

            <div class="subs-header">
                <h2>Teacher Subscriptions</h2>
                <p>Manage trials, payments & access control</p>
            </div>

            <div id="subsList" class="subs-list"></div>

        </div>
    `;

    listenTeacherSubscriptions();
}

function listenTeacherSubscriptions() {

    const list = document.getElementById("subsList");

    onSnapshot(query(collection(db, "users"), where("role", "==", "teacher")), (snapshot) => {

        list.innerHTML = "";

        if (snapshot.empty) {
            list.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">school</span>
                    <h3>No Teachers Found</h3>
                    <p>Teachers will appear here once they register</p>
                </div>
            `;
            return;
        }

        snapshot.forEach(docSnap => {

            const t = docSnap.data();
            const teacherId = docSnap.id;

            const status = getTeacherStatus(t);

            const card = document.createElement("div");
            card.className = "teacher-sub-card";

            card.innerHTML = `
                <div class="teacher-top">

                    <img src="${t.photoURL || 'default.jpeg'}" class="avatar"/>

                    <div>
                        <h3>${t.username || "Teacher"}</h3>
                        <p>${t.username || "No payment name"}</p>
                        <small>${t.number || "No number"}</small>
                    </div>

                    <span class="status ${status.class}">
                        ${status.label}
                    </span>

                </div>

                <div class="teacher-meta">
                    <p><b>Subscription:</b> ${t.subscriptionStatus || "trial"}</p>
                    <p><b>Ends:</b> ${formatDate(t.subscriptionEnd)}</p>
                </div>

                <div class="teacher-actions">

                    ${
                        t.status === "pending"
                        ? `<button class="approve">Approve Payment</button>`
                        : ""
                    }

                    ${
                        t.status === "active"
                        ? `<button class="suspend">Suspend</button>`
                        : ""
                    }

                    ${
                        t.status === "suspended"
                        ? `<button class="reactivate">Reactivate</button>`
                        : ""
                    }

                    <button class="history">View History</button>

                </div>
            `;

            // ACTIONS
            const approveBtn = card.querySelector(".approve");
            const suspendBtn = card.querySelector(".suspend");
            const reactivateBtn = card.querySelector(".reactivate");
            const historyBtn = card.querySelector(".history");

            if (approveBtn) {
                approveBtn.onclick = async () => {
                    await updateDoc(doc(db, "users", teacherId), {

                        status: "active",
                        subscriptionStatus: "active",

                        subscriptionStart: Timestamp.now(),

                        subscriptionEnd: Timestamp.fromDate(
                            new Date(
                                Date.now() + 30 * 24 * 60 * 60 * 1000
                            )
                        )
                    });
                };
            }

            if (suspendBtn) {
                suspendBtn.onclick = async () => {
                    await updateDoc(doc(db, "users", teacherId), {
                        status: "suspended"
                    });
                };
            }

            if (reactivateBtn) {
                reactivateBtn.onclick = async () => {
                    await updateDoc(doc(db, "users", teacherId), {
                        status: "active"
                    });
                };
            }

            if (historyBtn) {
                historyBtn.onclick = () => {
                    loadTeacherSubscriptionHistory(teacherId);
                };
            }

            list.appendChild(card);
        });
    });
}

function getTeacherStatus(t) {

    if (t.status === "suspended") {
        return { label: "Suspended", class: "danger" };
    }

    if (t.subscriptionStatus === "trial") {
        return { label: "Free Trial", class: "warning" };
    }

    if (t.subscriptionStatus === "active") {
        return { label: "Subscribed", class: "success" };
    }

    if (t.subscriptionStatus === "ended") {
        return { label: "Ended", class: "danger" };
    }

    return { label: "Unknown", class: "gray" };
}

async function loadTeacherSubscriptionHistory(teacherId) {

    const content = document.getElementById("contentArea");

    const q = query(
        collection(db, "teacherSubscriptions"),
        where("teacherId", "==", teacherId)
    );

    const snap = await getDocs(q);

    content.innerHTML = `
        <div class="history-page">

            <div class="history-header">
                <span class="material-icons back-btn">arrow_back</span>
                <h2>Subscription History</h2>
            </div>

            <div class="history-list"></div>
        </div>
    `;

    document.querySelector(".back-btn").onclick = () => {
        loadSubscriptionsPage();
    };

    const list = document.querySelector(".history-list");

    snap.forEach(doc => {

        const h = doc.data();

        const item = document.createElement("div");
        item.className = "history-item";

        item.innerHTML = `
            <p><b>Plan:</b> ${h.plan}</p>
            <p><b>Status:</b> ${h.status}</p>
            <p><b>Amount:</b> ${h.amount}</p>
        `;

        list.appendChild(item);
    });
}

function formatDate(timestamp) {

    if (!timestamp) return "Not set";

    // Firestore Timestamp support
    if (timestamp.toDate) {
        const date = timestamp.toDate();
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    // Normal JS date fallback
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "Invalid date";

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}


function showToast(message, type = "success") {
    const old = 
        document.querySelector(".custom-toast");

    if (old) old.remove();

    const toast = 
        document.createElement("div");

    toast.className = 
        `custom-toast ${type}`;

    toast.innerHTML = `
        <span class="material-icons">
            ${
                type === "success"
                ? "check_circle"

                : type === "error"
                ? "error"

                : "info"
            }
        </span>
        
        <p>${message}</p>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("show");
    }, 50);

    setTimeout(() => {
        toast.classList.remove("show");

        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000)
}

async function activateTeacherFreeTrials() {

    const teachersSnap = await getDocs(
        query(
            collection(db, "users"),
            where("role", "==", "teacher")
        )
    );

    const now = new Date();

    for (const teacherDoc of teachersSnap.docs) {

        const teacher = teacherDoc.data();

        // skip already subscribed users
        if (
            teacher.subscriptionStatus === "active"
        ) continue;

        const endDate = new Date();

        endDate.setDate(
            endDate.getDate() + 7
        );

        await updateDoc(
            doc(db, "users", teacherDoc.id),
            {
                subscriptionPlan: "Free Access",
                subscriptionPlanId: "free_access",

                subscriptionStatus: "active",

                accountAccess: "active",

                subscriptionStart:
                    Timestamp.fromDate(now),

                subscriptionEnd:
                    Timestamp.fromDate(endDate),

                hasActiveSubscription: true
            }
        );
    }

    showToast("Free access activated");
}
loadPage("dashboard");