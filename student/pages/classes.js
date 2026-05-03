import { db } from "../../core/firebase.js";
import { storage } from "../../core/firebase.js";
import { getUser } from "../../core/auth.js";

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

let sortMode = "recent";

export function loadClasses() {
    isFirstLoad = true;

    contentArea.innerHTML = `
        <div class="classes-page">
              
            <div class="classes-header">
                <h2>My Classes</h2>
            </div>
            
            <div class="filters" id="filters">
                <button class="filter active" data-filter="all">All</button>
                <button class="filter" data-filter="science">Science</button>
                <button class="filter" data-filter="arts">Arts</button>
                <button class="filter" data-filter="economics">Economics</button>
            </div>

            <div class="class-controls">
               <span class="material-icons" id="filterBtn">filter_list</span>
               <span class="material-icons" id="sortBtn">swap_vert</span>
            </div>
            
            <div id="classList"></div>
            
            <div id="emptyState" class="empty hidden">
                <span class="material-icons">school</span>
                <p>No classes yet</p>
                <small>Request enrollment to get started</small>
            </div>
            
            <div class="request-section">
                <h3>Explore Classes</h3>
                <div id="allClasses"></div>
            </div>

        </div>
    
    `;

        document.getElementById("sortBtn").onclick = () => {
          sortMode = sortMode == "recent" ? "active" : "recent";
          loadMyClasses()
       }
    initFilters();

    loadMyClasses();
    loadAllClasses();
}

function formatStatus(status) {
  if (status === "completed") return "Completed";
  if (status === "upcoming") return "Upcoming";
  return "In Progress";
}

function initFilters() {
    document.querySelectorAll(".filter").forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const value = btn.dataset.filter;
            filterClasses(value);
        };
    });
}

function filterClasses(category) {
    document.querySelectorAll(".class-card").forEach(card => {
        const type = card.dataset.category || "all";

        if (category === "all" || type === category) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
}

let isFirstLoad = true; 

function loadMyClasses() {
    const currentUser = getUser();

    const list = document.getElementById("classList");
    const empty = document.getElementById("emptyState");

    if (!currentUser) return;

    list.innerHTML = `
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
    `;
    
    const q = query(
        collection(db, "enrollments"),
        where("studentId", "==", currentUser.uid),
        where("status", "==", "approved")
    );

    onSnapshot(q, async (snapshot) => {
        if (isFirstLoad) {
            list.innerHTML = "";
            isFirstLoad = false;
        }

        list.innerHTML = "";

        if (snapshot.empty) {
          list.innerHTML = `
              <div style="text-align:center; margin-top:40px; color:#666;">
                  <span class="material-icons" style="fon-size:40px;">school</span>
                  <p>No classes yet.</p>
                  <small>Request enrollment to get started</small>
              </div>
            `;
            return;
        }

        let classesArray = [];

        snapshot.forEach(docSnap => {
          const data = docSnap.data();

          const learningStatus = data.learningStatus || "in_progress";

          classesArray.push({
              classId: data.classId,
              enroll: data,
              learningStatus
           });
        });

        for (const item of classesArray) {
          const classRef = doc(db, "classes", item.classId);
          const classSnap = await getDoc(classRef);

          if (classSnap.exists()) {
            item.classData = classSnap.data();
          }
        }

        if (sortMode === "recent"){
          classesArray.sort((a, b) => {
            return (b.enroll.createdAt?.seconds || 0) - (a.enroll.createdAt?.seconds || 0);
          });
        }

        if (sortMode === "active"){
          classesArray.sort((a, b) => {
            return (b.enroll.lastAccessed?.seconds || 0) - (a.enroll.lastAccessed?.seconds || 0);
          });
        }

        list.innerHTML = "";

        classesArray.forEach(item => {
          const cls = item.classData;
          const learningStatus = item.learningStatus;

          const createdAt = item.enroll.createdAt?.toDate();
          const joinDate = createdAt
                ? createdAt.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                })
                : "Recently";

          const studentsCount = cls?.studentsCount || 0;

          const card = document.createElement("div");

           card.innerHTML = `
           
                <div class="class-card-new">

                    <div class="class-status ${learningStatus}">
                        ${formatStatus(learningStatus)}
                    </div>

                    <h3 class="class-title">${cls?.name || "Class"}</h3>
                    <p class="class-desc">${cls?.description || "No description"}</p>

                    <div class="class-meta">
                        <div class="meta-item">
                            <span class="material-icons">calenday_today</span>
                            <small>${joinDate}</small>
                        </div>

                        <div class="meta-item">
                            <span class="material-icons">groups</span>
                            <small>${studentsCount} students</small>
                        </div>
                      </div>

                    <button class="enter-btn">Enter Class</button>
                </div>
              
              `;

              card.querySelector(".enter-btn").onclick = () => {
                openStudentClass(item.classId, cls);
              };

              list.appendChild(card);

        });
              
        attachSearchFilter();
    });
}

