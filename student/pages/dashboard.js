import { db } from "../../core/firebase.js";
import { getUser, getUserData } from "../../core/auth.js";
import { navigate } from "../../core/router.js";

import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  updateDoc,
  addDoc,
  getDoc,
  setDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function loadDashboard() {
  const container = document.getElementById("contentArea");

  container.innerHTML = getDashboardSkeleton();

  setTimeout(() => {
    renderDashboard();
  }, 2000);
}

function getDashboardSkeleton() {
  return `
    <div class="dashboard-skeleton">
    
      <div class="sk-header shimmer"></div>
      
      <div class="sk-stats">
          <div class="sk-card shimmer"></div>
          <div class="sk-card shimmer"></div>
          <div class="sk-card shimmer"></div>
      </div>
      
      <div class="sk-block shimmer"></div>
      <div class="sk-block shimmer"></div>
      <div class="sk-block shimmer"></div>
      
    </div>
  `;
}

function renderDashboard() {
  const container = document.getElementById("contentArea");

  container.innerHTML =`
    <div class="dashboard-modern">
      <div class="dash-header">
        <div>
          <h2 id="greetUser">Hello...</h2>
          <p class="sub">Let's make today productive</p>
        </div>

        <div class="avatar-circle" id="dashAvatar">
          <span class="material-icons">person</span>
        </div>
    </div>

    <div class="dash-card highlight">
        <div class="row space">
            <h4>Today</h4>
            <span id="todayDate"></span>
        </div>

        <div class="today-stats">
            <div>
                <h3 id="todayTasks">0</h3>
                <p>Tasks</p>
            </div>
            <div>
                <h3 id="todayClasses">0</h3>
                <p>Classes</p>
            </div>
        </div>
    </div>

    <div class="dash-grid">
        <div id="nextTaskCard"></div>
        <div id="dailyMissionCard"></div>
    </div>


    <div class="quick-actions">
        <button id="goTasks">
            <span class="material-icons">task</span>
        </button>

        <button id="goClasses">
            <span class="material-icons">school</span>
        </button>

        <button id="goProfile">
            <span class="material-icons">person</span>
        </button>
    </div>

    <div class="section">
        <div class="row space">
            <h4>My Classes</h4>
        </div>

        <div class="class-scroll" id="dashClasses"></div>
    </div>

    <div class="section">
        <div class="row space">
            <h4>Upcoming Tasks</h4>
        </div>

        <div id="dashTasks"></div>
    </div>

  </div>
`;

loadDashboardData();
}

async function loadDashboardData() {
  const userData = getUserData();

  document.getElementById("greetUser").textContent =
      `Hello ${userData?.username || "Student"}`;

  document.getElementById("todayDate").textContent =
      new Date().toDateString();

  loadTodayStats();
  loadDashboardClasses();
  loadDashboardTasks();
  initDashboardActions();
  loadNextTaskCountdown();
  loadDailyMission();
}

async function loadTodayStats() {
  const today = new Date().toISOString().split("T")[0];

  const taskSnap = await getDocs(query(
    collection(db, "tasks"),
    where("studentId", "==", getUser().uid),
    where("date", "==", today)
  ));

  document.getElementById("todayTasks").textContent = taskSnap.size;

  const classSnap = await getDocs(query(
    collection(db, "enrollments"),
    where("studentId", "==", getUser().uid),
    where("status", "==", "approved")
  ));

  document.getElementById("todayClasses").textContent = classSnap.size;
}

async function loadDashboardClasses() {
  const container = document.getElementById("dashClasses");

  const q = query(
    collection(db, "enrollments"),
    where("studentId", "==", getUser().uid),
    where("status", "==", "approved")
  );

  const snap = await getDocs(q);

  container.innerHTML = "";

  for (const docSnap of snap.docs) {
    const classId =docSnap.data().classId;

    const classDoc = await getDoc(doc(db, "classes", classId));

    if (!classDoc.exists()) continue;

    const cls = classDoc.data();

    const card = document.createElement("div");
    card.className = "dash-class-card";

    card.innerHTML = `
      <h3>${cls.name}</h3>
      <p>${cls.description || ""}</p>
    `;

    card.onclick = () => openStudentClass(classId, cls);

    container.appendChild(card);
  }
}

async function loadDashboardTasks() {
  const container = document.getElementById("dashTasks");

  const snap = await getDocs(query(
    collection(db, "tasks"),
    where("studentId", "==", getUser().uid)
  )); 

  const tasks = snap.docs.map(d => d.data());

  tasks.sort((a, b) => (a.date || "").localeCompare(b.date));

  container.innerHTML = "";

  tasks.slice(0, 3).forEach(t => {
    const item = document.createElement("div");
    item.className = "task-preview";

    item.innerHTML = `
        <div>
            <strong>${t.title}</strong>
            <small>${t.date || ""}</small>
        </div>
        <span class="material-icons">arrow_forward</span>
    `;

    container.appendChild(item);
  });
}

