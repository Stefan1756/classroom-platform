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
    where,
    deleteDoc,
    getDocs,
    getDoc,
    updateDoc,
    doc} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { navigate } from "./core/router.js";

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

const navItems = document.querySelectorAll(".nav-item");
const contentArea = document.getElementById("contentArea");

function loadPage(page) {
    contentArea.innerHTML = "";

    if (page === "dashboard") {
        renderDashboardSkeleton();
        onAuthStateChanged(auth, (user) => {
            if (user) initDashboard(user);
        });
    }

    if (page === "classes") {
        contentArea.innerHTML = `
        <div class="classes-page">

            <div class="classes-header">
                <div>
                    <h2>Manage Classes</h2>
                    <p>Create and organize your classes</p>
                </div>

                <button class="btn primary" id="openCreateClass">
                    <span class="material-icons">add</span>
                    Create
                </button>
            </div>

            <div class="create-class-card hidden" id="createClassForm">
                <input type="text" id="className" placeholder="Class name" />
                <input type="text" id="classDesc" placeholder="Description" />

                <button id="createClassBtn" class="btn primary">
                    Create Class
                </button>
            </div>

            <div>
                <h4>My Classes</h4>
                <p>List of all created classes, enter and delete classes whenever you like.</p>
            </div>

            <div id="classList" class="class-list"></div>
        </div>
        `;
        initClassesUI();
        initClasses();
    }

    if (page === "profile") {
        const container = document.getElementById("contentArea");
        container.innerHTML = renderProfileSkeleton();

        initProfileData();
    }

    if (page === "wallet") {
        contentArea.innerHTML = `
        <div class="wallet-page">
        
            <div class="wallet-hero">
             
                <div class="wallet-balance-card">
                
                    <div class="wallet-balance-top">
                    
                        <div>
                            <p>Available Balance</p>
                            <h1 id="walletBalance">
                                TZS 0
                            </h1>
                        </div>
                        
                        <div class="wallet-main-icon">
                            <span class="material-icons">account_balance_wallet</span>
                        </div>
                    
                    </div>
                    
                    <div class="wallet-balance-footer">
                    
                        <div>
                            <small>Pending</small>
                            <strong id="pendingBalance">
                                TZS 0
                            </strong>
                        </div>
                        
                        <div>
                            <small>Withdrawn</small>
                            <strong id="withdrawnBalance">
                                TZS 0
                            </strong>
                        </div>

                    </div>

                </div>

            </div>
            
            <div class="wallet-actions">
                
                <button class="wallet-action-btn" id="openWithdrawBtn">
                
                    <span class="material-icons">
                        south_west
                    </span>

                    Withdraw
                
                </button> 

                
                
                <button class="wallet-action-btn">
                
                    <span class="material-icons">
                        receipt_long
                    </span>

                    History
                
                </button>
                
            </div>
            
            <div class="wallet-section">
            
                <div class="wallet-section-header">
                
                    <h3>Recent Earnings</h3>
                    
                    <span class="material-icons">
                        trending_up
                    </span>
                    
                </div>
                
                <div id="teacherEarningsList"></div>
                
            </div>

        </div>
    `;
    loadWalletOverview();
    
    document.getElementById("openWithdrawBtn").onclick = () => {
        loadWithdrawPage();
    }

    }
}

function renderProfileSkeleton() {
    return `
       <div class="dashboard">
        
            <div class="skeleton-stat"></div>
        
            <div class="dash-stats">
                <div class="skeleton stat"></div>
                <div class="skeleton text"></div>
                <div class="skeleton stat"></div>
                <div class="skeleton text"></div>
                <div class="skeleton stat"></div>
                <div class="skeleton text"></div>
                <div class="skeleton stat"></div>
                <div class="skeleton text"></div>
                <div class="skeleton stat"></div>
                <div class="skeleton text"></div>
                <div class="skeleton stat"></div>
                <div class="skeleton text"></div>
            </div>
        
            <div class="skeleton card" style="height:80px;"></div>
        </div>
    `;
}

async function initProfileData() {
    const user = auth.currentUser;

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    const data = snap.data();

    renderProfileUI(data);
    loadTeacherStats(user.uid);
}

function renderProfileUI(user) {
    const container = document.getElementById("contentArea");

    container.innerHTML = `
        <div class="profile-page">
        
            <div class="profile-header-modern">
                <h2>My Profile</h2>
                <span class="material-icons">edit</span>
            </div>
            
            <div class="profile-card-modern">
                <img src="${user?.photoURL || "default.jpeg"}" class="avatar"/>
                
                <div>
                    <h3>${user?.username || "Teacher"}</h3>
                    <p>${user?.email || ""}</p>
                </div>
            </div>
            
            <div class="profile-stats">
                <div class="stat-box">
                    <p>Classes</p>
                    <strong id="pClasses">--</strong>
                </div>
                
                <div class="stat-box">
                    <p>Students</p>
                    <strong id="pStudents">--</strong>
                </div>
                
                <div class="stat-box">
                    <p>Materials</p>
                    <strong id="pMaterials">--</strong>
                </div>
            </div>
            
            <div class="profile-actions">
                <div class="action-card">Manage Classes</div>
                <div class="action-card">Upload Materials</div>
                <div class="action-card">View Insights</div>
            </div>
            
            <div class="card">
                <h4>About</h4>
                <p id="profileAbout">
                    ${user?.about || "This is your profile. You can update it later."}
                </p>
            </div>
            
        </div>
    `;
}

function loadTeacherStats(teacherId) {
    const classQ = query(
        collection(db, "classes"),
        where("teacherId", "==", teacherId)
    );

    onSnapshot(classQ, async (classSnap) => {

        const classIds = classSnap.docs.map(doc => doc.id);

        document.getElementById("pClasses").textContent =
            formatNumber(classIds.length);

        if (classIds.length ===0) {
            document.getElementById("pStudents").textContent = "0";
            document.getElementById("pMaterials").textContent = "0";
            return;
        }

        loadStudentsCount(classIds);
        loadMaterialsCount(classIds);
    });
}