function attachSearchFilter() {
    const input = document.getElementById("searchInput");

    input.addEventListener("input", () => {
        const value = input.value.toLowerCase();

        document.querySelectorAll(".class-card").forEach(card => {
            card.style.display = card.innerText.toLowerCase().includes(value)
                ? "flex"
                : "none";
        });
    });
}

function openStudentClass(classId, classData) {
  const content = document.getElementById("contentArea");

  content.innerHTML = `
  <div class="class-page">
    <div class="class-header-sticky">
      <span class="material-icons back-btn" id="backBtn">arrow_back</span>

      <div>
          <h3>${classData.name}</h3>
          <small class="subtle">${classData.description || ""}</small>
      </div>
    </div>

    <div class="class-tabs-modern">
      <div class="tab active" data-tab="materials">Materials</div>
      <div class="tab" data-tab="assignments">Assignments</div>
      <div class="tab" data-tab="exams">Examinations</div>
      <div class="tab" data-tab="papers">Past Papers</div>
    </div>

    <div id="classContent"></div>

    <div class="history-filters">
       <button data-filter="all">All</button>
       <button data-filter="pending">Pending</button>
       <button data-filter="viewed">Viewed</button>
       <button data-filter="graded">Graded</button>
    </div>

    </div id="submissionHistory"></div>
  </div>
  `;

  document.getElementById("backBtn").onclick = () => loadClasses();

  initStudentTabs(classId);

  updateLastAccessed(classId);
}

async function updateLastAccessed(classId) {
  const currentUser = getUser();

  const q = query(
    collection(db, "enrollments"),
    where("classId", "==", classId),
    where("studentId", "==", currentUser.uid)
  );

  const snap = await getDocs(q);

  if (!snap.empty) {
    await updateDoc(snap.docs[0].ref, {
      lastAccessed: serverTimestamp()
    });
  }
}

function initStudentTabs(classId) {
  const tabs = document.querySelectorAll(".tab");
  const content = document.getElementById("classContent");

  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      content.style.opacity = "0";

      setTimeout(() => {
        const selected = tab.dataset.tab;

        if (selected === "materials") loadStudentMaterials(classId);
        if (selected === "assignments") loadStudentAssignments(classId);
        if (selected === "exams") loadStudentExams(classId);
        if (selected === "papers") loadStudentPapers(classId);

        content.style.opacity = "1";
      }, 150);
    };
  });

  loadStudentMaterials(classId);
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
          preview = `<video controls class="material-video"><source src="${m.fileUrl}"></video>`;
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

