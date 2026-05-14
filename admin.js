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
import { loadSubscription } from "./student/pages/subscription.js";
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

        <div class="card earnings-card">

            <div class="row space">
                <h4>Record Teacher Earnings</h4>
                <span class="material-icons">payments</span>
            </div>
            
            <select id="earningTeacher">
                <option value="">Select Teacher</option>
            </select>

            <select id="earningPlan">
                <option value="2 Weeks">2 Weeks Plan</option>
                <option value="1 Month">1 Month Plan</option>
            </select>

            <input
                type="number"
                id="earningAmount"
                placeholder="Amount"
            />

            <input
                type="text"
                id="earningStudent"
                placeholder="Student Name"
            />

            <button
                class="btn primary"
                id="recordEarningBtn"
            >
                Record
            </button>
        </div>
    `;

    document.getElementById("recordEarningBtn").onclick = recordTeacherEarning;


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

        if (!list) return;
        list.innerHTML = "";

        snapshot.forEach(doc => {
            const n = doc.data();

            const item = document.createElement("div");
            item.className = "activity-item";
            item.textContent = n.message;

            list.appendChild(item);
        });
    });

    loadTeachersForEarnings();
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

async function renderWithdrawRequests() {
    const container = document.getElementById("adminWithdrawList");

    const q = query(
        collection(db, "withdrawRequests"),
        where("status", "==", "pending")
    );

    const snap = await getDocs(q)
    
    container.innerHTML = "";

    snap.forEach(docSnap => {
            const d = docSnap.data();

            const card = document.createElement("div");

            card.className = "withdraw-card";

            card.innerHTML = `
                <h3>${d.teacherName}</h3>
                <p>Amount: TZS ${d.amount.toLocaleString()}</p>
                <p>Fee: TZS ${d.fee.toLocaleString()}</p>
                <p>Receive: TZS ${d.receiveAmount.toLocaleString()}</p>
                <p>Account: ${d.receiverNumber}</p>
                
                <div class="actions">
                    <button class="approve">Approve</button>
                    <button class="reject">Reject</button>
                </div>
            `;

            card.querySelector(".approve").onclick = () => 
                approveWithdraw(docSnap.id, d);

            card.querySelector(".reject").onclick = () => 
                rejectWithdraw(docSnap.id, d);

            container.appendChild(card);
        });
    }

async function approveWithdraw(requestId) {
    try {

        const requestRef = doc(
            db, 
            "withdrawRequests",
            requestId
            );

        const requestSnap = await getDoc(requestRef);

        if (!requestSnap.exists()) {
            return showToast(
                "Withdraw request not found",
                "error"
            );
        }

        const request = requestSnap.data();

        if (request.status === "paid") {
            return showToast(
                "Request already approved",
                "warning"
            );
        }

        if (request.status === "rejected") {
            return showToast(
                "Rejected requests cannot be approved",
                "error"
            );
        }

        await updateDoc(requestRef, {
            status: "paid",
            paidAt: serverTimestamp(),
        });

        showToast("withdrawal approved successfully");

    } catch (err) {
        console.error(err);
        showToast("Something went wrong while approving withdrawal", "error");
    }
    markAsPaid();
}

async function rejectWithdraw(id) {
    await updateDoc(doc(db, "withdrawRequests", id), {
        status: "rejected",
        processedAt: serverTimestamp()
    });
    showToast("withdrawal declined", "error");
}

async function markAsPaid(id) {
    await updateDoc(doc(db, "withdrawRequests", id), {
        status: "paid",
        processedAt: serverTimestamp()
    });
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
    
    showToast("Subscription Approved");

    loadPendingSubscriptions();
}

async function rejectSubscription(id) {
    await updateDoc(doc(db, "subscriptions", id), {
        status: "rejected"
    });

    showToast(
        "Subscription Rejected",
        "error"
    );

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

async function loadTeachersForEarnings() {
    const select = document.getElementById("earningTeacher");
    const snap = await getDocs(query(
        collection(db, "users"),
        where("role", "==", "teacher")
    )
);

snap.forEach(docSnap => {
    const teacher = docSnap.data();
    const option = document.createElement("option");

    option.value = docSnap.id;

    option.textContent = teacher.username || teacher.email;

    select.appendChild(option);
});
}

async function recordTeacherEarning() {
    const teacherId = document.getElementById("earningTeacher").value;

    const teacherName = document.getElementById("earningTeacher")
        .selectedOptions[0]
        .textContent;

    const amount =
        Number(
            document.getElementById("earningAmount").value
        );

    const studentName = document.getElementById("earningStudent").value;

    const plan = document.getElementById("earningPlan").value;

    if (!teacherId || !amount) {
        return showToast(
            "Complete all fields",
            "warning"
        );
    }

    await addDoc(
        collection(db, "teacherEarnings"),
        {
            teacherId,
            teacherName,
            studentName,
            subscriptionPlan: plan,
            amount,
            recordedAt: serverTimestamp()
        }
    );

    showToast("earning recorded");

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

loadPage("dashboard");