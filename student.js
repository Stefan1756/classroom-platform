import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { 
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

import { 
    getFirestore,
    onSnapshot,
    addDoc,
    serverTimestamp,
    collection,
    query,
    getDoc,
    where,
    deleteDoc,
    getDocs,
    updateDoc,
    doc} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const storage = getStorage(app);

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    initApp(user);
})


const navItems = document.querySelectorAll(".nav-item");
const contentArea = document.getElementById("contentArea");

let currentUser = null;

function initApp(user) {
    currentUser = user;

    loadPage("dashboard");

    navItems.forEach(item => {
    item.addEventListener("click", () => {
        navItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");

        loadPage(item.getAttribute("data-page"));
    });
});
}


function loadPage(page) {
    contentArea.innerHTML = "";

    if (page === "dashboard")loadDashboard();
    if (page === "classes") loadClasses();
    if (page === "requests") loadRequests();
    if (page === "profile") loadProfile();
}

function loadDashboard() {
    const user = currentUser;

    contentArea.innerHTML = `
        <div class="welcome-card">
            <h3>Welcome back</h3>
            <p id="studentName">Loading...</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <span class="material-icons">class</span>
                <h4 id="totalClasses">0</h4>
                <p>Classes</p>
            </div>
            
        
            <div class="stat-card">
                <span class="material-icons">assignment</span>
                <h4 id="totalAssignments">0</h4>
                <p>Assignments</p>
            </div>

           <div class="stat-card highlight">
                <span class="material-icons">grade</span>
                <h4 id="avgScore">0</h4>
                <p>Avg Score</p>
            </div>
        </div>

        <div class="card">
            <h4>Performance By Class</h4>
            <div id="progressContainer"></div>
        </div>

        <div class="card">
            <h4>Upcoming Deadlines</h4>
            <div id="deadlines"></div>
        </div>

        <div class="card">
            <h4>Weekly Performance</h4>
            <div id="weeklyChart" class="bar-chart"></div>
        </div>

        <div class="card">
            <h4>Recent Activity</h4>
            <div id="recentActivity"></div>
        </div>
    `;

    loadStudentInfo();
    loadStats();
    loadDeadlines();
    loadRecentActivity();
    loadProgress();
    loadWeeklyChart();
    loadNotifications();
}

async function loadStudentInfo() {
    const ref = doc(db, "users", currentUser.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
        document.getElementById("studentName").textContent =
        snap.data().username;
    }
}

function loadStats() {
    const q1 = query(
        collection(db, "enrollments"),
        where("studentId", "==", currentUser.uid),
        where("status", "==", "approved")
    );

    onSnapshot(q1, snap => {
        document.getElementById("totalClasses").textContent = snap.size;
    });

    const q2 = collection(db, "assignments");

    onSnapshot(q2, snap => {
        document.getElementById("totalAssignments").textContent = snap.size;
    });

    const q3 = query(
        collection(db, "submissions"),
        where("studentId", "==", currentUser.uid)
    );

    onSnapshot(q3, snap => {
        let total = 0, count = 0;

        snap.forEach(doc => {
            const s = doc.data();
            if (s.grade !== null) {
                total += s.grade;
                count++;
            }
        });

        const avg = count ? (total / count).toFixed(1) : 0;
        document.getElementById("avgScore").textContent = avg;
    });
}

function loadDeadlines() {
    const container = document.getElementById("deadlines");

    onSnapshot(collection(db, "assignments"), async (snap) => {
        container.innerHTML = "";

        for (const docSnap of snap.docs) {
            const a = docSnap.data();
            const assignmentId = docSnap.id;

            if (!a.dueDate) return;

            const item = document.createElement("div");
            item.className = "deadline-item";

            const today = new Date();

            const dueDate = new Date(a.dueDate);

            let className = "deadline-item";

            if (dueDate < today) {
                className += " overdue";
            }

            item.innerHTML = `
                <div>
                    <strong>${a.title}</strong>
                    <small>Due: ${a.dueDate}</small>
                </div>
                <span class="material-icons">arrow_forward</span>
            `;

            item.onclick = () => {
                openAssignmentFromDashboard(a.classId, assignmentId);
            };

            container.appendChild(item);
        }
    });
}

async function openAssignmentFromDashboard(classId, assignmentId) {
    const classRef = doc(db, "classes", classId);
    const classSnap = await getDoc(classRef);

    if (!classSnap.exists()) return;

    const classData = classSnap.data();

    openStudentClass(classId, classData);

    setTimeout(() => {
        document.querySelector('[data-tab="assignments"]').click();

        const cards = document.querySelectorAll(".assignment-card");

        cards.forEach(card => {
            if (card.innerText.includes(assignmentId)) {
                card.scrollIntoView({ behavior: "smooth" });
                card.style.border = "2px solid #4CAF50";
            }
        });
    }, 500);
}


