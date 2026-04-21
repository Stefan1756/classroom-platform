import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
    getDoc,
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

const navItems = document.querySelectorAll(".nav-item");
const contentArea = document.getElementById("contentArea");

function loadPage(page) {
    contentArea.innerHTML = "";

    if (page === "dashboard") {
        loadDashboard();
    }

    if (page === "classes") {
        contentArea.innerHTML = `
            <h3>Classes</h3>

            <div class="card">
                <input type="text" id="className" placeholder="Class name" />
                <input type="text" id="classDesc" placeholder="Description" />
                <button id="createClassBtn">Create Class</button>
            </div>

            <div id="classList"></div>
        `;

        initClasses();
    }

    if (page === "materials") {
        contentArea.innerHTML = `
            <h3>Materials</h3>
            <p>Upload and manage learning materials</p>
        `;
    }

    if (page === "students") {
        contentArea.innerHTML = `
            <h3>Students</h3>
            <p>View students in your classes</p>
        `;
    }
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
}

function loadClasses() {
    const list = document.getElementById("classList");
    const user = auth.currentUser;

    const q = query(
        collection(db, "classes"),
        where("teacherId", "==", user.uid)
    );


    onSnapshot(q, (snapshot) => {
        list.innerHTML = "";

        snapshot.forEach(doc => {
            const c = doc.data();

            const card = document.createElement("div");
            card.className = "class-card";

            card.addEventListener("click", () => {
                openClassPage(doc.id, c);
            });

            card.innerHTML = `
                <div class="class-name">${c.name}</div>
                <div class="class-desc">${c.description || ""}</div>
            `;

            list.appendChild(card);
        });
    }); 
}

function openClassPage(classId, classData) {
    contentArea.innerHTML = `
        <div class="class-header">
            <span class="material-icons back-btn" id="backBtn">arrow_back</span>
            <h3>${classData.name}</h3>
        </div>
        
        <p>${classData.description || ""}</p>
        
        <div class="class-tabs">
            <button class="tab active" data-tab="materials">Materials</button>
            <button class="tab" data-tab="students">Students</button>
            <button class="tab" data-tab="assignments">Assignments</button>

        </div>
        
        <div id="classContent"></div>
    `;

    document.getElementById("backBtn").onclick = () => loadPage("classes");

    initClassTabs(classId);
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
        });
    });

    loadMaterials(classId);
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
    type: "grade",
    message: `You received ${grade}%`,
    read: false,
    assignmentId,
    classId,
    createdAt: serverTimestamp()
  });
}
await notifyGrade(s.studentId, grade, s.assignmentId, s.classId);
}

function loadDashboard() {
    contentArea.innerHTML = `
        <h3>Teacher's Dashboard</h3>
    
        <div class="stats">
            <div class="card">
                <h4>Total Classes</h4>
                <p>0</p>
            </div>
        
            <div class="card">
                <h4>Total Students</h4>
                <p>0</p>
            </div>
        
           <div class="card">
                <h4>Materials</h4>
                <p>0</p>
            </div>
        </div>
    `;
}

navItems.forEach(item => {
    item.addEventListener("click", () => {

        navItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");

        const page = item.getAttribute("data-page");
        loadPage(page);
    });
});

loadPage("dashboard");