function loadStudentAssignments(classId) {
  const container = document.getElementById("classContent");
  const user = getUser();

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
        where("studentId", "==", user.uid)
      );

      const subSnap = await getDocs(subQ);

      let statusHTML = "";
      let actionHTML = "";

      if (!subSnap.empty) {
        const sub = subSnap.docs[0].data();

        if (sub.status === "graded") {
          statusHTML = `<div class="status graded">Graded: ${sub.grade}</div>`;
        } else if (sub.status === "viewed") {
          statusHTML = `<div class="status viewed">Viewed</div>`;
        } else {
          statusHTML = `<div class="status pending">Pending</div>`;
        }

        actionHTML = `<button class="btn disabled">Already Submitted</button>`;
      } else {
        actionHTML = `
              <input type="file" class="file-input" />
              
              <div class="upload-progress" style="display:none;">
                      <div class="upload-fill"></div>
              </div>
              
              <button class="btn primary submit-btn" data-id="${assignmentId}">
                  Submit
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
        </div>
      `;

      container.appendChild(card);

      if (subSnap.empty) {
        const btn = card.querySelector(".submit-btn");
        const fileInput = card.querySelector(".file-input");

        btn.onclick = () => {
          submitAssignment(assignmentId, fileInput.files[0], card);
        };
      }
    }

    loadSubmissionHistory();
  });
}

async function submitAssignment(assignmentId, file, card) {
  if (!file) return alert("select file");

  const progressBar = card.querySelector(".upload-progress");
  const progressFill = card.querySelector(".upload-fill");

  progressBar.style.display = "block";

  const fileRef = ref(storage, `submissions/${Date.now}_${file.name}`);

  const uploadTask = uploadBytesResumable(fileRef, file);

  uploadTask.on("state_changed",
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      progressFill.style.width = progress + "%";
    },
    (error) => {
      alert("Upload failed.");
    },
    async () => {
      const url = await getDownloadURL(uploadTask.snapshot.ref);

      await addDoc(collection(db, "submissions"), {
        assignmentId,
        studentId: getUser().uid,
        fileUrl: url,
        grade: null,
        status: "pending",
        viewed: false,
        feedback: "",
        createdAt: serverTimestamp()
      });

      card.querySelector(".submit-btn").innerText = "Submitted";
      card.querySelector(".submit-btn").classList.add("disabled");

      alert("Submission successful");
    }
  );
}

function loadSubmissionHistory(filter = "all") {
  const container = document.getElementById("submissionHistory");
  if (!container) return;
  

  const q = query(
    collection(db, "submission"),
    where("studentId", "==", getUser().uid)
  );

  onSnapshot(q, (snap) => {
    container.innerHTML = "";

    snap.forEach(docSnap => {
      const s = docSnap.data();

      if (filter !== "all" && s.status !== filter) return;

      const item = document.createElement("div");
      item.className = "history-item";

      item.innerHTML = `
          <div>
               <strong>${s.assignmentId}</strong>
               <small>${s.status}</small>
          </div>
          
          <div>
             <a href="${s.fileUrl}" target="_blank">View</a>
             <button class="delete-btn" data-id="${docSnap.id}">
             Delete
             </button>
          </div>
      `;

      container.appendChild(item);
    });

    attachHistoryFilters();
    attachDeleteEvents();
  });
}

function attachHistoryFilters() {
  document.querySelectorAll(".history-filters button").forEach(btn => {
    btn.onclick = () => {
      loadSubmissionHistory(btn.dataset.filter);
    };
  });
}

function attachDeleteEvents() {
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
  
      if (!confirm("Delete submission?")) return;

      await deleteDoc(doc(db, "submissions", id));
    };
  });
}