function loadRecentActivity() {
    const container = document.getElementById("recentActivity");

    const q = query(
        collection(db, "submissions"),
        where("studentId", "==", currentUser.uid)
    ); 
    
    onSnapshot(q, (snap)=> {
        container.innerHTML = "";

        snap.forEach(doc => {
            const s = doc.data();

            const item = document.createElement("div");
            item.className = "list-item";

            item.innerHTML = `
                Submitted assignment<br/>
                <small>${s.createdAt ? "Recently" : ""}</small>
            `;

            container.appendChild(item);
        });
    });
}

async function loadProgress() {
    const container = document.getElementById("progressContainer");

    const enrollQ = query(
        collection(db, "enrollments"),
        where("studentId", "==", currentUser.uid),
        where("status", "==", "approved")
    );

    const enrollSnap = await getDocs(enrollQ);

    container.innerHTML = `<div class="progress-scroll" id="progressScroll"></div>
                            <div class="dots" id="progressDots"></div>`;

    const scroll = document.getElementById("progressScroll");
    const dots = document.getElementById("progressDots");

    let index = 0;

    for (const e of enrollSnap.docs) {
        const classId = e.data().classId;

        const classSnap = await getDoc(doc(db, "classes", classId));
        const classData = classSnap.data();

        const assignQ = query(
            collection(db, "assignments"),
            where("classId", "==", classId)
        );

        const assignSnap = await getDocs(assignQ);
        const assignmentIds = assignSnap.docs.map(d => d.id);

        const subQ = query(
            collection(db, "submissions"),
            where("studentId", "==", currentUser.uid)
        );

        const subSnap = await getDocs(subQ);

        let total = 0, count = 0;

        subSnap.forEach(s => {
            const data = s.data();

            if (
                data.grade !== null && 
                assignmentIds.includes(data.assignmentId)
            ) {
                total += data.grade;
                count++;
            }
        });

        const avg = count ? Math.round(total / count) : 0;

        let color = "#f44336";
        if (avg >= 70) color = "#4caf50";
        else if (avg >= 40) color = "#ffc107";

        const card = document.createElement("div");
        card.className = "progress-card";

        card.innerHTML = `
            <div class="progress-header">
                <strong>${classData?.name || "Class"}</strong>
                <span>${avg}%</span>
            </div>
            
            <div class="progress-bar">
                <div class="progress-fill" 
                     style="width:${avg}%; background:${color}"></div>
            </div>
        `;

        scroll.appendChild(card);

        const dot = document.createElement("span");
        dot.className = index === 0 ? "dot active" : "dot";
        dots.appendChild(dot);

        index++;
    }

    setupScrollDots();
}

function setupScrollDots() {
    const scroll = document.getElementById("progressScroll");
    const dots = document.querySelectorAll(".dot");

    scroll.addEventListener("scroll", () => {
        const index = Math.round(scroll.scrollLeft / scroll.clientWidth);

        dots.forEach(d => d.classList.remove("active"));
        if (dots[index]) dots[index].classList.add("active");
    });
}

async function loadWeeklyChart() {
    const container = document.getElementById("weeklyChart");

    const subQ = query(
        collection(db, "submissions"),
        where("studentId", "==", currentUser.uid)
    );

    const snap = await getDocs(subQ);

    const dailyData = {};

    snap.forEach(doc => {
        const s = doc.data();

        if (!s.createdAt || s.grade === null) return;

        const date = s.createdAt.toDate();

        const key = date.toISOString().split("T")[0];

        if (!dailyData[key]) {
            dailyData[key] = { total: 0, count: 0 };
        }

        dailyData[key].total += s.grade;
        dailyData[key].count += 1;
    });

    const sortedDays = Object.keys(dailyData)
        .sort()
        .slice(-7);

    container.innerHTML = "";

    sortedDays.forEach(day => {
        const data = dailyData[day];
        const avg = Math.round(data.total / data.count);

        const bar = document.createElement("div");
        bar.className = "bar";

        const label = document.createElement("small");
        label.textContent = day.split("-")[2];
        label.style.textAlign = "center";

        const wrapper = document.createElement("div");
        wrapper.style.flex = "1";
        wrapper.appendChild(bar);
        wrapper.appendChild(label);

        container.appendChild(wrapper);

        bar.style.height = `${Math.min(avg, 100)}%`;

        bar.title = `${day} -> ${avg}%`;

        container.appendChild(bar);
    });

    if (sortedDays.length === 0) {
        container.innerHTML = `<p style="text-align:center;">No performance data yet</p>`;
    }

}

