import { db } from "../../core/firebase.js";
import { storage } from "../../core/firebase.js";
import { getUser, getUserData } from "../../core/auth.js";
import { listenNotifications,
    markAsRead
 } from "../../core/notifications.js";

import { 
    ref,
    uploadBytes,
    getDownloadURL,
    uploadBytesResumable } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js"

import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function loadProfile() {
    const container = document.getElementById("contentArea");

    container.innerHTML = `
        <div class="profile-header">
            <div class="profile-top">
                <h3>My Profile</h3>

                <div class="profile-actions">
                    <span class="material-icons" id="editProfileBtn">edit</span>
                </div>
            </div>
        </div>

        <div class="profile-body">

            <div class="profile-info">
                <img src="default.jpeg" class="avatar" />

                <div class="user-meta">
                    <h4 id="profileName">student</h4>
                    <p id="profileEmail">email</p>
                </div>
            </div>

            <div class="streak-card">
                <div class="streak-left">
                    <span class="material-icons fire">local_fire_department</span>
                    <div>
                        <h3 id="currentStreak">0</h3>
                        <p>Day Streak</p>
                    </div>
                </div>

                <div class="streak-right">
                    <p>Best</p>
                    <h4 id="bestStreak">0 days</h4>
                </div>
            </div>

            <div class="xp-card">
                <div class="xp-top">
                    <h3>Level <span id="userLevel">1</span></h3>
                    <span id="xpText">0 / 100 XP</span>
                </div>

                <div class="xp-bar">
                    <div class="xp-fill" id="xpFill"></div>
                </div>
            </div>

            <div class="card">
                <h3>Notifications</h3>

                <div class="notif-tabs">
                    <button class="notif-tab active" data-tab="all">All</button>
                    <button class="notif-tab" data-tab="tasks">Tasks</button>
                    <button class="notif-tab active" data-tab="classes">Classes</button>
                    <button class="notif-tab active" data-tab="system">System</button>
                </div>

                <div id="notifList"></div>
            </div>

            <div class="profile-actions-row">
                <button class="action-btn" id="openAchievements">
                    <span class="material-icons">emoji_events</span>
                    Achievements
                </button>

                <button class="action-btn" id="openClasses">
                    <span class="material-icons">school</span>
                    Classrooms
                </button>
            </div>

            <div class="card">
                <h4>About</h4>
                <p id="about">
                    I am interested in math and biology.
                    I like to solve complex problems and participate in school Olympiads.
                </p>
            </div>

            <div id="profileDynamic"></div>
        </div>
        
    `;
    loadXP();

    const user = getUser();
    const userData = getUserData();

    document.getElementById("editProfileBtn").onclick = openEditProfile;

    document.getElementById("profileName").textContent =
        userData?.username || "Student";

    document.getElementById("profileEmail").textContent =
        user?.email || "No email";

    document.getElementById("openAchievements").onclick = () => {
        openAchievementsPage();
    };

    document.getElementById("openClasses").onclick = () => {
        openClassroomsPage();
    };

    loadStreak();
    initNotifications();

}

function openEditProfile() {
    const container = document.getElementById("contentArea");
    const userData = getUserData();

    const avatarUrl = userData.avatar
        ? userData.avatar + "?t=" + Date.now()
        : "default.jpeg";

    container.innerHTML = `
        <div class="edit-profile">
        
            <div class="edit-header">
                <span class="material-icons back-btn" id="backProfile">arrow_back</span>
                <h3>Edit Profile</h3>
            </div>
            
            <div class="avatar-section">
                <img id="avatarPreview"
                <img src="${avatarUrl}" class="avatar-large" />
                <input type="file" id="avatarInput" accept="image/*" />
            </div>
            
            <textarea id="aboutInput" placeholder="Write about yourself..."></textarea>
            
            <button class="btn primary" id="saveProfileBtn">
                Save Changes
            </button>
        </div>
    `;

    document.getElementById("backProfile").onclick = loadProfile;
    document.getElementById("aboutInput").value = userData?.about || "";

    handleAvatarPreview();
    handleProfileSave();
}

function handleAvatarPreview() {
    const input = document.getElementById("avatarInput");
    const preview = document.getElementById("avatarPreview");

    input.onchange = () => {
        const file = input.files[0];
        if (!file) return;

        preview.src = URL.createObjectURL(file);
    };
}

