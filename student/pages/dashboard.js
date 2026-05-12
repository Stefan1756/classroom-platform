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

async function renderDashboard() {
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

    <div id="subscriptionStatusCard"></div>

    <div class="dash-grid">
        <div id="nextTaskCard"></div>
        <div id="dailyMissionCard"></div>
    </div>

    

    <div class="section">
        <div class="row space">
            <h4>My Classes</h4>
        </div>

        <div class="class-scroll" id="dashClasses"></div>
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
  loadNextTaskCountdown();
  loadDailyMission();
  loadSubscriptionStatus();
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

async function loadSubscriptionStatus() {
    const userDoc = await getDoc(
          doc(db, "users", getUser().uid)
    );

    if (!userDoc.exists()) return;

    const user = userDoc.data();

    const existing = document.getElementById("subscriptionStatusCard");

    if (existing) existing.remove();

    const usedDownloads = user.downloadUsed || 0;

    const downloadLimit = user.downloadLimit || 0;

    const unlimitedDownloads =
        downloadLimit === -1;

    const dashboard = document.querySelector(".dashboard-modern");

    const card = document.createElement("div");

    card.id = "subscriptionStatusCard";


    if (
        !user.subscriptionStatus ||
        user.subscriptionStatus !== "active"
    ) {

        card.className = "subscription-warning";

        card.innerHTML = `
        <div class="sub-top">
            <span class="material-icons">lock</span>
            <div>
                <h3>No Active Subscription</h3>
                <p>Your learning access is currently locked</p>
            </div>
        </div>
            
        <button id="renewPlanBtn">
                Subscribe Now
        </button>
    `;

    dashboard.prepend(card);

    document.getElementById("renewPlanBtn").onclick = () => {
      navigate("subscription");
    };

    return;
  }

  let endDate;
  
  if (user.subscriptionEnd?.toDate) {
      endDate = user.subscriptionEnd.toDate();
  } else {
    endDate = new Date(user.subscriptionEnd);
  }

  const now = new Date();

  const diff = endDate - now;

  if (diff <= 0) {
     
      await updateDoc(
        doc(db, "users", getUser().uid),
         {
            subscriptionStatus: "expired",
            hasActiveSubscription: false
          }
       );

       navigate("subscription");

       return;
  }

  card.className = "subscription-active-card";

  const isTrial =
      user.subscriptionPlanId === "free_trial";

  card.innerHTML = `
          <div class="sub-headerr">
              <div>
                  <p class="plan-label">
                    ${isTrial ? "FREE ACCESS" : "PREMIUM PLAN"}
                  </p>
                  
                  <h3>${user.subscriptionPlan}</h3>
              </div>

              <span class="material-icons verified">
                   verified
              </span>
          </div>

          <div class="countdown-ring">
              <h2 id="subDays">0 days</h2>
              <small id="subHours">0h left</small>
          </div>

          <div class="sub-feature">
              <span class="material-icons">
              school
              </span>

              <div class="sub-feature-info">
                 <strong>
                      ${
                        user.classLimit === -1
                        ? "Unlimited Classes"
                        : `${user.classLimit} Classes`
                      }
                </strong>
              </div>
          </div>

          <div class="sub-feature">
              <span class="material-icons">
              download
              </span>

              <div class="sub-feature-info">
                <strong>
                      ${
                        unlimitedDownloads
                        ? "Unlimited Downloads"
                        : `${usedDownloads} / ${downloadLimit} Used`
                      }
                </strong>
              </div>
          </div>

          <div class="sub-progress">
              <div class="sub-progress-fill"></div>
          </div>
              
          <p class="expire-text">
              Access expires soon
          </p>
      `;

      dashboard.prepend(card);
      startSubscriptionCountdown(endDate);
  }

  function startSubscriptionCountdown(endDate) {

      function updateCountdown() {
          const now = new Date();

          const diff = endDate - now;

          if (diff <= 0) {
              document.getElementById("subDays").textContent =
                 "Expired";

              document.getElementById("subHours").textContent =
                  "0h left";
              
              return;
          }

          const days = Math.floor(
                diff / (1000 * 60 * 60 * 24)
          );

          const hours = Math.floor(
                (diff / (1000 * 60 * 60)) % 24
          );

          const mins = Math.floor(
                (diff / (1000 * 60)) % 60
          );

          document.getElementById("subDays").textContent =
              `${days} days`;

          document.getElementById("subHours").textContent =
               `${hours}h ${mins}m left`;
        }

        updateCountdown();

        setInterval(updateCountdown, 60000);
  }