async function loadClasses() {
    contentArea.innerHTML = `
        <h3>My Classes</h3>
        <div id="classList"></div>
    `;

    const list = document.getElementById("classList");
    const user = currentUser;

    const q = query(
        collection(db, "enrollments"),
        where("studentId", "==", user.uid),
        where("status", "==", "approved")
    );

    onSnapshot(q, async (snapshot) => {
        list.innerHTML = "";

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();

            const classQuery = query(
                collection(db, "classes"),
                where("__name__", "==", data.classId)
            );

            const classSnap = await getDocs(classQuery);

            classSnap.forEach(c => {
                const cls = c.data();
                const classId = c.id

                const card = document.createElement("div");
                card.className = "class-card";

                card.addEventListener("click", () => {
                    openStudentClass(classId, cls);
                })

                card.innerHTML = `
                    <div class="class-name">${cls.name}</div>
                    <div class="class-desc">${cls.description}</div>
                `;

                list.appendChild(card);
            });
        }
    });
}

function openStudentClass(classId, classData) {
    contentArea.innerHTML = `
        <div class="class-header">
            <span class="material-icons back-btn" id="backBtn">arrow_back</span>
            <h3>${classData.name}</h3>
        </div>
        
        <p>${classData.description || ""}</p>

        <div class="class-tabs">
            <button class="tab active" data-tab="materials">Materials</button>
            <button class="tab" data-tab="assignments">Assignments</button>
        </div>
        
        <div id="classContent"></div>
    `;

    document.getElementById("backBtn").onclick = () => loadPage("classes");
    
    initStudentTabs(classId);
}

function initStudentTabs(classId) {
    const tabs = document.querySelectorAll(".tab");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            const selected = tab.getAttribute("data-tab");

            if (selected === "materials") loadStudentMaterials(classId);
            if (selected === "assignments") loadStudentAssignments(classId);
        });
    });

    loadStudentMaterials(classId);
}

function loadStudentAssignments(classId) {
    const container = document.getElementById("classContent");

    const q = query(
        collection(db, "assignments"),
        where("classId", "==", classId)
    );

    onSnapshot(q, async (snapshot) => {
        container.innerHTML = "";

        for (const docSnap of snapshot.docs) {
            const a = docSnap.data();
            const assignmentId = docSnap.id;

            const subQ = query(
                collection(db, "submissions"),
                where("assignmentId", "==", assignmentId),
                where("studentId", "==", currentUser.uid)
            );

            const subSnap = await getDocs(subQ);

            let statusHTML = "";
            let actionHTML = "";

            if (!subSnap.empty) {
                const sub = subSnap.docs[0].data();

                if (sub.grade !== null) {
                    statusHTML = `<div class="status graded">Graded: ${sub.grade}</div>`;
                } else {
                    statusHTML = `<div class="status submitted">Submitted</div>`;
                }

                actionHTML = `<button class="btn disabled">Already Submitted</button>`;
            } else {
                actionHTML = `
                    <input type="file" class="file-input" />
                    <button class="btn primary submit-btn" data-id="${assignmentId}">
                        Submit Assignment
                    </button>
                `;
            }

            const card = document.createElement("div");
            card.className = "assignment-card";

            card.innerHTML = `
                <div class="assignment-header">
                    <h4>${a.title}</h4>
                    ${statusHTML}
                </div>

                <p>${a.description || ""}</p>
                <small>Due: ${a.dueDate || "N/A"}</small>

                <div class="assignment-actions">
                    ${actionHTML}
                </button>
            `;

            container.appendChild(card);
        }

        attachSubmitEvents();
    });
}

function attachSubmitEvents() {
    document.querySelectorAll(".submit-btn").forEach(btn => {
        btn.onclick = () => {
            const card = btn.closest(".assignment-card");
            const fileInput = card.querySelector(".file-input");

            submitAssignment(btn.dataset.id, fileInput.files[0]);
        }
    });
}

async function submitAssignment(assignmentId, file) {
    if (!file) return alert("Select file");

    const fileRef = ref(storage, `submissions/${Date.now()}_${file.name}`);

    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);

    await addDoc(collection(db, "submissions"), {
        assignmentId,
        studentId: currentUser.uid,
        fileUrl: url,
        grade: null,
        feedback: "",
        createdAt: serverTimestamp()
    });

    alert("Submitted!");
}

