import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { 
    getFirestore,
    onSnapshot,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    serverTimestamp,
    Timestamp,
    doc} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { loadUsers, initUserControls } from "./admin-users.js";
import { loadSubscription } from "./student/pages/subscription.js";

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

const profileBtn = document.getElementById("profileBtn");
const bottomSheet = document.getElementById("bottomSheet");
const logoutBtn = document.getElementById("logoutBtn");

profileBtn.addEventListener("click", () => {
    bottomSheet.classList.toggle("show");
});

window.addEventListener("click", (e) => {
    if (!bottomSheet.contains(e.target) && e.target !== profileBtn) {
        bottomSheet.classList.remove("show");
    }
});

logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "index.html";
});

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

    if (page === "settings") {
        loadSettings();
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

const badge = document.getElementById("notificationBadge");

const q = query(collection(db, "notifications"), where("read", "==", false));

onSnapshot(q, (snapshot) => {
    const count = snapshot.size;
    updateBadge(count);
});

function updateBadge(count) {
    if (count > 0) {
        badge.style.display = "block";
        badge.textContent = count;
    } else {
        badge.style.display = "none";
    }
}

const notificationIcon = document.getElementById("notificationIcon");

notificationIcon.addEventListener("click", () => {

    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
    document.querySelector('[data-page="users"]').classList.add("active");

    loadPage("users");

    setTimeout(() => {
        document.querySelector('[data-filter="pending"]')?.click();
    }, 200);
});

const panel = document.getElementById("notificationPanel");
const list = document.getElementById("notificationList");
const bell = document.getElementById("notificationIcon");

bell.addEventListener("click", () => {
    panel.classList.toggle("show");
});

onSnapshot(collection(db, "notifications"), (snapshot) => {
    list.innerHTML = "";
    snapshot.forEach(docSnap => {
        const n = docSnap.data();

        const item = document.createElement("div");
        item.className = "notification-item";
        item.textContent = n.message;

        item.addEventListener("click", async () => {
            await updateDoc(doc(db, "notifications", docSnap.id), {
                read: true
            });
        });

        list.appendChild(item);
    });
});

function loadDashboard() {
    contentArea.innerHTML = `
        <h3>Admin Dashboard</h3>
        
        <div class="stats">
        
            <div class="card">
                <span class="material-icons">group</span>
                <h4 id="totalUsers">0</h4>
                <p>Total Users</p>
            </div>
            
            <div class="card">
                <span class="material-icons">school</span>
                <h4 id="totalTeachers">0</h4>
                <p>Teachers</p>
            </div>
            
            <div class="card">
                <span class="material-icons">pending</span>
                <h4 id="pendingTeachers">0</h4>
                <p>Pending</p>
            </div>
        </div>

        <div class="card">
            <h4>Broadcast Message</h4>

            <select id="targetRole">
                <option value="all">All Users</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
            </select>

            <textarea id="broadcastMessage" placeholder="Type message..."></textarea>

            <button class="btn primary" id="sendBroadcastBtn">
                Send Message
            </button>
        </div>
    `;

    document.getElementById("sendBroadcastBtn").onclick = sendBroadcast;

    onSnapshot(collection(db, "users"), (snapshot) => {
        let total = 0, teachers = 0, pending= 0;

        snapshot.forEach(doc => {
            const u = doc.data();
            total++;

            if (u.role === "teacher") teachers++;
            if (u.status === "pending") pending++;
        });

        document.getElementById("totalUsers").textContent = total;
        document.getElementById("totalTeachers").textContent = teachers;
        document.getElementById("pendingTeachers").textContent = pending;
    });

    onSnapshot(collection(db, "notifications"), (snapshot) => {
        const list = document.getElementById("activityList");
        list.innerHTML = "";

        snapshot.forEach(doc => {
            const n = doc.data();

            const item = document.createElement("div");
            item.className = "activity-item";
            item.textContent = n.message;

            list.appendChild(item);
        });
    });

    
}

function loadSettings() {
    contentArea.innerHTML = `
        <h3>Settings</h3>
            <div class="settings-list">

                <div class="setting-item" id="adminProfile">
                    <span class="material-icons">person</span>
                    <p>Admin Profile</p>
                </div>
                
                <div class="setting-item">
                    <span class="material-icons">settings</span>
                    <p>System Settings</p>
                </div>

            </div>
        `;
    };

async function sendBroadcast() {
  const message = document.getElementById("broadcastMessage").value;
  const role = document.getElementById("targetRole").value;

  if (!message) return alert("Message required");

  let usersQuery;

  if (role === "all") {
    usersQuery = collection(db, "users");
  } else {
    usersQuery = query(
      collection(db, "users"),
      where("role", "==", role)
    );
  }

  const usersSnap = await getDocs(usersQuery);

  usersSnap.forEach(async (userDoc) => {
    const userId = userDoc.id;

    await addDoc(collection(db, "notifications"), {
      userId,
      type: "broadcast",
      message,
      read: false,
      isBroadcast: true,
      targetRole: role,
      createdAt: serverTimestamp()
    });
  });

  document.getElementById("broadcastMessage").value = "";

  alert("Broadcast sent!");
}

function loadSubscriptionsPage() {
    contentArea.innerHTML = `
        <h3>Subscription Verification</h3>
        
        <div class="card">
            <h4>Pending Payments</h4>
            <div id="subscriptionList"></div>
        </div>
    `;

    loadPendingSubscriptions();
}

async function loadPendingSubscriptions() {
    const container = document.getElementById("subscriptionList");

    const q = query(
        collection(db, "subscriptions"),
        where("status", "==", "pending")
    );

    const snap = await getDocs(q);

    container.innerHTML = "";

    if (snap.empty) {
        container.innerHTML = `<p>No pending requests</p>`;
        return;
    }

    snap.forEach(docSnap => {
        const sub = docSnap.data();

        const card = document.createElement("div");
        card.className = "subscription-card";

        card.innerHTML = `
            <p><strong>User ID:</strong> ${sub.userId}</p>
            <p><strong>Plan:</strong> ${sub.planName}</p>
            <p><strong>Reference:</strong> ${sub.paymentCode || "N/A"}</p>
            
            <div class="actions">
                <button class="btn approve">Approve</button>
                <button class="btn reject">Reject</button>
            </div>
        `;

        const [approveBtn, rejectBtn] = card.querySelectorAll("button");

        approveBtn.onclick = () => approveSubscription(docSnap.id, sub);
        rejectBtn.onclick = () => rejectSubscription(docSnap.id, sub);

        container.appendChild(card);
    });
}

async function approveSubscription(id, sub) {
    const now = new Date();

    let durationDays = 0;
    let classLimit = 0;
    let downloadLimit = 0;

    if (sub.planId === "plan_2weeks") {
        durationDays = 14;
        classLimit = 2;
        downloadLimit = 5;
    } 
    if (sub.planId === "plan_1month") {
        durationDays = 30; 
        classLimit = -1;
        downloadLimit = -1;
    } 

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + durationDays);

    await updateDoc(doc(db, "users", sub.userId), {

            subscriptionPlan: sub.planName,
            subscriptionPlanId: sub.planId,
            classLimit,
            downloadLimit,
            downloadUsed: 0,
            subscriptionStatus: "active",
            subscriptionStart: Timestamp.fromDate(now),
            subscriptionEnd: Timestamp.fromDate(expiry),
            hasActiveSubscription: true
    });

    await updateDoc(doc(db, "subscriptions", id), {
        status: "approved",
        approvedAt: serverTimestamp(),
        startDate: Timestamp.fromDate(now),
        endDate: Timestamp.fromDate(expiry)
    });
    alert("Subscription Approved");

    loadPendingSubscriptions();
}

async function rejectSubscription(id) {
    await updateDoc(doc(db, "subscriptions", id), {
        status: "rejected"
    });

    alert("Subscription Rejected");

    loadPendingSubscriptions();
}

async function activateFreeTrials() {
    
    const usersSnap = await getDocs(collection(db, "users"));

    const now = new Date();

    for (const userDoc of usersSnap.docs) {

        const user = userDoc.data();

        if (user.role !== "student") continue;

        if (user.subscriptionStatus === "active") continue;

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);

        await updateDoc(doc(db, "users", userDoc.id), { 
                subscriptionPlan: "Free Trial",
                subscriptionPlanId: "free_trial",
                subscriptionStatus: "active",
                classLimit: -1,
                downloadLimit: -1,
                downloadUsed: 0,
                subscriptionStart: Timestamp.fromDate(now),
                subscriptionEnd: Timestamp.fromDate(endDate),
                hasActiveSubscription: true
        });
    }

    alert("Free trials activated!");
}

loadPage("dashboard");