async function loadStudentExams(classId) {
  const container = document.getElementById("classContent");

  const q = query(
    collection(db, "examinations"),
    where("classId", "==", classId)
  );

  onSnapshot(q, (snapshot) => {
    container.innerHTML = "";

    if (snapshot.empty) {
      container.innerHTML = renderEmptyState(
        "quiz",
        "No Exams Available",
        "Your teacher hasn't uploaded any exams yet."
      );
      return;
    }

    snapshot.forEach(docSnap => {
      const exam = docSnap.data();

      let preview = "";

      if (exam.fileType?.startsWith("image")) {
        preview = `<img src="${exam.fileUrl}" class="material-img" />`;
      }

      const card = document.createElement("div");
      card.className = "material-card";

      card.innerHTML = `
           <div class="material-title">${exam.title}</div>
           ${preview}
           
           <a href="${exam.fileUrl}" target="_blank" download class="btn secondary">
               <span class="material-icons">download</span>
               Download Exam
          </a>
      `;
      container.appendChild(card);
    });
  });   
}

async function loadStudentPapers(classId) {
  const container = document.getElementById("classContent");

  const q = query(
    collection(db, "pastpapers"),
    where("classId", "==", classId)
  );

  onSnapshot(q, (snapshot) => {
    container.innerHTML = "";

    if (snapshot.empty) {
      container.innerHTML = renderEmptyState(
        "menu_book",
        "No Past Papers",
        "Past papers will appear here once uploaded."
      );
      return;
    }

    snapshot.forEach(docSnap => {
      const paper = docSnap.data();

      const card = document.createElement("div");
      card.className = "material-card";

      card.innerHTML = `
           <div class="material-title">${paper.title}</div>
           
           <a href="${paper.fileUrl}" target="_blank" download class="btn secondary">
               <span class="material-icons">download</span>
               Download Paper
          </a>
      `;
      container.appendChild(card);
    });
  });   
}

function renderEmptyState(icon, title, message) {
   return `
   
        <div class="empty-state">
            <span class="material-icons empty-icon">${icon}</span>
            <h3>${title}</h3>
            <p>${message}</p>
        </div>
      `;

}

function loadAllClasses() {
  const list = document.getElementById("allClasses");
  const user = getUser();

  const enrollQ = query(
    collection(db, "enrollments"),
    where("studentId", "==", user.uid)
  );

  onSnapshot(enrollQ, (enrollSnap) => {
    const enrollmentMap = {};

    enrollSnap.forEach(doc => {
      const data = doc.data();
      enrollmentMap[data.classId] = data.status;
    });
  

  onSnapshot(collection(db, "classes"), (snapshot) => {
    list.innerHTML = "";

    snapshot.forEach(docSnap => {
      const c = docSnap.data();
      const classId = docSnap.id;

      const status = enrollmentMap[classId];

      let btnText = "Request";
      let btnClass = "btn primary";
      let disabled = false;

      if (status === "pending") {
         btnText = "Pending";
         btnClass = "btn warning";
         disabled = true;
      }

      if (status === "approved") {
         btnText = "Approved";
         btnClass = "btn success";
         disabled = true;
      }

      if (status === "rejected") {
         btnText = "Rejected";
         btnClass = "btn danger";
         disabled = false;
      }

      const card = document.createElement("div");
      card.className = "class-card";

      card.innerHTML = `
            <div>
                <h4>${c.name}</h4>
                <p>${c.description || ""}</p>
            </div>
            <button class="${btnClass}"
                    data-id="${classId}"
                    ${disabled ? "disabled" : ""}>
                  ${btnText}
            </button>
      `;

      const btn = card.querySelector("button");

      if (!disabled) {
        btn.onclick = () => requestJoin(classId);
      }

      list.appendChild(card);
    });
  });
});
}

async function requestJoin(classId) {
  const user = getUser();

  const existing = await getDocs(query(
    collection(db, "enrollments"),
    where("studentId", "==", user.uid),
    where("classId", "==", classId)
  ));

  if (!existing.empty) {
    return alert("Already requested or enrolled");
  }

  await addDoc(collection(db, "enrollments"), {
    classId,
    studentId: user.uid,
    status: "pending",
    learningStatus: "in_progress",
    startDate: null,
    endDate: null,
    lastAccessed: serverTimestamp(),
    createdAt: serverTimestamp()
  });

  alert("Request sent");
}