function loadStudentMaterials(classId) {
    const container = document.getElementById("classContent");

    const q = query(
        collection(db, "materials"),
        where("classId", "==", classId)
    );

    onSnapshot(q, (snapshot) => {
        container.innerHTML = "";

        if (snapshot.empty) {
            container.innerHTML = `<p>No materials yet</p>`;
            return;
        }

        snapshot.forEach(doc => {
            const m = doc.data();

            const card = document.createElement("div");
            card.className = "material-card";

            let preview = "";

            if (m.type === "link") {
                preview = `<a href="${m.fileUrl}" target="_blank">Open Link</a>`;
            }

            if (m.type === "file") {
                if (m.fileType.startsWith("image")) {
                    preview = `<img src="${m.fileUrl}" class="material-img" />`;
                } else if (m.fileType.startsWith("video")) {
                    preview = `
                        <video controls class="material-video">
                            <source src="${m.fileUrl}">
                        </video>
                    `;
                } else {
                    preview = `<a href="${m.fileUrl}" target="_blank">Open File</a>`;
                }
            }

            card.innerHTML = `
                <div class="material-title">${m.title}</div>
                    ${preview}
            `;

            container.appendChild(card);
        });
    });
}

function loadRequests() {
    contentArea.innerHTML = `
        <h3>Join Classes</h3>
        <div id="allClasses"></div>
        
        <h4 style="margin-top:15px;">My Requests</h4>
        <div id="requestList"></div>
    `;

    loadAllClasses();
    loadMyRequests();
}

function loadAllClasses() {
    const list = document.getElementById("allClasses");

    onSnapshot(collection(db, "classes"), (snapshot) => {
        list.innerHTML = "";

        snapshot.forEach(doc => {
            const c = doc.data();

            const card = document.createElement("div");
            card.className = "class-card";

            card.innerHTML = `
                <div class="class-name">${c.name}</div>
                <button data-id="${doc.id}">Request</button>
            `;

            card.querySelector("button").onclick = () => requestJoin(doc.id);

            list.appendChild(card);
        });
    });
}

async function requestJoin(classId) {
    const user = currentUser;

    await addDoc(collection(db, "enrollments"), {
        classId,
        studentId: user.uid,
        status: "pending",
        createdAt: serverTimestamp()
    });

    alert("request sent");
}

function loadMyRequests() {
    const list = document.getElementById("requestList");
    const user = currentUser;

    const q = query(
        collection(db, "enrollments"),
        where("studentId", "==", user.uid)
    );

    onSnapshot(q, (snapshot) => {
        list.innerHTML = "";

        snapshot.forEach(doc => {
            const r = doc.data();

            const card = document.createElement("div");
            card.className = "request-card";

            card.innerHTML = `
                Class: ${r.classId}
                <div class="status ${r.status}">${r.status}</div>
            `;

            list.appendChild(card);
        });
    });
}

function loadProfile() {
    contentArea.innerHTML = `
        <h3>Profile</h3>
        
        <div class="card">
            <button onclick="logout()">Logout</button>
        </div>
    `;
}

function loadNotifications() {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", currentUser.uid)
  );

  const dropdown = document.getElementById("notifDropdown");
  const badge = document.getElementById("notifCount");

  onSnapshot(q, (snap) => {
    dropdown.innerHTML = "";

    let unread = 0;

    snap.forEach(docSnap => {
      const n = docSnap.data();

      if (!n.read) unread++;

      let icon = "notifications";

      if (n.type === "assignment") icon = "assignment";
      if (n.type === "grade") icon = "grade";
      if (n.type === "broadcast") icon = "campaign";

      if (n.isBroadcast) item.classList.add("broadcast");

      const item = document.createElement("div");
      item.className = `notif-item ${!n.read ? "unread" : ""}`;

      item.innerHTML = `
        <span class="material-icons">${icon}</span>
        <div>
            <p>${n.message}</p>
            ${n.isBroadcast ? "<small>Admin Message</small>" : ""}
        </div>
    `;

      item.onclick = () => {
        openNotification(docSnap.id, n);
      };

      dropdown.appendChild(item);
    });

    badge.textContent = unread;
  });
}

async function openNotification(id, n) {
  await updateDoc(doc(db, "notifications", id), {
    read: true
  });

  // Navigate
  if (n.assignmentId) {
    openAssignmentFromDashboard(n.classId, n.assignmentId);
  }
}

document.getElementById("notifIcon").onclick = () => {
  const dropdown = document.getElementById("notifDropdown");

  dropdown.style.display =
    dropdown.style.display === "block" ? "none" : "block";
};

function logout() {
    auth.signOut();
    window.location.href = "index.html";
}

