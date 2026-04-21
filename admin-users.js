import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore,
    doc,
    addDoc,
    onSnapshot,
    collection,
    deleteDoc,
    updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const db = getFirestore(app);

let allUsers = [];
let currentFilter = "all";
let searchQuery = "";

export function loadUsers() {
    const usersList = document.getElementById("usersList");

    onSnapshot(collection(db, "users"), (snapshot) => {
        allUsers = [];

        snapshot.forEach((docSnap) => {
            allUsers.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        renderUsers();
    });
};


function renderUsers() {
    const usersList = document.getElementById("usersList");
    usersList.innerHTML = "";

    let filtered = allUsers;

    if (currentFilter === "student") {
        filtered = filtered.filter(u => u.role === "student");
    } 

    if (currentFilter === "teacher") {
        filtered = filtered.filter(u => u.role === "teacher");
    } 

    if (currentFilter === "pending") {
        filtered = filtered.filter(u => u.status === "pending");
    } 

    if (searchQuery) {
        filtered = filtered.filter(u =>
            u.username.toLowerCase().includes(searchQuery) ||
            u.email.toLowerCase().includes(searchQuery) 
        );
    }

    filtered.forEach(user => {
        const card = document.createElement("div");
        card.className = "user-card";

        card.addEventListener("click", () => {
            openUserModal(user);
        })

        card.innerHTML = `
                <div class="user-top">
                    <div>
                        <div class="user-name">${user.username}</div>
                        <div class="user-role">${user.email}</div>
                    </div>
                    <div class="status ${user.status}">
                        ${user.status}
                    </div>
                </div>
                
                <div class="user-role">Role: ${user.role}</div>
                
            `;

            usersList.appendChild(card);
        });

        attachApproveEvents();
}

const modal = document.getElementById("userModal");
const closeModal = document.getElementById("closeModal");

const modalUsername = document.getElementById("modalUsername");
const modalEmail = document.getElementById("modalEmail");
const modalRole = document.getElementById("modalRole");
const modalStatus = document.getElementById("modalStatus");
const modalActions = document.getElementById("modalActions");

function openUserModal(user) {
    modalUsername.textContent = user.username;
    modalEmail.textContent = user.email;
    modalRole.textContent = user.role;
    modalStatus.textContent = user.status;

    modalActions.innerHTML = "";

    if (user.role === "teacher" && user.status === "pending") {
        const approveBtn = document.createElement("button");
        approveBtn.textContent = "Approve Teacher";

        approveBtn.addEventListener("click", async () => {
            await updateDoc(doc(db, "users", user.id), {
                status: "active"
            });

            modal.classList.remove("show");
        });

        modalActions.appendChild(approveBtn);
    }

    if (user.status !== "suspended") {
        const suspendBtn = document.createElement("button");
        suspendBtn.textContent = "Suspend User";
        suspendBtn.style.background = '#ff9800';

        suspendBtn.addEventListener("click", async () => {
            await updateDoc(doc(db, "users", user.id), {
                status: "suspended"
            });

            createNotification("user_suspended", "User has been suspended", user.id);

            modal.classList.remove("show");
        });

        modalActions.appendChild(suspendBtn);
    }

    if (user.status === "suspended") {
        const activateBtn = document.createElement("button");
        activateBtn.textContent = "Activate User";

        activateBtn.addEventListener("click", async () => {
            await updateDoc(doc(db, "users", user.id), {
                status: "active"
            });

            modal.classList.remove("show");
        });

        modalActions.appendChild(activateBtn);
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete User";
    deleteBtn.style.background = '#f44336';

    deleteBtn.addEventListener("click", async () => {
        const confirmDelete = confirm("Are you sure you want to delete this user?");
        if (!confirmDelete) return;

        await deleteDoc(doc(db, "users", user.id));

        createNotification("user_deleted", "User deleted", user.id);

        modal.classList.remove("show");
    });

    modalActions.appendChild(deleteBtn);

    modal.classList.add("show");
}

closeModal.addEventListener("click", () => {
    modal.classList.remove("show");
});

async function createNotification(type, message, userId) {
    await addDoc(collection(db, "notifications"), {
        type,
        message,
        userId,
        read: false,
        createdAt: new Date()
    });
}

export function initUserControls() {
    const searchInput = document.getElementById("searchInput");
    const filterBtns = document.querySelectorAll(".filter-btn");

    searchInput.addEventListener("input", (e) => {
        searchInput = e.target.value.toLowerCase();
        renderUsers();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {

            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            currentFilter = btn.getAttribute("data-filter");
            renderUsers();
        });
    });
}

function attachApproveEvents() {
    document.querySelectorAll(".approve-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const id = btn.getAttribute("data-id");

            await updateDoc(doc(db, "users", id), {
                status: "active"
            });

            await addDoc(collection(db, "notifications"), {
                type: "teacher_approved",
                message: "Teacher approved successfully",
                userId: id,
                read: false,
                createdAt: new Date()
            });
        });
    });
}