async function handleProfileSave() {
    const saveBtn = document.getElementById("saveProfileBtn");

    saveBtn.onclick = async () => {
        const user = getUser();
        const aboutInput = document.getElementById("aboutInput");
        const fileInput = document.getElementById("avatarInput");

        const about = aboutInput.value?.trim() || "";
        const file = fileInput.files[0];

        let avatarUrl = getUserData()?.avatar || "";

        saveBtn.textContent = "Saving....";
        saveBtn.disabled = true;

        try {
            if (file) {
                const storageRef = ref(
                    storage,
                    `avatars/${user.uid}_${Date.now()}` 
                );

                await uploadBytes(storageRef, file);
                avatarUrl = await getDownloadURL(storageRef);
            }

            const updateData = {};

            if (about !== undefined) updateData.about = about;
            if (avatarUrl !== undefined) updateData.avatar = avatarUrl;

            await updateDoc(doc(db, "users", user.uid), updateData);
            alert("Profile updated");
            loadProfile();

        } catch (err) {
            console.error(err);;
            alert("Error updating profile");
        }

        saveBtn.textContent = "Save Changes";
        saveBtn.disabled = false;
    };
}

async function openAchievementsPage() {
    const container = document.getElementById("profileDynamic");

    container.innerHTML = `
        <div class="card">
            <h4>All Achievements</h4>
            <div id="badges"></div>
        </div>
    `;

    getStreakData();
    loadStreak();
    renderBadges();
}

async function openClassroomsPage() {
    const container = document.getElementById("profileDynamic");
    const user = getUser();

    container.innerHTML = `<div class="card"><h4>My Classes</h4><div id="myClasses"></div></div>`;

    const list = document.getElementById("myClasses");

    const q = query(
        collection(db, "enrollments"),
        where("studentId", "==", user.uid),
        where("status", "==", "approved")
    );

    const snap = await getDocs(q);

    if (snap.empty) {
        list.innerHTML = `<p>No classes enrolled</p>`;
        return;
    }

    for (const docSnap of snap.docs) {
        const data = docSnap.data();

        const classSnap = await getDoc(doc(db, "classes", data.classId));

        if (!classSnap.exists()) continue;

        const cls = classSnap.data();

        const card = document.createElement("div");
        card.className = "class-card";

        card.innerHTML = `
            <div class="class-name">${cls.name}</div>
            <div class="class-desc">${cls.description || ""}</div>
        `;

        list.appendChild(card);
    }
}

async function renderBadges() {
    const container = document.getElementById("badges");

    const user = getUser();

    const q = query(
        collection(db, "tasks"),
        where("studentId", "==", user.uid),
        where("completed", "==", true)
    );

    const snap = await getDocs(q);
    const tasks = snap.docs.map(d => d.data());

    const total = tasks.length;
    const highPriority = tasks.filter(t => t.priority === "high").length;

    const uniqueDays = new Set(
        tasks.map(t => 
            t.completedAt ? t.completedAt.toDate().toDateString() : null
        )
    );

    const streakData = await getStreakData();


    const allBadges = [
        { title: "First Win", icon: "emoji_events", target: 1, value: total },
        { title: "5 Tasks", icon: "local_fire_department", target: 5, value: total },
        { title: "10 Tasks", icon: "bolt", target: 10, value: total },

        { title: "3 Day Streak", icon: "local_fire_department", target: 3, value: streakData.current },
        { title: "7 Day Streak", icon: "whatshot", target: 7, value: streakData.current },
        { title: "14 Day Streak", icon: "workspace_premium", target: 14, value: streakData.current },

        { title: "Consistency King", icon: "military_tech", target: 30, value: streakData.best }

    ];

    container.innerHTML = `<div class="badge-grid"></div>`;
    const grid = container.querySelector(".badge-grid");

    allBadges.forEach(b => {
        const unlocked = b.value >= b.target;
        const progress = Math.min((b.value / b.target) * 100, 100);

        const el = document.createElement("div");
        const isStreak = b.title.toLowerCase().includes("streak");

        el.className = `
            badge-card
            ${unlocked ? "unlocked" : "locked"}
            ${isStreak ? "streak" : ""}
        `;

        el.innerHTML = `
            <span class="material-icons">${b.icon}</span>
            <h5>${b.title}</h5>
            
            <div class="progress-bar">
                <div class="progress-fill" style="width:${progress}%"></div>
            </div>
            
            <small>${b.value}/${b.target}</small>
        `;

        grid.appendChild(el);
    });
}

