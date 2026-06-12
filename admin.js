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
        loadPaymentsPage();
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

                <div id="installBtn" class="analytics-card">
                    <div id="installBtn" class="analytics-icon orange">
                        <span class="material-icons">download</span>
                    </div>

                    <div>
                        <button id="installBtn" class="install-btn">
                            <span class="material-icons">
                                download
                            </span>
                            Install
                        </button>
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

function loadPaymentsPage() {
    const content = document.getElementById("contentArea");

    content.innerHTML = `
        <div class="payments-page">
            <div class="payments-header">
                <h2>Payments Center</h2>
                <p>Approve teacher subscriptions and manage transactions</p>
            </div>

            <div class="payments-stats">
                <div class="stat">
                    <h3 id="pendingCount">0</h3>
                    <p>Pending</p>
                </div>

                <div class="stat">
                    <h3 id="approvedCount">0</h3>
                    <p>Approved</p>
                </div>

                <div class="stat">
                    <h3 id="rejectedCount">0</h3>
                    <p>Rejected</p>
                </div>
            </div>

            <div class="payments-tabs">
                <button class="tab active" data-tab="pending">
                    Pending
                </button>

                <button class="tab active" data-tab="approved">
                    Approved
                </button>

                <button class="tab active" data-tab="rejected">
                    Rejected
                </button>
            </div>

            <div id="paymentsList" class="payments-list"></div>
        </div>
    `;
    setupPaymentTabs();
    loadPaymentsRequests("pending");
}

function setupPaymentTabs() {
    document.querySelectorAll(".tab").forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            loadPaymentsRequests(tab.dataset.tab);
        };
    });
}