function initDashboardActions() {
  document.getElementById("goTasks").onclick = () => navigate("tasks");
  document.getElementById("goClasses").onclick = () => navigate("classes");
  document.getElementById("goProfile").onclick = () => navigate("profile");
}

async function loadNextTaskCountdown() {
  const container = document.getElementById("nextTaskCard");

  const snap = await getDocs(query(
    collection(db, "tasks"),
    where("studentId", "==", getUser().uid)
  ));

  const now = new Date();

  const upcoming = snap.docs
      .map(d => d.data())
      .filter(t => t.date && !t.completed)
      .map(t => {
        const dateTime = new Date(`${t.date}T${t.time || "00:00"}`);
        return { ...t, dateTime };
      })
      .filter(t => t.dateTime > now)
      .sort((a, b) => a.dateTime - b.dateTime);
  
  if (upcoming.length === 0) {
    container.innerHTML = `
        <div class="countdown-card empty">
            <span class="material-icons">emoji_events</span>
            <p>You're all caught up 🎉</p>
        </div>
    `;
    return;
  }

  const next = upcoming[0];

  renderCountdown(container, next);
}

function renderCountdown(container, task) {
    function update() {
        const now = new Date();
        const diff = task.dateTime - now;

        if (diff <= 0) {
            container.innerHTML = `
                <div class="countdown-card urgent">
                      <h4>${task.title}</h4>
                      <p>Due now ⚠️</p>
                </div>
            `;
            return;
        }

        const hrs = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff / (1000 * 60)) % 60);

        let state = "normal";
        if (hrs < 2) state = "urgent";
        else if (hrs < 24) state = "warning";

        container.innerHTML = `
            <div class="countdown-card ${state}">
                <div class="row space">
                    <h4>${task.title}</h4>
                    <p>${task.topic}</p>
                    <span class="pulse-dot"></span>
                </div>
                
                <p class="count-time">${hrs}h ${mins}m</p>
                <small>Next task deadline</small>
            </div>
        `;
  }

  update();
  setInterval(update, 60000);
}

async function loadDailyMission() {
  const container = document.getElementById("dailyMissionCard");

  const todayKey = new Date().toISOString().split("T")[0];
  const userId = getUser().uid;

  const ref = doc(db, "missions", `${userId}_${todayKey}`);
  const snap = await getDoc(ref);

  let mission;

  if (snap.exists()) {
    mission = snap.data();
  } else {
    mission = await generateMission(todayKey, userId);
  }

  renderMission(container, mission);
}

async function generateMission(todayKey, userId) {
  const taskSnap = await getDocs(query(
    collection(db, "tasks"),
    where("studentId", "==", userId),
    where("date", "==", todayKey)
  ));

  const classSnap = await getDocs(query(
    collection(db, "enrollments"),
    where("studentId", "==", userId),
    where("status", "==", "approved")
  ));

  const mission = {
    date: todayKey,
    tasksGoal: Math.min(3, taskSnap.size || 1),
    classesGoal: classSnap.size > 0 ? 1 : 0,
    tasksDone: 0,
    classesDone: 0,
    completed: false,
    xpReward: 20
  };

  await setDoc(doc(db, "missions", `${userId}_${todayKey}`), mission);

  return mission;
}

function renderMission(container, mission) {
    const progress =
        ((mission.tasksDone + mission.classesDone) /
        (mission.tasksGoal + mission.classesGoal)) * 100;

    container.innerHTML = `
        <div class="mission-card">
        
            <div class="row space">
                <h4>Daily Mission</h4>
                <span class="xp">+${mission.xpReward} XP</span>
            </div>
            
            <div class="mission-item">
                <span>Complete Tasks</span>
                <strong>${mission.tasksDone}/${mission.tasksGoal}</strong>
            </div>
            
            
            <div class="mission-item">
                <span>Study Class</span>
                <strong>${mission.classesDone}/${mission.classesGoal}</strong>
            </div>
            
            <div class="mission-progress">
                <div class="mission-fill" style="width:${progress}%"></div>
            </div>
            
        </div>
    `;

    updateMissionProgress();
}

async function updateMissionProgress(type) {
    const todayKey = new Date().toISOString().split("T")[0];
    const ref = doc(db, "missions", `${getUser().uid}_${todayKey}`);

    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const mission = snap.data();

    if (type === "task") mission.tasksDone++;
    if (type === "class") mission.classesDone++;

    const totalDone = mission.tasksDone + mission.classesDone;
    const totalGoal = mission.tasksGoal + mission.classesGoal;

    if (totalDone >= totalGoal && !mission.completed) {
      mission.completed = true;

      await rewardXP(mission.xpReward);
    }

    await updateDoc(ref, mission);

    loadDailyMission();
}