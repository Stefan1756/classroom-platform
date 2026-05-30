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
import { getUser, getUserData } from "./core/auth.js";

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


async function checkTeacherSubscriptionAccess() {
    const user = auth.currentUser;

    if (!user) return false;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return false;

    const data = userSnap.data();

    const now = new Date();

    let expired = false;

    if (data.subscriptionEnd?.toDate) {
        expired = data.subscriptionEnd.toDate() < now;
    }

    // FREE ACCESS EXPIRED
    if (
        data.subscriptionStatus !== "active" ||
        expired
    ) {

        await updateDoc(userRef, {
            subscriptionStatus: "expired",
            accountAccess: "restricted"
        });

        return false;
    }

    // ACTIVE ACCESS
    await updateDoc(userRef, {
        accountAccess: "active"
    });

    return true;
}

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

                <select id="classCategory">
                    <option value="">Select category</option>
                    <option value="Science">Science</option>
                    <option value="Arts">Arts</option>
                    <option value="Business">Business</option>
                </select>

                <div class="class-category-wrap">

                    <label>Price</label>

                    <div class="price-input-wrap">

                        <span>TZS</span>

                        <input
                            type="number"
                            id="classPrice"
                            placeholder="Example: Tsh 15000"
                        />

                    </div>

                    <label>Subject</label>

                    <select id="classSubject">
                        <option value="">Select subject</option>
                    </select>

                </div>

                <button id="createClassBtn" class="btn primary">
                    Create Class
                </button>

            </div>

            <div>
                <h4>My Classes</h4>
                <p>
                    Organize all your learning classes by category and subject.
                </p>
            </div>

            <div id="classList" class="class-list"></div>
        </div>
        `;
        initClassesUI();
        initCategorySubjects();
        initClasses();
    }

    if (page === "profile") {
        const container = document.getElementById("contentArea");
        container.innerHTML = renderProfileSkeleton();

        initProfileData();
    }

    if (page === "subscription") {
        initDashboard();
        onAuthStateChanged(auth, (user) => {
            if (user) loadSubscriptionPage(user);
        });
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

    const hasProfile = 
        user?.subject ||
        user?.experience ||
        user?.price ||
        user?.number ||
        user?.about;

    container.innerHTML = `

        <div class="teacher-profile-page">

            <div class="teacher-profile-topbar">
                  
                <button id="profileBackBtn" class="profile-back-btn">
                    <span class="material-icons">arrow_back_ios</span>
                </button>

                <button id="editProfileBtn" class="profile-edit-btn">
                    <span class="material-icons">edit</span>
                    Edit
                </button>

            </div>

            <div class="teacher-profile-header">

                <div class="teacher-avatar-wrap">

                    <img
                        src="${user?.photoURL || 'default.jpeg'}"
                        class="teacher-profile-avatar
                        id="teacherProfileAvatar"
                    />

                    <label for="profileImageInput" class="change-avatar-btn">
                        <span class="material-icons">photo_camera</span>
                    </label>

                    <input
                        type="file"
                        id="profileImageInput"
                        accept="image/*"
                        hidden
                    />

                </div>

                    <h2 id="profileTeacherName">
                        ${user?.username || "Teacher"}
                    </h2>

                    <div class="teacher-badge">
                        <span class="material-icons">verified</span>
                        Certified Teacher
                    </div>
                
                </div>

               <div class="teacher-profile-tabs">

                    <div class="teacher-info-card">
                        <span class="material-icons">phone</span>
                        <small>Phone</small>

                        <strong id="profileNumber">
                            ${user?.number || "255"}
                        </strong>
                    </div>

                    <div class="teacher-info-card">
                        <span class="material-icons">menu_book</span>
                        <small>Subject</small>

                        <strong id="profileSubject">
                            ${user?.subject || "Not set"}
                        </strong>
                    </div>

                    <div class="teacher-info-card">
                        <span class="material-icons">work</span>
                        <small>Experience</small>

                        <strong id="profileExperience">
                            ${user?.experience || "0"} Years
                        </strong>
                    </div>

                    <div class="teacher-info-card">
                        <span class="material-icons">payments</span>
                        <small>Price Per Month</small>

                        <strong id="profilePrice">
                            ${Number(user?.price || 0).toLocaleString()}
                        </strong>
                    </div>

                </div>
            
                <div class="teacher-about-card">

                    <div class="about-title">
                        <span class="material-icons">info</span>
                        <h3>About</h3>
                    </div>

                    <p id="profileAboutText">
                        ${
                            user?.about ||
                            "Tell students about yourself, your teaching experience, teaching style and expertise."
                        }
                    </p>

                </div>
            
            </div>

        `;

        document.getElementById("profileBackBtn").onclick = () => {
        loadPage("dashboard");
    };

    document.getElementById("editProfileBtn").onclick = () => {
        openEditProfileModal(user);
    };

    initProfileImageUpload();

    if (!hasProfile) {
        setTimeout(() => {
            openEditProfile(user);
        }, 400);
    }
}

function initProfileImageUpload() {
    const imageInput = document.getElementById("profileImageInput");

    imageInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const currentUser = auth.currentUser;
        if(!currentUser) return;

        try {
            showToast(
                "Uploading picture...",
                "success"
            );

        const storageRef = ref(
            storage,
            `avatars/${currentUser.uid}_${Date.now}`
        );

        await uploadBytes(storageRef, file);

        const downloadURL = await getDownloadURL(storageRef);

        await updateDoc(
            doc(db, "users", currentUser.uid),
            {
                photoURL: downloadURL
            }
        );

        document.getElementById("teacherProfileAvatar").src = downloadURL;

        showToast("Profile updated");

        } catch (err) {
            console.error(err);
            showToast("Profile picture uploaded");
        }
    });
}

function openEditProfileModal(user) {
    
    const modal = document.createElement("div");

    modal.className = "profile-edit-modal";

    modal.innerHTML = `
        
        <div class="profile-edit-content">
        
            <div class="profile-edit-header">
             
                <h2>Edit Profile</h2>

                <button id="closeEditModal">
                    <span class="material-icons">close</span>
                </button>

            </div>
            
            <div class="profile-edit-form">

                <div class="input-group">

                    <label>Teacher Name</label>

                    <input
                        type="text"
                        id="editTeacherName"
                        value="${user?.username || ""}"
                        placeholder="Sir..."
                    />
                </div>

                <div class="input-group">
                    <label>Subject</label>
                
                    <input
                        type="text"
                        id="editTeacherSubject"
                        value="${user?.subject || ""}"
                        placeholder="Example: Mathematics"
                    />
                </div>
            
                <div class="input-group">
            
                    <label>Experience</label>
                
                    <input
                        type="number"
                        id="editTeacherExperience"
                        value="${user?.experience || ""}"
                        placeholder="Example: 5"
                   />
                </div>
            
                <div class="input-group">
            
                    <label>Price Per Month</label>
                
                    <input
                        type="number"
                        id="editTeacherPrice"
                        value="${user?.price || ""}"
                        placeholder="Example: 15000"
                    />
                </div>

                <div class="input-group">
            
                    <label>Phone</label>
                
                        <input
                            type="text"
                            id="editTeacherNumber"
                            value="${user?.number || ""}"
                            placeholder="Example: 0712345678"
                        />
                    </div>
            
                <div class="input-group">
            
                    <label>About</label>
                
                    <textarea
                        id="editTeacherAbout"
                        placeholder="Tell students about yourself..."
                    >${user?.about || ""}</textarea>
                </div>
            
                <button id="saveProfileBtn" class="save-profile-btn">
                    Save Profile
                </button>

            </div>
            
        </div>
        
    `;

    document.body.appendChild(modal);

    document.getElementById("closeEditModal").onclick = () => {
        modal.remove();
    };

    document.getElementById("saveProfileBtn").onclick = async () => {
        const currentUser = auth.currentUser;

        const username = document.getElementById("editTeacherName").value.trim();
        const subject = document.getElementById("editTeacherSubject").value.trim();
        const experience = document.getElementById("editTeacherExperience").value.trim();
        const price = document.getElementById("editTeacherPrice").value.trim();
        const number = document.getElementById("editTeacherNumber").value.trim();
        const about = document.getElementById("editTeacherAbout").value.trim();

        if (
            !username ||
            !subject ||
            !experience ||
            !price ||
            !number ||
            !about
        ) {
            return showToast(
                "Fill all profile fields",
                "error"
            );
        }

        try {
              
            await updateDoc(
                doc(db, "users", currentUser.uid),
                {
                    username,
                    subject,
                    experience,
                    price: Number(price),
                    number,
                    about
                }
           );

           showToast(
                "Profile updated successfully"
            );

            modal.remove();

            initProfileData();

        } catch (err) {
            console.error(err);
            showToast(
                "Failed to update profile",
                "error"
            );
        }
    };
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

function initCategorySubjects() {

    const categorySelect = document.getElementById("classCategory");

    const subjectSelect = document.getElementById("classSubject");

    const categories = {

        Science: [
            "Computer",
            "Geography",
            "Chemistry",
            "Biology",
            "Physics",
            "Mathematics"
        ],

        Arts: [
            "History",
            "Kiswahili",
            "English Language",
            "Literature",
            "Civics"
        ],

        Business: [
            "Economics",
            "Commerce",
            "Book Keeping"
        ]
    };

    categorySelect.addEventListener("change", () => {

        const selected = categorySelect.value;

        subjectSelect.innerHTML = `
            <option value="">Select subject</option>
        `;

        if (!selected) return;

        categories[selected].forEach(subject => {
            const option = document.createElement("option");

            option.value = subject;

            option.textContent = subject;

            subjectSelect.appendChild(option);
        });
    });
}

async function createClass() {
    const name = document.getElementById("className").value;
    const desc = document.getElementById("classDesc").value;
    const category = document.getElementById("classCategory").value;
    const subject = document.getElementById("classSubject").value;
    const price = Number(document.getElementById("classPrice").value);

    if (!name || !desc || !category || !subject || !price) return showToast("Fill all fields", "warning");

    const user = auth.currentUser;

    await addDoc(collection(db, "classes"), {
        name,
        description: desc,
        category,
        subject,
        price,
        teacherId: user.uid,
        createdAt: serverTimestamp()
    });

    document.getElementById("className").value = "";
    document.getElementById("classDesc").value = "";
    document.getElementById("classCategory").value = "";
    document.getElementById("classPrice").value = "";
    document.getElementById("classSubject").innerHTML = `
        <option value="">Select subject</option>
    `;

    document.getElementById("createClassForm").classList.add("hidden");

    showToast("Class created!");
}

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
                <div class="class-card-top">

                    <div class="class-category-badge ${c.category}">
                        ${c.category}
                    </div>

                    <div class="class-price-badge">
                        TZS ${Number(c.price || 0).toLocaleString()}
                    </div>    

                </div>

                <div class="class-info">
                    <h3>${c.name}</h3>

                    <div class="class-subject-chip">
                        ${c.subject}
                    </div>
                                    
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

                        <div class="open-class-tags">

                            <span class="open-category-tag ${classData.category}">
                                ${classData.category}
                            </span> 
                            
                            <span class="open-subject-tag">
                                ${classData.subject}
                            </span>
                            
                        </div>

                        
                        <div class="class-price-display">

                            <span class="material-icons">payments</span>
                                TZS ${Number(classData.price || 0).toLocaleString()}
                          
                        </div>
                                
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
                <button class="tab" data-tab="submissions">Submissions</button>
                <button class="tab" data-tab="examinations">Exams</button>
                <button class="tab" data-tab="pastpapers">Past Papers</button>
            </div>
        
            <div id="classContent" class="class-content-modern"></div>
        
        </div>
    `;
    setTimeout(() => {
        loadClassInsights(classId);
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
            if (selected === "submissions") openExamSubmissions(classId);
            if (selected === "examinations") openExamUpload(classId);
            if (selected === "pastpapers") openPastPaperUpload(classId);
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

    if (!title) return showToast("Title required", "warning");

    if (type === "link") {
        const link = document.getElementById("materialLink").value;
        if (!link) return showToast("Enter link", "warning");

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
    if (!file) return showToast("Select file", "warning");

    if (file.type.startsWith("video") && file.size > 50 * 1024 * 1024) {
        return showToast("Video too large (max ~15mins)", "error");
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

function openExamSubmissions(examId, examData) {
    const container = document.getElementById("classContent");
        container.innerHTML = `
            <div class="teacher-submissions-page">
                <div class="submissions-header">
                    <div>
                        <h2>${examData?.title || "Exam"}</h2>
                        <p>Student who Submitted this exam</p>
                    </div>
                </div>
            
                <div id="submissionsList" class="submissions-list">
                    <div class="loading-card">
                        Loading submissions...
                    </div>
                </div>
            </div>
        `;
        loadExamSubmissions(examId);    
    };

async function loadExamSubmissions(examId) {

    const list = document.getElementById("submissionsList");

    console.log("Loading submissions for exam:", examId);

    const q = query(
        collection(db, "examSubmissions"),
        where("examId", "==", examId)
    );

    onSnapshot(q, async (snapshot) => {

        console.log("Found submissions:", snapshot.size);

        list.innerHTML = "";

        if (snapshot.empty) {
            list.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">inbox</span>
                    <p>No submissions yet</p>
                </div>
            `;
            return;
        }

        for (const docSnap of snapshot.docs) {

            const sub = docSnap.data();
            const submissionId = docSnap.id;

            const studentDoc = await getDoc(
                doc(db, "users", sub.studentId)
            );

            const student = studentDoc.exists()
                ? studentDoc.data()
                : {};

            const card = document.createElement("div");
            card.className = "submission-card";

            card.innerHTML = `
                <div class="submission-top">

                    <img src="${student.avatar || "default.jpeg"}"
                         class="submission-avatar" />

                    <div>
                        <h3>${student.username || "Student"}</h3>

                        <p>
                            ${sub.status === "graded"
                                ? "Reviewed"
                                : "Pending Review"}
                        </p>
                    </div>

                </div>

                <a href="${sub.fileUrl}"
                   target="_blank"
                   class="open-submission-btn">

                    Open PDF

                </a>

                <button class="grade-btn">
                    ${sub.status === "graded"
                        ? "Update Grade"
                        : "Grade Exam"}
                </button>

                <button class="delete-submission-btn">
                    Delete
                </button>
            `;

            card.querySelector(".grade-btn").onclick = () => {
                openGradeModal(submissionId, sub);
            };

            card.querySelector(".delete-submission-btn").onclick = async () => {

            const confirmDelete = confirm(
                "Delete this submission?"
            );

            if (!confirmDelete) return;

            await deleteDoc(
            doc(db, "examSubmissions", submissionId)
        );

        showToast("Submission deleted");
    };

        list.appendChild(card);
        }
    });
}

function openPastPaperUpload(classId) {
    const content = document.getElementById("classContent");

    content.innerHTML = `
        <div class="upload-page">
            <div class="upload-header">
            <h2>Upload Past Paper</h2>
        </div>

        <div class="upload-card">
            <input type="text"
                    id="paperTitle"
                    placeholder="Paper Title">
                
            <input type="text"
                    id="paperSubject"
                    placeholder="Subject">

            <input type="number"
                    id="paperYear"
                    placeholder="Year">

            <label class="upload-label">
                Upload Thumbnail
                <input type="file"
                    id="paperThumbnail"
                    accept="image/*">
            </label>

            <label class="upload-label">
                Upload PDF
                <input type="file"
                    id="paperFile"
                    accept=".pdf">
            </label>

            <button id="publishPaperBtn" class="publish-btn">
                Publish Paper
            </button>
        </div>
    </div>
    `;

    document.getElementById("publishPaperBtn").onclick = () => {
        uploadPastPaper(classId);
    };
}

async function uploadPastPaper(classId) {
    const title = document.getElementById("paperTitle").value;
    const subject = document.getElementById("paperSubject").value;
    const year = document.getElementById("paperYear").value;
    const thumbFile = document.getElementById("paperThumbnail").files[0];
    const paperFile = document.getElementById("paperFile").files[0];
    if (!title || !paperFile) return showToast("Fill all fields", "error");
    const teacher = getUserData();
    let thumbnailUrl = "";
    if (thumbFile) {
        const thumbRef = ref(
            storage,
            `paper_thumbnails/${Date.now()}_${thumbFile.name}`
        );

        await uploadBytes(thumbRef, thumbFile);
        thumbnailUrl = await getDownloadURL(thumbRef);
    }

    const fileRef = ref(
        storage,
        `pastpapers/${Date.now()}_${paperFile.name}`
    );

    await uploadBytes(fileRef, paperFile);
    const fileUrl = await getDownloadURL(fileRef);

    const user = auth.currentUser;
    
    await addDoc(collection(db, "pastpapers"), {
        classId,
        title,
        subject,
        year,
        thumbnail: thumbnailUrl,
        fileUrl,
        fileType: paperFile.type,
        teacherId: user.uid,
        teacherName: teacher.name || "Teacher",
        teacherAvatar: teacher.photoURL || "",
        createdAt: serverTimestamp()
    });

    document.getElementById("paperTitle").value = "";
    showToast("Past paper uploaded");
}

async function openExamUpload(classId) {
    const content = document.getElementById("classContent");
    content.innerHTML = `
        <div class="upload-page">
            <div class="upload-header">
                <h2>Create Exam</h2>
            </div>
            
            <div class="upload-card">
                <input type="text"
                        id="examTitle"
                        placeholder="Exam title">
                        
                <textarea
                        id="examDescription"
                        placeholder="Exam description"></textarea>
                        
                <input type="number"
                        id="examDuration"
                        placeholder="Duration in minutes">
                        
                <input type="number"
                        id="examMarks"
                        placeholder="Total marks">
                        
                <input type="date"
                        id="examDueDate">
                        
                <textarea
                        id="examInstructions"
                        placeholder="Exam Instructions"></textarea>
                        
                <label class="upload-label">
                    Upload Thumbnail
                    <input type="file"
                    id="examThumbnail"
                    accept="image/*">
                </label>
                
                <label class="upload-label">
                    Upload Exam File
                    <input type="file"
                    id="examFile"
                    accept=".pdf,image/*">
                </label>
                
                <button id="publishExamBtn"
                        class="publish-btn">
                    Publish Exam
                </button>
            </div>

            <div class="teacher-exams-list">
                <h3>Published Exams</h3>

                <div id="teacherExamsContainer"></div>
            </div>
        </div>
    `;
    loadTeacherExams(classId);
    
    document.getElementById("publishExamBtn").onclick = () => {
        uploadExam(classId);
    };
}

async function loadTeacherExams(classId) {

    const container =
        document.getElementById("teacherExamsContainer");

    const q = query(
        collection(db, "examinations"),
        where("classId", "==", classId)
    );

    onSnapshot(q, (snapshot) => {

        container.innerHTML = "";

        if (snapshot.empty) {

            container.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">
                        quiz
                    </span>

                    <p>No exams published yet</p>
                </div>
            `;

            return;
        }

        snapshot.forEach(docSnap => {

            const exam = docSnap.data();
            const examId = docSnap.id;

            const card = document.createElement("div");

            card.className = "teacher-exam-card";

            card.innerHTML = `
                <div class="teacher-exam-info">

                    <h4>${exam.title}</h4>

                    <p>
                        ${exam.description || ""}
                    </p>

                </div>

                <div class="teacher-exam-actions">

                    <button class="view-subs-btn">
                        View Submissions
                    </button>

                    <button class="delete-exam-btn">
                        Delete Exam
                    </button>

                </div>
            `;

            card.querySelector(".view-subs-btn").onclick = () => {

                openExamSubmissions(examId, exam);

            };

            card.querySelector(".delete-exam-btn").onclick = async () => {

           const confirmDelete = confirm(
                "Delete this exam?"
            );

            if (!confirmDelete) return;

            await deleteDoc(
                doc(db, "examinations", examId)
            );

            showToast("Exam deleted");
        };

        container.appendChild(card);
        });
    });
}

async function uploadExam(classId) {
    const title = document.getElementById("examTitle").value;
    const description = document.getElementById("examDescription").value;
    const duration = document.getElementById("examDuration").value;
    const totalMarks = document.getElementById("examMarks").value;
    const dueDate = document.getElementById("examDueDate").value;
    const instructions = document.getElementById("examInstructions").value;
    const thumbFile = document.getElementById("examThumbnail").files[0];
    const examFile = document.getElementById("examFile").files[0];

    if (!title || !examFile) {
        return showToast("Please complete required fields", "warning");
    }

    let thumbnailUrl = "";
    if (!thumbFile) {
        const thumbRef = ref(
            storage,
            `exam_thumbnails/${Date.now()}_${thumbFile.name}`
        );
        await uploadBytes(thumbRef, thumbFile);

        thumbnailUrl = await getDownloadURL(thumbRef);
    }

    const examRef = ref(
        storage,
        `examinations/${Date.now}_${examFile.name}`
    );
    await uploadBytes(examRef, examFile);

    const examUrl = await getDownloadURL(examRef);
    const user = auth.currentUser;
    await addDoc(collection(db, "examinations"), {
        classId,
        title,
        description,
        duration,
        totalMarks,
        dueDate,
        instructions,
        thumbnail: thumbnailUrl,
        fileUrl: examUrl,
        fileType: examFile.type,
        teacherId: user.uid,
        createdAt: serverTimestamp()
    });
    showToast("Exam published successfully");
}

function openGradeModal(submissionId, submission) {

    const modal = document.createElement("div");

    modal.className = "grade-modal";

    modal.innerHTML = `

        <div class="grade-modal-overlay"></div>

        <div class="grade-modal-content">

            <div class="grade-modal-header">

                <h2>Grade Exam</h2>

                <button
                    class="close-grade-modal"
                    id="cancelGradeBtn"
                >
                    ✕
                </button>

            </div>

            <input
                type="number"
                id="gradeInput"
                placeholder="Enter Score %"
                value="${submission.grade || ""}"
            />

            <textarea
                id="feedbackInput"
                placeholder="Write feedback..."
            >${submission.teacherFeedback || ""}</textarea>

            <div class="grade-actions">

                <button
                    id="saveGradeBtn"
                    class="save-btn"
                >
                    Save Grade
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("cancelGradeBtn")
    .onclick = () => {
        modal.remove();
    };

    modal.querySelector(".grade-modal-overlay")
    .onclick = () => {
        modal.remove();
    };

    document.getElementById("saveGradeBtn")
    .onclick = async () => {

        const grade =
            document.getElementById("gradeInput").value;

        const feedback =
            document.getElementById("feedbackInput").value;

        await updateDoc(
            doc(db, "examSubmissions", submissionId),
            {
                grade: Number(grade),
                teacherFeedback: feedback,
                status: "graded",
                gradedAt: serverTimestamp()
            }
        );

        modal.remove();

        showToast("Grade saved");
    };
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
                            <p>Teacher Finance</p>

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
            return;
        }

        loadDashboardStudents(classIds);
        loadDashboardMaterials(classIds);
        initDashhboardInsights(teacherId);
        loadWeeklyChartData(classIds);

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
    weeklyChart.data.datasets[1].data = engagement;

    weeklyChart.update();
}


navItems.forEach(item => {
    item.addEventListener("click", async () => {

        const page = item.dataset.page;

        const hasAccess =
            await checkTeacherSubscriptionAccess();

        // allow subscription page always
        if (!hasAccess && page !== "subscription") {

            showToast(
                "Your subscription has expired",
                "error"
            );

            loadPage("subscription");

            return;
        }

        navItems.forEach(nav =>
            nav.classList.remove("active")
        );

        item.classList.add("active");

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

async function loadWalletOverview() {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const earningsRef = collection(db, "teacherEarnings");
    const withdrawRef = collection(db, "withdrawRequests");

    const earningsSnap = await getDocs(
        query(earningsRef, where("teacherId", "==", currentUser.uid))
    );

    const withdrawSnap = await getDocs(
        query(withdrawRef, where("teacherId", "==", currentUser.uid))
    );

    let totalEarnings = 0;
    let pending = 0;
    let withdrawn = 0;

    earningsSnap.forEach(docSnap => {
        const e = docSnap.data();
        totalEarnings += Number(e.amount || 0);
    });

    withdrawSnap.forEach(docSnap => {
        const w = docSnap.data();

        const amount = Number(w.amount || 0);

        if (w.status === "pending") {
            pending += amount;
        }

        if (w.status === "paid") {
            withdrawn += amount;
        }
    });

    const available = totalEarnings - pending - withdrawn;

    const balanceEl = document.getElementById("walletBalance");
    const pendingEl = document.getElementById("pendingBalance");
    const withdrawnEl = document.getElementById("withdrawnBalance");

    if (balanceEl) balanceEl.textContent = `TZS ${available.toLocaleString()}`;
    if (pendingEl) pendingEl.textContent = `TZS ${pending.toLocaleString()}`;
    if (withdrawnEl) withdrawnEl.textContent = `TZS ${withdrawn.toLocaleString()}`;

    const container = document.getElementById("teacherEarningsList");
    if (!container) return;

    container.innerHTML = "";

    if (earningsSnap.empty) {
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
        return;
    }

    earningsSnap.forEach(docSnap => {
        const e = docSnap.data();

        const item = document.createElement("div");

        item.className = "wallet-earning-item";

        item.innerHTML = `
            <div>
            
                <strong>
                    ${e.studentName}
                </strong>
                
                <p>
                    ${e.subscriptionPlan}
                </p>
                
            </div>
            
            <h4>
                +TZS ${Number(e.amount || 0).toLocaleString()}
            </h4>
        `;
        container.appendChild(item);
    });
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
                        verified by admin. Payments are done only on Thursday
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

    const earningsSnap = await getDocs(
        query(
        collection(db, "teacherEarnings"),
        where("teacherId", "==", currentUser.uid)
        )
    );

    let totalEarnings = 0;

    earningsSnap.forEach(docSnap => {
        totalEarnings += Number(
            docSnap.data().amount || 0
        );
    });

    const requestsSnap = await getDocs(
        query(
            collection(db, "withdrawRequests"),
            where("teacherId", "==", currentUser.uid)
        )
    );

    let pendingAmount = 0;
    let withdrawnAmount = 0;

    requestsSnap.forEach(docSnap => {
        const data = docSnap.data();

        if (data.status === "pending") {
            pendingAmount += Number(
                data.amount || 0
            );
        }

        if (data.status === "paid") {
            withdrawnAmount += Number(
                data.amount || 0
            );
        }
    });

    const availableBalance = totalEarnings - pendingAmount- withdrawnAmount;

    document.getElementById("withdrawAvailableBalance").textContent =
        `TZS ${availableBalance.toLocaleString()}`;

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

    document.getElementById("withdrawAmount").value = "";
    };
}

async function submitWithdrawRequest() {
    const currentUser = auth.currentUser;

    if (!currentUser) return;

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

    const fee = Math.floor(amount * 0.10);

    const receiveAmount = amount - fee;

    const earningsSnap = await getDocs(
        query(
            collection(db, "teacherEarnings"),
            where("teacherId", "==", currentUser.uid)
        )
    );

    let totalEarnings = 0;

    earningsSnap.forEach(docSnap => {
        totalEarnings += Number(docSnap.data().amount || 0);
    });

    const requestsSnap = await getDocs(
        query(
            collection(db, "withdrawRequests"),
            where("teacherId", "==", currentUser.uid)
        )
    );

    let pendingAmount = 0;
    let withdrawAmount = 0;

    requestsSnap.forEach(docSnap => {
        const data = docSnap.data();

        if (data.status === "pending") {
            pendingAmount += Number(data.amount || 0);
        }

        if (data.status === "paid") {
            withdrawAmount += Number(data.amount || 0);
        }
    });

    const usableBalance = totalEarnings - pendingAmount - withdrawAmount;

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

    if (amount > usableBalance ) {
        return showToast(
            `Insufficient balance. Available balance is TZS ${usableBalance.toLocaleString()}`,
            "error"
        );
    }

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

let currentHistoryPage = 1;

async function loadHistoryPage(page = 1) {
    currentHistoryPage = page;

    contentArea.innerHTML = `

        <div class="history-page">
        
            <div class="wallet-header-card">

            <button id="backWalletBtn">
                <span class="material-icons">
                    arrow_back
                </span>
            </button>
            
                <div>
                    <p class="mini-label">
                        Wallet Activity
                    </p>
                    
                    <h2>
                        Withdraw History
                    </h2>
                </div>
                
            </div>
            
            <div
                id="historyList"
                class="history-list"
            ></div>
            
            <div
                id="historyPagination"
                class="history-pagination"
            ></div>
            
        </div>
    
    `;
    document.getElementById("backWalletBtn").onclick = () => {
        loadPage("wallet");
    };
    
    renderWithdrawHistory(page);
}

async function renderWithdrawHistory(page = 1) {
    
    const historyList = document.getElementById("historyList");

    const pagination = document.getElementById("historyPagination");

    const currentUser = auth.currentUser;

    if (!currentUser) return;

    const q = query(
        collection(db, "withdrawRequests"),
        where("teacherId", "==", currentUser.uid)
    );

    const snap = await getDocs(q);

    let history = snap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
    }));

    history.sort((a, b) => {

        const aTime = a.createdAt?.seconds || 0;

        const bTime = b.createdAt?.seconds || 0;

        return bTime - aTime;
    });

    historyList.innerHTML = "";

    if (history.length === 0) {

        historyList.innerHTML = `
              
            <div class="history-empty">
            
                <span class="material-icons">swap_horiz</span>
                
                <h3>No Transactions Yet</h3>
                
                <p>
                    Your withdraw and payout history
                    will appear here
                </p>
                
            </div>
            
        `;

        pagination.innerHTML = "";

        return;
    }

    const perPage = 5;

    const start = (page - 1) * perPage;

    const end = start + perPage;

    const paginated = history.slice(start, end);

    paginated.forEach(item => {

        const amount = Number(item.amount || 0);

        const status = item.status || "pending";

        const fee = Number(item.fee || 0);

        const card = document.createElement("div");

        card.className = "history-card";

        card.innerHTML = `
        
            <div class="history-top">
            
                <div>
                
                    <h4>TZS ${amount.toLocaleString()}</h4>
                    
                    <small>Fee: TZS ${fee.toLocaleString()}</small>
                    
                </div>
                
                <span class="history-status ${status}">${status}</span>
                
            </div>
            
            <div class="history-bottom">
            
                <small>${item.teacherName || ""}</small>
                
                <small>${item.receiverNumber || ""}</small>
                
            </div>
            
        `;

        historyList.appendChild(card);
    });

    renderPagination(
        history.length,
        perPage,
        page
    );
}

function renderPagination(total, perPage, page) {

    const pagination = document.getElementById("historyPagination");

    const totalPages = Math.ceil(total / perPage);

    pagination.innerHTML = "";

    if (!totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");

        btn.className =
            i === page
            ? "page-btn active"
            : "page-btn";
        
        btn.textContent = i;

        btn.onclick = () => {
            loadHistoryPage(i);
        };

        pagination.appendChild(btn);
    }
}

async function loadSubscriptionPage() {
    const content = document.getElementById("contentArea");

    const user = auth.currentUser;

    const userSnap = await getDoc(doc(db, "users", user.uid));
    const teacher = userSnap.data();

    content.innerHTML = `
        <div class="subscription-page">

            <div class="sub-header">
                <h2>Subscription & Billing</h2>
                <p>
                    Manage your teaching subscription
                </p>
            </div>

            <div class="current-plan-card">

                <div class="plan-top">

                    <div>
                        <h3>
                            ${
                                teacher.subscriptionStatus === "active"
                                ? "Premium Plan"

                                : teacher.subscriptionStatus === "trial"
                                ? "Free Trial"

                                : "No Active Plan"
                            }
                        </h3>

                        <p>
                            ${
                                teacher.subscriptionStatus === "active"
                                ? "Subscription active"

                                : teacher.subscriptionStatus === "trial"
                                ? "Trial running"

                                : "Subscription required"
                            }
                        </p>
                    </div>

                    <span class="plan-status 
                        ${teacher.subscriptionStatus}">
                        ${teacher.subscriptionStatus || "inactive"}
                    </span>

                </div>

                <div class="plan-progress">

                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>

                    <small>
                        Ends:
                        ${formatDate(teacher.subscriptionEnd)}
                    </small>

                </div>

            </div>

            <div class="plans-section">

                <h3>Choose Plan</h3>

                <div class="plans-grid">

                    <div class="plan-card">
                        <h4>Starter</h4>
                        <h2>TZS 30,000</h2>
                        <p>30 Days Access</p>

                        <ul>
                            <li>Unlimited Classes</li>
                            <li>Unlimited Uploads</li>
                            <li>Student Management</li>
                        </ul>

                        <button class="select-plan-btn"
                            data-plan="starter"
                            data-price="30000">
                            Select Plan
                        </button>
                    </div>

                    <div class="plan-card premium">
                        <div class="popular-badge">
                            Most Popular
                        </div>

                        <h4>Professional</h4>
                        <h2>TZS 70,000</h2>
                        <p>90 Days Access</p>

                        <ul>
                            <li>Everything in Starter</li>
                            <li>Premium Visibility</li>
                            <li>Priority Support</li>
                        </ul>

                        <button class="select-plan-btn"
                            data-plan="professional"
                            data-price="70000">
                            Select Plan
                        </button>
                    </div>

                </div>

            </div>

            <div class="payment-section">

                <h3>Complete Payment</h3>

                <div class="payment-box">

                    <div class="payment-number-card">
                        <span class="material-icons">
                            account_balance_wallet
                        </span>

                        <div>
                            <h4>Send Payment To</h4>
                            <p>TuityHub Payments</p>
                            <strong>0617397356</strong>
                        </div>
                    </div>

                    <input type="text"
                        id="paymentName"
                        placeholder="Sender Full Name">

                    <input type="text"
                        id="paymentNumber"
                        placeholder="Sender Phone Number">

                    <input type="text"
                        id="paymentReference"
                        placeholder="Transaction Reference">

                    <button id="submitSubscriptionBtn">
                        Submit Payment
                    </button>

                </div>

            </div>

            <div class="billing-history">

                <div class="section-top">
                    <h3>Billing History</h3>
                </div>

                <div id="billingHistoryList"></div>

            </div>

        </div>
    `;

    setupPlanSelection();
    setupSubscriptionSubmission();
    loadBillingHistory();
}

function formatDate(timestamp) {

    if (!timestamp) return "Not set";

    // Firestore Timestamp support
    if (timestamp.toDate) {
        const date = timestamp.toDate();
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    // Normal JS date fallback
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "Invalid date";

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

let selectedPlan = null;
let selectedPrice = null;

function setupPlanSelection() {

    document.querySelectorAll(".select-plan-btn")
    .forEach(btn => {

        btn.onclick = () => {

            document.querySelectorAll(".plan-card")
            .forEach(c => c.classList.remove("selected"));

            btn.closest(".plan-card")
            .classList.add("selected");

            selectedPlan = btn.dataset.plan;
            selectedPrice = btn.dataset.price;
        };
    });
}

async function setupSubscriptionSubmission() {

    document.getElementById("submitSubscriptionBtn")
    .onclick = async () => {

        if (!selectedPlan) {
            return showToast(
                "Select subscription plan",
                "warning"
            );
        }

        const user = auth.currentUser;

        const paymentName =
            document.getElementById("paymentName").value;

        const paymentNumber =
            document.getElementById("paymentNumber").value;

        const paymentReference =
            document.getElementById("paymentReference").value;

        await addDoc(
            collection(db, "teacherSubscriptions"),
            {
                teacherId: user.uid,
                plan: selectedPlan,
                amount: Number(selectedPrice),
                paymentName,
                paymentNumber,
                paymentReference,
                status: "pending",
                createdAt: serverTimestamp()
            }
        );

        await updateDoc(doc(db, "users", user.uid), {
            subscriptionStatus: "pending"
        });

        showToast(
            "Payment submitted successfully"
        );
    };
}

async function loadBillingHistory() {

    const user = auth.currentUser;

    const list = document.getElementById("billingHistoryList");

    const q = query(
        collection(db, "teacherSubscriptions"),
        where("teacherId", "==", user.uid)
    );

    onSnapshot(q, (snapshot) => {

        list.innerHTML = "";

        if (snapshot.empty) {

            list.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">
                        receipt_long
                    </span>

                    <p>No billing history yet</p>
                </div>
            `;

            return;
        }

        snapshot.forEach(docSnap => {

            const sub = docSnap.data();

            const item = document.createElement("div");

            item.className = "billing-item";

            item.innerHTML = `
                <div>
                    <h4>${sub.plan}</h4>
                    <p>
                        ${formatDate(sub.createdAt)}
                    </p>
                </div>

                <div class="billing-right">
                    <strong>
                        TZS ${sub.amount}
                    </strong>

                    <span class="billing-status ${sub.status}">
                        ${sub.status}
                    </span>
                </div>
            `;

            list.appendChild(item);
        });
    });
}

(async () => {

    const hasAccess =
        await checkTeacherSubscriptionAccess();

    if (!hasAccess) {
        loadPage("subscription");
        return;
    }

    loadPage("subscription");

})();