function loadStudentsCount(classIds) {
    const enrollQ = collection(db, "enrollments");

    onSnapshot(enrollQ, (snap) => {
        let count = 0;

        snap.forEach(doc => {
            const data = doc.data();

            if (
                classIds.includes(data.classId) && 
                data.status === "approved"
            ) {
                count++;
            }
        });

        document.getElementById("pStudents").textContent =
            formatNumber(count);
    });
}

function loadMaterialsCount(classIds) {
    let materials = 0;
    let exams = 0;
    let papers = 0;

    const update = () => {
        const total = materials + exams + papers;

        document.getElementById("pMaterials").textContent =
            formatNumber(total);
    };

    onSnapshot(collection(db, "materials"), (snap) => {
        materials = snap.docs.filter(d =>
            classIds.includes(d.data().classId)
        ).length;

        update();
    });

    onSnapshot(collection(db, "examinations"), (snap) => {
        exams = snap.docs.filter(d =>
            classIds.includes(d.data().classId)
        ).length;

        update();
    });

    onSnapshot(collection(db, "pastpapers"), (snap) => {
        papers = snap.docs.filter(d =>
            classIds.includes(d.data().classId)
        ).length;

        update();
    });
}

function initClassesUI() {
    const openBtn = document.getElementById("openCreateClass");
    const form = document.getElementById("createClassForm");

    openBtn.onclick = () => {
        form.classList.toggle("hidden");
    };
}

function initClasses() {
    const createBtn = document.getElementById("createClassBtn");

    createBtn.addEventListener("click", createClass);

    loadClasses();
}

async function createClass() {
    const name = document.getElementById("className").value;
    const desc = document.getElementById("classDesc").value;

    if (!name) return alert("Class name required");

    const user = auth.currentUser;

    await addDoc(collection(db, "classes"), {
        name,
        description: desc,
        teacherId: user.uid,
        createdAt: serverTimestamp()
    });

    document.getElementById("className").value = "";
    document.getElementById("classDesc").value = "";

    document.getElementById("createClassForm").classList.add("hidden");
}

let unsubscribeClasses = null;