export async function getStreakData() {
    const user = getUser();

     const q = query(
        collection(db, "tasks"),
        where("studentId", "==", user.uid),
        where("completed", "==", true)
    );

    const snap = await getDocs(q);

    const dates = snap.docs
        .map(d => d.data().completedAt)
        .filter(Boolean)
        .map(ts => ts.toDate().toDateString());

    const uniqueDays = [...new Set(dates)]
        .map(d => new Date(d))
        .sort((a, b) => b - a);
    
    let streak = 0;
    let best = 0;
    let prevDate = null;

    uniqueDays.forEach(date => {
        if (!prevDate) {
            streak = 1;
            best = 1;
        } else {
            const diff = (prevDate - date) / (1000 * 60 * 60 * 24);

            if (diff === 1) {
                streak++;
                best = Math.max(best, streak);
            } else if (diff > 1) {
                streak = 1;
            }
        }

        prevDate = date;
    });

    const today = new Date().toDateString();
    if (!dates.includes(today)) {
        streak = 0;
    }

    return { current: streak, best };

      
}

async function loadStreak() {
    const data = await getStreakData();

    document.getElementById("currentStreak").textContent = data.current;
    document.getElementById("bestStreak").textContent = `${data.best} days`;

    updateStreakMessage(data.current);
    
}

function updateStreakMessage(streak) {
    let msg = "Start your streak today";

    if (streak >= 1) msg = "You're on track";
    if (streak >= 3) msg = "Nice consistency";
    if (streak >= 7) msg = "Strong momentum";
    if (streak >= 14) msg = "Unstoppable";

    const el = document.getElementById("streakMessage");

    if (el) el.textContent = msg;
}

async function getXPData() {
    const user = getUser();

    const q = query(
        collection(db, "tasks"),
        where("studentId", "==", user.uid),
        where("completed", "==", true)
    );

    const snap = await getDocs(q);

    let xp = 0;

    snap.forEach(doc => {
        const t = doc.data();

        if (t.priority === "high") xp += 20;
        else if (t.priority === "medium") xp += 10;
        else xp += 5;
    });

    let level = 1;
    let xpNeeded = 100;

    while (xp >= xpNeeded) {
        xp -= xpNeeded;
        level++;
        xpNeeded = level * 100;
    }

    return {
        level,
        currentXP: xp,
        nextLevelXP: xpNeeded
    };
}

async function loadXP() {
    const levelEl = document.getElementById("userLevel");
    const xpTextEl = document.getElementById("xpText");
    const xpFillEl = document.getElementById("xpFill");

    if (!levelEl || !xpTextEl || !xpFillEl) {
        console.warn("XP UI not found yet.");
        return;
    }

    const data = await getXPData();

    levelEl.textContent = data.level;
    xpTextEl.textContent = `${data.currentXP} / ${data.nextLevelXP} XP`;

    const percent = (data.currentXP / data.nextLevelXP) * 100;

    xpFillEl.style.width = percent + "%";
}

function initNotifications() {
    let allNotifications = [];

    const list = document.getElementById("notifList");

    listenNotifications((data) => {
        allNotifications = data.sort((a, b) =>
            b.createdAt?.seconds - a.createdAt?.seconds
        );

        renderNotifications(allNotifications);
    });

    document.querySelectorAll(".notif-tab").forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll(".notif-tab")
                .forEach(t => t.classList.remove("active"));

            tab.classList.add("active");

            const type = tab.dataset.tab;

            if (type === "all") {
                renderNotifications(allNotifications);
            } else {
                const filtered = allNotifications.filter(n =>
                    n.category === type          
                );
                renderNotifications(filtered);
            }
        };
    });
}

function renderNotifications(notifications) {
    const list = document.getElementById("notifList");

    if (!notifications.length) {
        list.innerHTML = `
            <div class="empty-state">
                <span class="material-icons">notifications_off</span>
                <p>No notifications yet</p>
            </div>
        `;
        return;
    }

    list.innerHTML = "";

    notifications.forEach(n => {
        const item = document.createElement("div");

        item.className = `
            notif-item
            ${!n.read ? "unread" : ""}
        `;

        item.innerHTML = `
            <span class="material-icons">
                ${getNotifIcon(n.category)}
            </span>
            
            <div class="notif-content">
                <p>${n.message}</p>
                <small>${formatTime(n.createdAt)}</small>
            </div>
        `;

        item.onclick = async () => {
            await markAsRead(n.id);

            handleNotificationNavigation(n);
        };

        list.appendChild(item);
    });
}

function getNotifIcon(type) {
  if (type === "tasks") return "task";
  if (type === "classes") return "school";
  if (type === "system") return "settings";
  return "notifications";
}

function formatTime(ts) {
  if (!ts) return "";

  const date = ts.toDate();
  return date.toLocaleString();
}

async function handleNotificationNavigation(n) {
  if (n.assignmentId) {
    openAssignmentFromDashboard(n.classId, n.assignmentId);
  }

  if (n.taskId) {
    loadTasksPage();
  }
}