async function loadPaymentsRequests(status) {
    const container = document.getElementById("paymentsList");

    const q = query(
        collection(db, "teacherSubscriptions"),
        where("status", "==", status)
    );

    onSnapshot(q, async (snapshot) => {
        container.innerHTML = "";

        updatePaymentStats();

        if (snapshot.empty) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">
                        swap_horiz
                    </span>
                    <p>No ${status} payments</p>
                </div>
            `;
            return;
        }

        snapshot.forEach(docSnap => {
            const p = docSnap.data();
            const card = document.createElement("div");
            card.className = "payment-card";
            card.innerHTML = `
                <div class="payment-top">
                    <div>
                        <h3>${p.paymentName}</h3>
                        <p>${p.plan}</p>
                        <small>Ref: ${p.paymentReference || "N/A"}</small>
                    </div>
                    
                    <div class="amount">TZS ${p.amount}</div>
                </div>
                
                <div class="payment-meta">
                    <p>Phone: ${p.paymentNumber || "N/A"}</p>
                    <p>Account Name: ${p.paymentName || "N/A"}</p>
                    <p>
                        Date: ${
                            p.createdAt
                            ? new Date(
                                p.createdAt.seconds * 1000
                            ).toLocaleDateString()
                            : "-"
                        }
                    </p>
                </div>
                
                <div class="payment-actions">
                    ${
                        status === "pending"
                        ? `
                            <button class="approve-btn">
                                Approve
                            </button>
                            
                            <button class="reject-btn">
                                Reject
                            </button>
                        `
                        : `
                            <span class="status-tag ${status}">
                                ${status}
                            </span>
                        `
                    }
                </div>
            `;

            if (status === "pending") {
                card.querySelector(".approve-btn")
                .onclick = () => 
                    approvePayment(docSnap.id, p);

                card.querySelector(".reject-btn")
                .onclick = () => 
                    rejectPayment(docSnap.id, p);
            }

            container.appendChild(card);
        });
    });
}

function loadSubscriptionsPage() {

    const content = document.getElementById("contentArea");

    content.innerHTML = `
        <div class="subs-page">

            <div class="subs-header">
                <h2>Teacher Subscriptions</h2>
                <p>Manage teacher access and subscription status</p>
            </div>

            <div id="subsStats" class="subs-stats">
                <div class="stat-card">
                    <h3 id="activeTeachers">0</h3>
                    <p>Active</p>
                </div>

                <div class="stat-card">
                    <h3 id="trialTeachers">0</h3>
                    <p>Free Trial</p>
                </div>

                <div class="stat-card">
                    <h3 id="expiredTeachers">0</h3>
                    <p>Expired</p>
                </div>
            </div>

            <div id="subsList" class="subs-list"></div>

        </div>
    `;

    listenTeacherSubscriptions();
}

function listenTeacherSubscriptions() {

    const container = document.getElementById("subsList");

    onSnapshot(query(collection(db, "users"), where("role", "==", "teacher")),
    snapshot => {

        container.innerHTML = "";

        let active = 0;
        let pending = 0;
        let expired = 0;

        snapshot.forEach(docSnap => {

            const teacher = docSnap.data();
            const id = docSnap.id;

            const now = new Date();
            const end = teacher.subscriptionEnd?.toDate?.();

            const isActive =
                teacher.accountAccess !== "restricted" &&
                end &&
                now < end;

            if (teacher.subscriptionStatus === "pending") pending++;
            else if (isActive) active++;
            else expired++;

            const card = document.createElement("div");
            card.className = "teacher-sub-card";

            card.innerHTML = `
                <div class="teacher-sub-top">

                    <div class="teacher-profile">
                        <img src="${teacher.photoURL || 'default.jpeg'}" class="teacher-avatar">
                        <div>
                            <h3>${teacher.username || "Teacher"}</h3>
                            <p>${teacher.email || ""}</p>
                        </div>
                    </div>

                    <span class="subs-status ${isActive ? "active" : "expired"}">
                        ${isActive ? "active" : "expired"}
                    </span>

                </div>

                <div class="teacher-sub-details">
                    <div>
                        <small>Plan</small>
                        <strong>${teacher.subscriptionPlan || "None"}</strong>
                    </div>

                    <div>
                        <small>Access</small>
                        <strong>${teacher.accountAccess || "restricted"}</strong>
                    </div>
                </div>

                <div class="teacher-sub-actions">

                    <button class="toggle-btn">
                        ${teacher.status === "suspended" ? "Activate" : "Suspend"}
                    </button>

                    <button class="history-btn">View History</button>

                </div>
            `;

            card.querySelector(".toggle-btn").onclick =
                () => toggleTeacherStatus(id, teacher);

            card.querySelector(".history-btn").onclick =
                () => openTeacherHistory(id, teacher);

            container.appendChild(card);
        });

        document.getElementById("activeTeachers").textContent = active;
        document.getElementById("pendingTeachers").textContent = pending;
        document.getElementById("expiredTeachers").textContent = expired;
    });
}

async function toggleTeacherStatus(teacherId, teacher) {

    const suspended = teacher.status === "suspended";

    await updateDoc(doc(db, "users", teacherId), {
        status: suspended ? "active" : "suspended",
        accountAccess: suspended ? "active" : "restricted"
    });

    showToast(suspended ? "Teacher activated" : "Teacher suspended");
}

async function openTeacherHistory(teacherId, teacher) {

    const content = document.getElementById("contentArea");

    content.innerHTML = `
        <div class="history-page">

            <div class="page-header">
                <button id="backBtn">
                    <span class="material-icons back-btn">
                        arrow_back_ios
                    </span>
                </button>
                <h2>
                    ${teacher.username}
                </h2>
            </div>

            <div 
                id="historyList"
                class="history-list">
            </div>
        </div>
    `;

    document.getElementById("backBtn").onclick = () => {
        loadSubscriptionsPage();
    };

    loadTeacherHistory(
        teacherId
    );
}

async function loadTeacherHistory(teacherId){
    const container = document.getElementById("historyList");

    onSnapshot(
        query(
            collection(
                db, 
                "teacherSubscriptions"
            ),
            where(
                "teacher",
                "==",
                teacherId
            )
        ),
        snapshot => {
            container.innerHTML = "";

            if (snapshot.empty) {
                container.innerHTML = `
                    <div class="empty-state">
                        <span class="material-icons">
                            history
                        </span>
                        <p>
                            No subscription history
                        </p>
                    </div>
                `;
                return;
            }
            snapshot.forEach(docSnap => {
                const sub = docSnap.data();

                container.innerHTML += `
                    <div class="history-card">
                        <h3>
                            ${sub.planName}
                        </h3>
                        
                        <p>
                            ${sub.amount || 0} TZS
                        </p>
                        
                        <span class="
                            history-status
                            ${sub.status}
                        ">
                            ${sub.status}
                        </span>
                    </div>
                `;
            });
        }
    );
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

async function approvePayment(subscriptionId, sub) {

    const now = new Date();

    let durationDays = 30;

    if (sub.planId === "starter") durationDays = 30;
    if (sub.planId === "professional") durationDays = 60;

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + durationDays);

    // 1. update subscription request
    await updateDoc(doc(db, "teacherSubscriptions", subscriptionId), {
        status: "approved",
        approvedAt: serverTimestamp(),
        durationDays
    });

    // 2. update teacher account (SINGLE SOURCE RULE)
    await updateDoc(doc(db, "users", sub.teacherId), {

        subscriptionPlan: sub.planName,
        subscriptionPlanId: sub.planId,

        subscriptionStatus: "active",
        accountAccess: "active",
        status: "active",

        subscriptionStart: Timestamp.fromDate(now),
        subscriptionEnd: Timestamp.fromDate(expiry)
    });

    // 3. ledger
    await addDoc(collection(db, "teacherBillingLedger"), {
        teacherId: sub.teacherId,
        planId: sub.planId,
        planName: sub.planName,
        amount: sub.amount,
        status: "approved",
        createdAt: serverTimestamp(),
        startDate: Timestamp.fromDate(now),
        endDate: Timestamp.fromDate(expiry)
    });

    showToast("Subscription approved successfully");
}

async function rejectPayment(subscriptionId, sub) {

    await updateDoc(doc(db, "teacherSubscriptions", subscriptionId), {
        status: "rejected",
        rejectedAt: serverTimestamp()
    });

    await updateDoc(doc(db, "users", sub.teacherId), {
        subscriptionStatus: "expired",
        accountAccess: "restricted",
        status: "active"
    });

    showToast("Subscription rejected", "error");
}

function updatePaymentStats() {
    onSnapshot(collection(db, "teacherSubscriptions"), snap => {
        let pending = 0;
        let approved = 0;
        let rejected = 0;

        snap.forEach(doc => {
            const s = doc.data().status;

            if (s === "pending") pending++;
            if (s === "approved") approved++;
            if (s === "rejected") rejected++;
        });

        document.getElementById("pendingCount").textContent = pending;
        document.getElementById("approvedCount").textContent = approved;
        document.getElementById("rejectedCount").textContent = rejected;
    });
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
            endDate.getDate() + 30
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