function loadClasses() {
    const list = document.getElementById("classList");

    list.innerHTML = renderClassSkeleton();

    const user = auth.currentUser;

    const q = query(
        collection(db, "classes"),
        where("teacherId", "==", user.uid)
    );

    onSnapshot(q, (snapshot) => {
        list.innerHTML = "";

        if (snapshot.empty) {
            list.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">school</span>
                    <p>No classes yet</p>
                </div>
            `;
            return;
        }

        snapshot.forEach(docSnap => {
            const c = docSnap.data();
            const classId = docSnap.id;

            const card = document.createElement("div");
            card.className = "class-card-modern";

            card.innerHTML = `
                <div class="class-info">
                    <h3>${c.name}</h3>
                    <p>${c.description || "No description"}</p>
                </div>

                <div class="class-actions">
                    <button class="btn enter-btn" data-id="${docSnap.id}">
                        Enter
                    </button>

                    <button class="delete-class-btn">
                        Delete
                    </button>
                </div>
            `;

            card.querySelector(".delete-class-btn").onclick = async (e) => {
                e.stopPropagation();

                if (!confirm("Delete class?")) return;

                await deleteClass(classId);
            };

            list.appendChild(card);
        });

        attachClassActions(snapshot);
    }); 
}

function renderClassSkeleton() {
    let skeletons = "";

    for (let i = 0; i < 3; i++) {
        skeletons += `
            <div class="class-card-skeleton">
                <div class="skeleton title"></div>
                <div class="skeleton text"></div>
                <div class="skeleton btn"></div>
            </div>
        `;
    }

    return skeletons;
}

function attachClassActions(snapshot) {
    document.querySelectorAll(".enter-btn").forEach(btn => {
        btn.onclick = () => {
            const id = btn.dataset.id;
            const docSnap = snapshot.docs.find(d => d.id === id);
            openClassPage(id, docSnap.data());
        };
    });  
}

   

function openClassPage(classId, classData) {
    const contentArea = document.getElementById("contentArea");
    
    contentArea.innerHTML = `
        <div class="class-page">
          
            <div class="class-header-modern">
                <div class="header-left">
                    <span class="material-icons back-btn" id="backBtn">arrow_back</span>
                    <div>
                        <h2>${classData.name}</h2>
                        <p>${classData.description || "No description"}</p>
                    </div>
                </div>

                <div class="header-actions">
                    <button class="btn secondary">Insights</button>
                </div>
            </div>
        
            <div class="class-stats">
                <div class="stat-card">
                    <p>Students</p>
                    <strong id="statStudents">--</strong>
                </div>

                <div class="stat-card">
                    <p>Assignments</p>
                    <strong id="statAssignments">--</strong>
                </div>

                <div class="stat-card">
                    <p>Materials</p>
                    <strong id="statMaterials">--</strong>
                </div>
            </div>
        
            <div class="class-tabs-modern">
                <button class="tab active" data-tab="materials">Materials</button>
                <button class="tab" data-tab="students">Students</button>
                <button class="tab" data-tab="assignments">Assignments</button>
                <button class="tab" data-tab="examinations">Exams</button>
                <button class="tab" data-tab="pastpapers">Past Papers</button>
            </div>
        
            <div id="classContent" class="class-content-modern"></div>
        
        </div>
    `;
    setTimeout(() => {
        initDashhboardInsights(teacherId);
    }, 0);
    initClassTabs(classId);
    loadClassInsights(classId);
    document.getElementById("backBtn").onclick = () => loadPage("classes");
}

function initClassTabs(classId) {
    const tabs = document.querySelectorAll(".tab");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            const selected = tab.getAttribute("data-tab");

            if (selected === "materials") loadMaterials(classId);
            if (selected === "students") loadStudents(classId);
            if (selected === "assignments") loadAssignments(classId);
            if (selected === "examinations") loadExaminations(classId);
            if (selected === "pastpapers") loadPastPapers(classId);
        });
    });

    loadMaterials(classId);
}

function loadClassInsights(classId) {
    const studentsQ = query(
        collection(db, "enrollments"),
        where("classId", "==", classId),
        where("status", "==", "approved")
    );

    onSnapshot(studentsQ, (snap) => {
        const count = snap.size;
        document.getElementById("statStudents").textContent = formatNumber(count);
    });

    const assignmentsQ = query(
        collection(db, "assignments"),
        where("classId", "==", classId),
    );

    onSnapshot(assignmentsQ, (snap) => {
        const count = snap.size;
        document.getElementById("statAssignments").textContent = formatNumber(count);
    });

    loadTotalMaterials(classId);
}

function loadTotalMaterials(classId) {
    let materialsCount = 0;
    let examsCount = 0;
    let pastPapersCount = 0;

    const updateUI = () => {
        const total = materialsCount + examsCount + pastPapersCount;

        const el = document.getElementById("statMaterials");
        if (el) el.textContent = formatNumber(total);
    };

    const mQ = query(
        collection(db, "materials"),
        where("classId", "==", classId)
    );

    onSnapshot(mQ, (snap) => {
        materialsCount = snap.size;
        updateUI();
    });

    const eQ = query(
        collection(db, "examinations"),
        where("classId", "==", classId)
    );

    onSnapshot(eQ, (snap) => {
        examsCount = snap.size;
        updateUI();
    });

    const pQ = query(
        collection(db, "pastpapers"),
        where("classId", "==", classId)
    );

    onSnapshot(pQ, (snap) => {
        pastPapersCount = snap.size;
        updateUI();
    });
}

function formatNumber(num) {
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num;
}

function loadMaterials(classId) {
    const content = document.getElementById("classContent");

    content.innerHTML = `
        <div class="card">
            <input type="text" id="materialTitle" placeholder="Material title" />

            <select id="materialType">
                <option value="link">Link</option>
                <option value="file">Upload Material</option>
            </select>

            <input type="text" id="materialLink" placeholder="Paste link (Youtube, PDF, etc)" />
            <input type="file" id="materialFile" style="display:none" />

            <button id="addMaterialBtn">Add Material</button>
        </div>
        
        <div id="materialsList"></div>
    `;

    const typeSelect = document.getElementById("materialType");
    const linkInput = document.getElementById("materialLink");
    const fileInput = document.getElementById("materialFile");

    typeSelect.addEventListener("change", () => {
        if (typeSelect.value === "link") {
            linkInput.style.display = "block";
            fileInput.style.display = "none";
        } else {
            linkInput.style.display = "none";
            fileInput.style.display = "block";
        }
    });

    document.getElementById("addMaterialBtn").onclick = () => {
        addMaterial(classId);
    };

    loadMaterialsList(classId);
}

async function addMaterial(classId) {
    const title = document.getElementById("materialTitle").value;
    const type = document.getElementById("materialType").value;

    if (!title) return alert("Title required");

    if (type === "link") {
        const link = document.getElementById("materialLink").value;
        if (!link) return alert("Enter link");

        await addDoc(collection(db, "materials"), {
        classId,
        title,
        type: "link",
        fileUrl: link,
        createdAt: serverTimestamp()
    });
   }

   if (type === "file") {
    const file = document.getElementById("materialFile").files[0];
    if (!file) return alert("Select file");

    if (file.type.startsWith("video") && file.size > 50 * 1024 * 1024) {
        return alert("Video too large (max ~15mins)");
    }

    const fileRef = ref(storage, `materials/${Date.now()}_${file.name}`);

    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);

    await addDoc(collection(db, "materials"), {
        classId,
        title,
        type: "file",
        fileUrl: url,
        fileType: file.type,
        createdAt: serverTimestamp()
    });
   }

    document.getElementById("materialTitle").value = "";
}

function loadMaterialsList(classId) {
    const list = document.getElementById("materialsList");

    const q = query(
        collection(db, "materials"),
        where("classId", "==", classId)
    );

    onSnapshot(q, (snapshot) => {
        list.innerHTML = "";

        snapshot.forEach(docSnap => {
            const m = docSnap.data();

            const card = document.createElement("div");
            card.className = "material-card";

            let preview = "";

            if (m.type === "link") {
                preview = `<a href="${m.fileUrl}" target="_blank">Open Link</a>`;
            }

            if (m.type === "file") {
                if (m.fileType.startsWith("image")) {
                    preview = `<img src="${m.fileUrl}" class="material-img" />`;
                } else {
                    preview = `<a href="${m.fileUrl}" target="_blank">Open File</a>`;
                }
            }

            card.innerHTML = `
                <div class="material-title">${m.title}</div>
                    ${preview}
                    <button class="delete-btn" data-id="${docSnap.id}">Delete</button>
            `;

            list.appendChild(card);
        });

        attachDeleteEvents();
    });
}

function attachDeleteEvents() {
    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.getAttribute("data-id");

            const confirmDelete = confirm("Delete this material?");
            if (!confirmDelete) return;

            await deleteDoc(doc(db, "materials", id));
        });
    });
}

async function requestEnrollment(classId, studentId) {
    await addDoc(collection(db, "enrollments"), {
        classId,
        studentId,
        status: "Pending",
        createdAt: serverTimestamp()
    });
}

function loadStudents(classId) {
    const content = document.getElementById("classContent");

    content.innerHTML = `
        <div class="card">
            <h4>Enrollment Requests</h4>
            <div id="requestsList"></div>
        </div>

        <div class="card">
            <h4>Enrolled Students</h4>
            <div id="studentsList"></div>
        </div>
    `;

    loadEnrollmentRequests(classId);
    loadApproveStudents(classId);
}

function loadEnrollmentRequests(classId) {
    const list = document.getElementById("requestsList");

    const q = query(
        collection(db, "enrollments"),
        where("classId", "==", classId),
        where("status", "==", "pending")
    );

    onSnapshot(q, async (snapshot) => {
        list.innerHTML = "";

        for (const docSnap of snapshot.docs) {
            const req = docSnap.data();

            const userRef = doc(db, "users", req.studentId);
            const userSnap = await getDoc(userRef);
            const user = userSnap.data();

            const card = document.createElement("div");
            card.className = "student-card";

            card.innerHTML = `
                <div>
                    <strong>${user.username}</strong><br/>
                    <small>${user.email}</small>
                </div>
                
                <div class="actions">
                    <button class="approve" data-id="${docSnap.id}">Approve</button>
                    <button class="reject" data-id="${docSnap.id}">Reject</button>
                </div>
            `;

            list.appendChild(card);
        }

        attachRequestActions();
    });
}

function attachRequestActions() {
    document.querySelectorAll(".approve").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.getAttribute("data-id");

            await updateDoc(doc(db, "enrollments", id), {
                status: "approved"
            });
        });
    });

    document.querySelectorAll(".reject").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.getAttribute("data-id");

            await updateDoc(doc(db, "enrollments", id), {
                status: "rejected"
            });
        });
    });
}

function loadApproveStudents(classId) {
    const list = document.getElementById("studentsList");

    const q = query(
        collection(db, "enrollments"),
        where("classId", "==", classId),
        where("status", "==", "approved")
    );

    onSnapshot(q, async (snapshot) => {
        list.innerHTML = "";

        for (const docSnap of snapshot.docs) {
            const req = docSnap.data();

            const userRef = doc(db, "users", req.studentId);
            const userSnap = await getDoc(userRef);
            const user = userSnap.data();

            const card = document.createElement("div");
            card.className = "student-card";

            card.innerHTML = `
                <div>
                    <strong>${user.username}</strong>
                    <small>${user.email}</small>
                </div>
            `;

            list.appendChild(card);
        }
    });
}

function loadAssignments(classId) {
    const content = document.getElementById("classContent");

    content.innerHTML = `
        <div class="card">
            <input class="text" id="assignmentTitle" placeholder="Assignment title" />
            <textarea id="assignmentDesc" placeholder="Description"></textarea>
            <input class="date" id="assignmentDue" placeholder="Deadline" />
            <button id="createAssignmentBtn">Create Assignment</button>
        </div>
        
        <div id="assignmentList"></div>
    `;

    document.getElementById("createAssignmentBtn").onclick = () => {
        createAssignment(classId);
    };

    loadAssignmentsList(classId);
}

async function createAssignment(classId) {
    const title = document.getElementById("assignmentTitle").value;
    const desc = document.getElementById("assignmentDesc").value;
    const due = document.getElementById("assignmentDue").value; 

    if (!title) return alert("Title required");

    await addDoc(collection(db, "assignments"), {
        classId,
        title,
        description: desc,
        dueDate: due,
        createdAt: serverTimestamp()
    });

    document.getElementById("assignmentTitle").value = "";

async function notifyStudents(classId, assignmentTitle) {
  const enrollQ = query(
    collection(db, "enrollments"),
    where("classId", "==", classId),
    where("status", "==", "approved")
  );

  const enrollSnap = await getDocs(enrollQ);

  enrollSnap.forEach(async (e) => {
    const studentId = e.data().studentId;

    await addDoc(collection(db, "notifications"), {
      userId: studentId,
      type: "assignment",
      message: `New assignment: ${assignmentTitle}`,
      read: false,
      classId,
      createdAt: serverTimestamp()
    });
  });
}
await notifyStudents(classId, title);
}

function loadAssignmentsList(classId) {
    const list = document.getElementById("assignmentList");

    const q = query(
        collection(db, "assignments"),
        where("classId", "==", classId)
    );

    onSnapshot(q, (snapshot) => {
        list.innerHTML = "";

        snapshot.forEach(doc => {
            const a = doc.data();

            const card = document.createElement("div");
            card.className = "card";

            card.innerHTML = `
                <strong>${a.title}</strong>
                <p>${a.description || ""}</p>
                <small>Due: ${a.dueDate || "N/A"}</small>

                <div class="assignment-actions">
                    <button class="btn secondary edit-btn" data-id="${doc.id}">Edit</button>
                    <button class="btn danger delete-btn" data-id="${doc.id}">Delete</button>
                    <button class="btn primary view-btn" data-id="${doc.id}">View Submissions</button>
                </div>
            `;

            card.querySelector("button").onclick = () => {
                openSubmissions(doc.id);
            };

            list.appendChild(card);
        });
    });
}

document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("edit-btn")) {
        const id = e.target.dataset.id;

        const newTitle = prompt("new title");
        if (!newTitle) return;

        await updateDoc(doc(db, "assignments", id), {
            title: newTitle
        });
    }

    if (e.target.classList.contains("delete-btn")) {
        const id = e.target.dataset.id;

        if (!confirm("Delete assignment?")) return;

        await deleteDoc(doc(db, "assignments", id));
    }

    if (e.target.classList.contains("view-btn")) {
        const id = e.target.dataset.id;

        openSubmissions(id);
    }
});

function openSubmissions(assignmentId) {
    const content = document.getElementById("classContent");

    content.innerHTML = `<h3>Submissions</h3><div id="subList"></div>`;

    const list = document.getElementById("subList");

    const q = query(
        collection(db, "submissions"),
        where("assignmentId", "==", assignmentId)
    );

    onSnapshot(q, (snapshot) => {
        list.innerHTML = "";

        for (const docSnap of snapshot.docs) {
            const s = docSnap.data();

            const card = document.createElement("div");
            card.className = "card";

            card.innerHTML = `
                <a href="${s.fileUrl}" target="_blank">View Submissions</a>
                <input type="number" placeholder="Grade" id="g-${docSnap.id}" />
                <button data-id="${docSnap.id}">Save</button>
            `;

            card.querySelector("button").onclick = () => {
                const grade = document.getElementById(`g-${docSnap.id}`).value;
                gradeSubmission(docSnap.id, grade);
            };

            list.appendChild(card);
        }
    });
}

async function gradeSubmission(id, grade) {
    await updateDoc(doc(db, "submissions", id), {
        grade: Number(grade)
    });

    alert("Graded!");

async function notifyGrade(studentId, grade, assignmentId, classId) {
  await addDoc(collection(db, "notifications"), {
    userId: studentId,
    message: `Your assignment was graded ${grade}%`,
    type: "grade",
    assignmentId,
    classId,
    read: false,
    createdAt: serverTimestamp()
  });
}
await notifyGrade(s.studentId, grade, s.assignmentId, s.classId);
}

function loadPastPapers(classId) {
    const content = document.getElementById("classContent");

    content.innerHTML = `
        <div class="card">
            <input type="text" id="paperTitle" placeholder="Past paper title" />
            <input type="file" id="paperFile" />
            <button id="uploadPaperBtn">Upload Paper</button>
        </div>

        <div id="paperList"></div>
    `;

    document.getElementById("uploadPaperBtn").onclick = () => {
        uploadPaper(classId);
    };

    loadPaperList(classId);
}

async function uploadPaper(classId) {
    const title = document.getElementById("paperTitle").value;
    const file = document.getElementById("paperFile").files[0];

    if (!title || !file) return alert("Fill all fields");

    const fileRef = ref(storage, `papers/${Date.now()}_${file.name}`);

    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);

    await addDoc(collection(db, "pastpapers"), {
        classId,
        title,
        fileUrl: url,
        fileType: file.type,
        createdAt: serverTimestamp()
    });

    document.getElementById("paperTitle").value = "";
}

function loadPaperList(classId) {
    const list = document.getElementById("paperList");

    const q = query(
        collection(db, "pastpapers"),
        where("classId", "==", classId)
    );

    onSnapshot(q, (snapshot) => {
        list.innerHTML = "";

        snapshot.forEach(docSnap => {
            const p = docSnap.data();
            const classId = docSnap.id;

            const card = document.createElement("div");
            card.className = "material-card";

            let preview = "";

            if (p.fileType.startsWith("image")) {
                preview = `<img src="${p.fileUrl}" class="material-img" />`;
            } else if (p.fileType === "application/pdf") {
                preview = `
                    <iframe src="${p.fileUrl}" class="pdf-preview"></iframe>
                `;
            } else {
                preview = `
                    <div class="file-preview">
                        <span class="material-icons">description</span>
                        <p>${p.title}</p>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="material-title">${p.title}</div>
                ${preview}
                <button class="delete-btn" data-id="${docSnap.id}">
                    Delete
                </button>
            `;

            list.appendChild(card);
        });

        attachPaperDelete();
    });
}

function attachPaperDelete() {
    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.id;

            if (!confirm("Delete this examinations?")) return;

            await deleteDoc(doc(db, "pastpapers", id));
        };
    });
}


function loadExaminations(classId) {
    const content = document.getElementById("classContent");

    content.innerHTML = `
        <div class="card">
            <input type="text" id="examTitle" placeholder="Examination title" />
            <input type="file" id="examFile" />
            <button id="uploadExamBtn">Upload Examination</button>
        </div>

        <div id="examList"></div>
    `;

    document.getElementById("uploadExamBtn").onclick = () => {
        uploadExam(classId);
    };

    loadExamList(classId);
}

async function uploadExam(classId) {
    const title = document.getElementById("examTitle").value;
    const file = document.getElementById("examFile").files[0];

    if (!title || !file) return alert("Fill all fields");

    const fileRef = ref(storage, `exams/${Date.now()}_${file.name}`);

    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);

    await addDoc(collection(db, "examinations"), {
        classId,
        title,
        fileUrl: url,
        fileType: file.type,
        createdAt: serverTimestamp()
    });

    document.getElementById("examTitle").value = "";
    document.getElementById("examFile").value = "";
}

function loadExamList(classId) {
    const list = document.getElementById("examList");

    const q = query(
        collection(db, "examinations"),
        where("classId", "==", classId)
    );

    onSnapshot(q, (snapshot) => {
        list.innerHTML = "";

        snapshot.forEach(docSnap => {
            const e = docSnap.data();
            const classId = docSnap.id;

            const card = document.createElement("div");
            card.className = "material-card";

            let preview = "";

            if (e.fileType.startsWith("image")) {
                preview = `<img src="${e.fileUrl}" class="material-img" />`;
            } else if (e.fileType === "application/pdf") {
                preview = `
                    <iframe src="${e.fileUrl}" class="pdf-preview"></iframe>
                `;
            } else {
                preview = `
                    <div class="file-preview">
                        <span class="material-icons">description</span>
                        <p>${e.title}</p>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="material-title">${e.title}</div>
                ${preview}
                <button class="delete-btn" data-id="${docSnap.id}">
                    Delete
                </button>
            `;

            list.appendChild(card);
        });

        attachExamDelete();
    });
}

function attachExamDelete() {
    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.id;

            if (!confirm("Delete this examinations?")) return;

            await deleteDoc(doc(db, "examinations", id));
        };
    });
}

function renderDashboardSkeleton() {
    return `
        <div class="dashboard">
        
            <div class="skeleton-stat"></div>
        
            <div class="dash-stats">
                <div class="skeleton stat"></div>
                <div class="skeleton text"></div>
                <div class="skeleton stat"></div>
                <div class="skeleton text"></div>
                <div class="skeleton stat"></div>
                <div class="skeleton text"></div>
                <div class="skeleton stat"></div>
                <div class="skeleton text"></div>
                <div class="skeleton stat"></div>
                <div class="skeleton text"></div>
                <div class="skeleton stat"></div>
                <div class="skeleton text"></div>
            </div>
        
            <div class="skeleton card" style="height:80px;"></div>
        </div>
    `;
}

async function initDashboard(user) {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    const data = snap.data();

    renderDashboardUI(data);
    loadDashboardStats(user.uid);
}

function renderDashboardUI(user) {
    const container = document.getElementById("contentArea");

    const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long"
    });

    container.innerHTML = `
        <div class="dashboard">
            <div class="dash-header-modern">
                <h2>Hello ${user?.username || "Teacher"}</h2>
                <p>${today}</p>
            </div>

                <div class="wallet-entry-card">
                    <div class="wallet-glow"></div>
                    <div class="wallet-top">
                        <div class="wallet-icon-wrap">
                            <span class="material-icons">account_balance_wallet</span>
                        </div>

                        <div>
                            <p id="teacherTotalEarnings">TZS 0</p>

                            <h3>
                                Manage Earnings
                            </h3>
                        </div>
                    </div>

                    <p class="wallet-desc">
                        Track earnings, withdrawals, payouts and
                        transaction history in one secure place.
                    </p>

                    <button id="openWalletPage">
                        Open Wallet
                        <span class="material-icons">
                            arrow_forward
                        </span>
                    </button>
                </div>
            </div>
            
            <div class="dash-stats-modern">
                <div class="dash-card">
                    <p>Classes</p>
                    <strong id="dClasses">--</strong>
                </div>
                
                <div class="dash-card">
                    <p>Students</p>
                    <strong id="dStudents">--</strong>
                </div>
                
                <div class="dash-card">
                    <p>Contents</p>
                    <strong id="dMaterials">--</strong>
                </div>
            </div>
            
            <div class="insights-grid">

                <div class="insight-card students">
                    <div class="insight-icon">
                        <span class="material-icons">groups</span>
                    </div>
                    <div class="insight-info">
                        <h4 id="studentsCount">0</h4>
                        <p>Student</p>
                        <small id="studentsTrend">0+ this week</small>
                    </div>
                </div>

                <div class="insight-card assignments">
                    <div class="insight-icon">
                        <span class="material-icons">assignment</span>
                    </div>
                    <div class="insight-info">
                        <h4 id="assignmentsCount">0</h4>
                        <p>Assignments</p>
                        <small id="assignmentsTrend">Active tasks</small>
                    </div>
                </div>

                <div class="insight-card materials">
                    <div class="insight-icon">
                        <span class="material-icons">menu_book</span>
                    </div>
                    <div class="insight-info">
                        <h4 id="materialsCount">0</h4>
                        <p>Materials</p>
                        <small id="materialsTrend">Resources shared</small>
                    </div>
                </div>

                <div class="insight-card engagement">
                    <div class="insight-icon">
                        <span class="material-icons">insights</span>
                    </div>
                    <div class="insight-info">
                        <h4 id="engagementScore">0%</h4>
                        <p>Engagement</p>
                        <small>Class activity level</small>
                    </div>
                </div>

            </div>

            <div class="chart-card">
                <canvas id="weeklyChart"></canvas>
            </div>
        </div>
    `;
    document.getElementById("openWalletPage").onclick = () => {
        loadPage("wallet");
    }
}

function loadDashboardStats(teacherId) {
    const classQ = query(
        collection(db, "classes"),
        where("teacherId", "==", teacherId)
    );

    onSnapshot(classQ, (classSnap) => {
        const classIds = classSnap.docs.map(d => d.id);

        document.getElementById("dClasses").textContent =
            formatNumber(classIds.length);

        if (classIds.length === 0) {
            updateInsight("You have no classes yet. Create your first class.");
            return;
        }

        loadDashboardStudents(classIds);
        loadDashboardMaterials(classIds);
        initDashhboardInsights(teacherId);
        loadWeeklyChartData(classIds);
        loadTeacherEarnings();
    });
}

function loadDashboardStudents(classIds) {
    onSnapshot(collection(db, "enrollments"), (snap) => {

        let count = 0;

        snap.forEach(doc => {
            const d = doc.data();

            if (
                classIds.includes(d.classId) &&
                d.status === "approved"
            ) {
                count++;
            }
        });

        document.getElementById("dStudents").textContent =
            formatNumber(count);
    });
}

function loadDashboardMaterials(classIds) {

    let materials = 0;
    let exams = 0;
    let papers = 0;

    const update = () => {
        const total = materials + exams + papers;

        document.getElementById("dMaterials").textContent =
            formatNumber(total);
    };

    onSnapshot(collection(db, "materials"), (snap) => {
        materials = snap.docs.filter(d =>
            classIds.includes(d.data().classId)
        ).length;

        update();
    });

    onSnapshot(collection(db, "examinations"), (snap) => {
        exams = snap.docs.filter(d =>
            classIds.includes(d.data().classId)
        ).length;

        update();
    });

    onSnapshot(collection(db, "pastpapers"), (snap) => {
        papers = snap.docs.filter(d =>
            classIds.includes(d.data().classId)
        ).length;

        update();
    });

}
async function initDashhboardInsights(teacherId) {
    try {
        const classSnap = await getDocs(query(
            collection(db, "classes"),
            where("teacherId", "==", teacherId)
        ));

        const classIds = classSnap.docs.map(d => d.id);

        if (classIds.length === 0) return;

        const data = await collectDashboardInsightData(classIds);
        renderInsights(data); 
    } catch (err) {
        console.error("Insights failed:", err);
    }
}

async function collectDashboardInsightData(classIds) {
    const { currentStart, currentEnd, lastStart, lastEnd } = getWeekRanges();

    const filterByClass = (snap) =>
        snap.docs.filter(d => classIds.includes(d.data().classId)).length;

    const enrollSnap = await getDocs(collection(db, "enrollments"));
    const assignSnap = await getDocs(collection(db, "assignments"));
    const materialSnap = await getDocs(collection(db, "materials"));

    const currentStudents = enrollSnap.docs.filter(d => {
        const data = d.data();
        return classIds.includes(data.classId) &&
            data.status === "approved" &&
            data.createdAt?.toDate() >= currentStart &&
            data.createdAt?.toDate() < currentEnd;
    }).length;

    const lastStudents = enrollSnap.docs.filter(d => {
        const data = d.data();
        return classIds.includes(data.classId) &&
            data.status === "approved" &&
            data.createdAt?.toDate() >= lastStart &&
            data.createdAt?.toDate() < lastEnd;
    }).length;

    const currentAssignments = assignSnap.docs.filter(d => {
        const data = d.data();
        return classIds.includes(data.classId) &&
            data.createdAt?.toDate() >= currentStart &&
            data.createdAt?.toDate() < currentEnd;
    }).length;

    const lastAssignments = assignSnap.docs.filter(d => {
        const data = d.data();
        return classIds.includes(data.classId) &&
            data.createdAt?.toDate() >= lastStart &&
            data.createdAt?.toDate() < lastEnd;
    }).length;

    const currentMaterials = materialSnap.docs.filter(d => {
        const data = d.data();
        return classIds.includes(data.classId) &&
            data.createdAt?.toDate() >= currentStart &&
            data.createdAt?.toDate() < currentEnd;
    }).length;

    const lastMaterials = materialSnap.docs.filter(d => {
        const data = d.data();
        return classIds.includes(data.classId) &&
            data.createdAt?.toDate() >= lastStart &&
            data.createdAt?.toDate() < lastEnd;
    }).length;

    return {
        students: compare(currentStudents, lastStudents),
        assignments: compare(currentAssignments, lastAssignments),
        materials: compare(currentMaterials, lastMaterials)
    };
}

function compare(current, previous) {
    const diff = current - previous;

    let percent = 0;
    if (previous > 0) {
        percent = Math.round((diff / previous) * 100);
    } else if (current > 0) {
        percent = 100;
    }

    return {
        value: current,
        diff,
        percent,
        trend: diff > 0 ? "up" : diff < 0 ? "down" : "flat"
    };
}



function renderInsights(data) {

    renderBox("studentsCount", "studentsTrend", (data.students));
    renderBox("assignmentsCount", "assignmentsTrend" ,(data.assignments));
    renderBox("materialsCount", "materialsTrend", (data.materials));

    const engagement = 
        Math.min(100,
            Math.round(
                (data.assignments.value * 10 + 
                    data.materials.value * 5 +
                    data.students.value * 2) / 10
                )
          );

    const el = document.getElementById("engagementScore");
    if (el) el.textContent = engagement + "%";
}

function renderBox(valueId, trendId, metric) {
    const valueEl = document.getElementById(valueId);
    const trendEl = document.getElementById(trendId);

    if (!valueEl || !trendEl) return;

    valueEl.textContent = formatNumber(metric.value);

    let arrow = "-";
    let color = "#999";

    if (metric.trend === "up") {
        arrow = "↑";
        color = "#10b981";
    } else if (metric.trend === "down") {
        arrow = "&#8595";
        color = "#ef4444";
    }

    trendEl.innerHTML = `
        <span style="color:${color}; font-weight:600;">
            ${arrow} ${Math.abs(metric.percent)}%
        </span>
    `;
}

function getWeekRanges() {
    const now = new Date();

    const startOfWeek = new Date(now);
    startOfWeek.setHours(0,0,0,0);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const lastWeekStart = new Date(startOfWeek);
    lastWeekStart.setDate(startOfWeek.getDate() - 7);

    const lastWeekEnd = new Date(startOfWeek);

    return {
        currentStart: startOfWeek,
        currentEnd: endOfWeek,
        lastStart: lastWeekStart,
        lastEnd: lastWeekEnd
    };
}

let weeklyChart;

function initChart(labels) {
    const ctx = document.getElementById("weeklyChart").getContext("2d");

    if (weeklyChart) weeklyChart.destroy();

    weeklyChart = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Students",
                    data: [],
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    yAxisID: "y",
                    fill: true,
                    background: "rgba(0,0,0,0.05)"

                },
                {
                    label: "Engagement",
                    data: [],
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    yAxisID: "y1",
                    fill: true,
                    background: "rgba(0,0,0,0.05)"
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    position: "left"
                },
                y1: {
                    beginAtZero: true,
                    position: "right",
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

function getWeekDays() {
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
}

async function loadWeeklyChartData(classIds) {
    const days = getWeekDays();

    initChart(days);

    const enrollSnap = await getDocs(collection(db, "enrollments"));

    const studentsPerDay = Array(7).fill(0);
    const engagementPerDay = Array(7).fill(0);

    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDate() + 1);
    start.setHours(0,0,0,0);

    enrollSnap.forEach(doc => {
        const data = doc.data();

        if (
            classIds.includes(data.classId) &&
            data.status === "approved" &&
            data.createdAt
        ) {
            const date = data.createdAt.toDate();
            const dayIndex = (date.getDay() + 6) % 7;

            if (date >= start) {
                studentsPerDay[dayIndex]++;
            }
        }
    });

    for (let i = 0; i < 7; i++) {
        engagementPerDay[i] = Math.min(100, studentsPerDay[i] * 10);
    }

    updateChart(studentsPerDay, engagementPerDay);
}

function updateChart(students, engagement) {
    if (!weeklyChart) return;

    weeklyChart.data.datasets[0].data = students;
    weeklyChart.data.datasets[0].data = engagement;

    weeklyChart.update();
}


navItems.forEach(item => {
    item.addEventListener("click", () => {

        navItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");

        const page = item.dataset.page;
        loadPage(page);
    });
});

async function deleteClass(classId) {
    try {
        if (!classId) {
            console.error("Missing classId");
            return;
        }

        await deleteDoc(doc(db, "classes", classId));

        console.log("Deleted class:", classId);
    } catch (err) {
        console.error("Delete failed:", err);
    }
}

async function loadTeacherEarnings() {
    const currentUser = auth.currentUser;

    if (!currentUser) return;
    
    const totalEl =
        document.getElementById("teacherTotalEarnings");


    const q = query(
        collection(db, "teacherEarnings"),
        where(
            "teacherId",
            "==",
            currentUser.uid
        )
    );

    const snap = await getDocs(q);

    let total = 0;

    snap.forEach(docSnap => {
        const earning = docSnap.data();

        total += earning.amount;

    });

    totalEl.textContent = `TZS ${total.toLocaleString()}`;
}

async function loadWalletOverview() {
    const currentUser = auth.currentUser;

    if (!currentUser) return;

    const q = query(
        collection(db, "teacherEarnings"),
        where(
            "teacherId",
            "==",
            currentUser.uid
        )
    );

    const snap = await getDocs(q);

    let total = 0;
    let pending = 0;
    let withdrawn = 0;

    const container = document.getElementById("teacherEarningsList");

    if (!container) return;
    container.innerHTML = "";

    if (snap.empty) {
        container.innerHTML = `
            
            <div class="wallet-empty-state">
            
                <div class="wallet-empty-icon">
                    <span class="material-icons">
                        payments
                    </span>
                </div>
                
                <h3>
                    No Earnings Yet
                </h3>
                
                <p>
                    Your subscription revenue and payouts
                    will appear here once students begin
                    enrolling through your classes.
                </p>
                
            </div>
            
        `;
        document.getElementById(
            "walletBalance"
        ).textContent = "TZS 0";

        return;
    }

    snap.forEach(docSnap => {
        const earning = docSnap.data();

        total += earning.amount;
        pending += earning.pendingWithdrawal || 0;
        withdrawn += earning.withdrawnAmount || 0;

        const item = document.createElement("div");

        item.className = "wallet-earning-item";

        item.innerHTML = `
            <div>
            
                <strong>
                    ${earning.studentName}
                </strong>
                
                <p>
                    ${earning.subscriptionPlan}
                </p>
                
            </div>
            
            <h4>
                +TZS ${earning.amount}
            </h4>
        `;
        container.appendChild(item);

    });

    const available = total - pending - withdrawn;

    document.getElementById("walletBalance").textContent = `TZS ${available.toLocaleString()}`;

    document.getElementById(
        "pendingBalance"
    ).textContent = `TZS ${pending.toLocaleString()}`;

    document.getElementById(
        "withdrawnBalance"
    ).textContent = `TZS ${withdrawn.toLocaleString()}`;
}

function loadWithdrawPage() {
    contentArea.innerHTML = `
    
    <div class="withdraw-page">
    
        <div class="withdraw-header">
        
            <button id="backWalletBtn">
                <span class="material-icons">
                    arrow_back
                </span>
            </button>
            
            <h2>Withdraw Funds</h2>
            
        </div>
        
        <div class="withdraw-balance-card">
        
            <p>Available Balance</p>
            
            <h1 id="withdrawAvailableBalance">
                TZS 0
            </h1>
            
        </div>
        
        <div class="withdraw-form-card">
        
            <h3>Withdraw Details</h3>
            
            <div class="input-group">
            
                <label>Full Name</label>
                
                <input
                    type="text"
                    id="withdrawName"
                    placeholder="Enter full name"
                />
                
            </div>
            
            <div class="input-group">
            
                <label>Receiving Number</label>
                
                <input
                    type="text"
                    id="withdrawNumber"
                    placeholder="Mobile number / Bank Number"
                />
                
            </div>
            
            <div class="input-group">
            
                <label>Amount</label>
                
                <input
                    type="number"
                    id="withdrawAmount"
                    placeholder="Minimum TZS 10000"
                />
                
            </div>
            
            <div class="withdraw-rules">
            
                <div class="rule-item">
                    <span class="material-icons">
                        info
                    </span>
                
                    <p>
                        Minimum withdraw is TZS 10,000
                    </P>
                </div>
                
                <div class="rule-item">
                    <span class="material-icons">
                        percent
                    </span>
                
                    <p>
                        Transaction fee is 10%
                        per withdraw
                    </P>
                </div>
                
                <div class="rule-item">
                    <span class="material-icons">
                        schedule
                    </span>
                
                    <p>
                        Withdraw are manually
                        verified by admin
                    </P>
                </div>

            </div>
            
            <div class="withdraw-summary">
            
                <div>
                    <small>Transaction Fee</small>
                    <strong id="feePreview">
                        TZS 0
                    </strong>
                </div>
                
                <div>
                    <small>You Receive</small>
                    <strong id="receivePreview">
                        TZS 0
                    </strong>
                </div>
                
            </div>
            
            <button class="withdraw-btn" id="submitWithdrawBtn">
                Withdraw
            </button>
        
        </div>
        
    </div>
    
    `;
    document.getElementById("backWalletBtn").onclick = () => {
        loadPage("wallet");
    };

    loadWithdrawBalance();
}

async function loadWithdrawBalance() {
    const currentUser = auth.currentUser;

    if (!currentUser) return;

    const q = query(
        collection(db, "teacherEarnings"),
        where("teacherId", "==", currentUser.uid)
    );

    const snap = await getDocs(q);

    let total = 0;
    let pending = 0;
    let withdrawn = 0;

    snap.forEach(docSnap => {
        const earning = docSnap.data();

        total += earning.amount || 0;
        pending += earning.pendingWithdrawal || 0;
        withdrawn += earning.withdrawnAmount || 0;
    });

    const available = total - pending - withdrawn;

    document.getElementById("withdrawAvailableBalance").textContent =
        `TZS ${available.toLocaleString()}`;

    const amountInput = document.getElementById("withdrawAmount");

    amountInput.addEventListener("input", () => {
        const amount = Number(amountInput.value) || 0;

        const fee = Math.floor(amount * 0.1);

        const receive = amount - fee;

        document.getElementById("feePreview").textContent = `TZS ${fee.toLocaleString()}`;

        document.getElementById("receivePreview").textContent = `TZS ${receive.toLocaleString()}`;
    });

    document.getElementById("submitWithdrawBtn").onclick = () => {
        submitWithdrawRequest();
    };

    
}

async function submitWithdrawRequest() {
    const currentUser = auth.currentUser;

    if (!currentUser) return;

    const teacherDoc = await getDoc(
        doc(db, "users", currentUser.uid)
    );

    if (!teacherDoc.exists()) {
        return showToast(
            "Teacher account not found",
            "error"
        );
    }

    const teacher = teacherDoc.data();

    const name =
        document.getElementById(
            "withdrawName"
        ).value.trim();

    const number =
        document.getElementById(
            "withdrawNumber"
        ).value.trim();

    const amount =
        Number(
            document.getElementById(
            "withdrawAmount"
        ).value
    );

    const availableBalance = teacher.balance || 0;

    const pendingAmount = teacher.pendingWithdraw || 0;

    const fee = Math.floor(amount * 0.10);

    const totalDeduction = amount + fee;

    const usableBalance = availableBalance - pendingAmount;

    if (!name || !number || !amount) {
        return showToast(
            "fill all fields",
            "error"
        );
    }

    if (!amount || amount <= 0) {
        return showToast(
            "Enter valid withdraw amount",
            "error"
        );
    }

    if (amount < 10000) {
        return showToast(
            "Minimum withdraw is TZS 10,000",
            "warning"
        );
    }

    if (usableBalance <= 0) {
        return showToast(
            "Your wallet balance is empty",
            "error"
        );
    }

    if (totalDeduction > usableBalance ) {
        return showToast(
            `Insufficient balance. You need TZS ${totalDeduction.toLocaleString()}`,
            "error"
        );
    }


    const receiveAmount = amount - fee;

    await addDoc(
        collection(db, "withdrawRequests"),
        {
            teacherId: currentUser.uid,
            teacherName: name,
            receiverNumber: number,
            amount,
            fee,
            receiveAmount,
            status: "pending",
            createdAt: serverTimestamp()
        }
    );

    showToast("Request submitted");

    loadWalletOverview();
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