import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc,
    addDoc,
    collection,
    serverTimestamp,
    Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

document.getElementById("signupBtn").addEventListener("click", async () => {
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const selectedRole = document.querySelector('input[name="role"]:checked').value;
    const accepted = document.getElementById("termsCheck").checked;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        let role = selectedRole;
        let status = "active";

        if (email === "32veenanthony@gmail.com") {
            role = "admin";
        }

        if (role === "teacher") {
            status = "active";
        }

        if (!accepted) {
            showMessage(
                "Please accept Terms & Conditions",
                "warning"
            );
            return;
        }
        
    const now = new Date();

    const freeEnd = new Date();

    freeEnd.setDate(freeEnd.getDate() + 7);

    await setDoc(doc(db, "users", user.uid), {
        username,
        email,
        role,
        status,

        createdAt: serverTimestamp(),

        subscriptionPlan: role === "teacher"
            ? "Free Access"
            : null,

        subscriptionPlanId: role === "teacher"
            ? "free_access"
            : null,

        subscriptionStatus: role === "teacher"
            ? "active"
            : null,

        accountAccess: role === "teacher"
            ? "active"
            : null,

        subscriptionStart: role === "teacher"
            ? Timestamp.fromDate(now)
            : null,

        subscriptionEnd: role === "teacher"
            ? Timestamp.fromDate(freeEnd)
            : null,

        hasActiveSubscription: role === "teacher"
            ? true
            : false
        });

        let message = "New student registered";

        if (role === "teacher") {
            message = "New teacher pending approval";
        }

        await addDoc(collection(db, "notifications"), {
            type: role === "teacher" ? "teacher_pending" : "new_user",
            message,
            userId: user.uid,
            read: false,
            createdAt: new Date()
        });

        if (status === "pending") {
            showMessage("Your account is pending admin approval.", "warning");
            window.location.href = "index.html";
        } else {
            redirectUser(role);
        }
    } catch (error) {
        showMessage(error.message, "error");
    }
});

function redirectUser(role) {
    if (role === "admin") window.location.href = "admin.html";
    if (role === "teacher") window.location.href = "teacher.html";
    if (role === "student") window.location.href = "student.html";
}

function showMessage(text, type = "success") {
    const box = document.getElementById("messageBox");
    box.textContent = text;
    box.className = `message show ${type}`;

    setTimeout(() => {
        box.classList.remove("show");
    }, 4000);
}

document.querySelectorAll(".role-card").forEach(card => {
    card.onclick = () => {
        document.querySelectorAll(".role-card")
        .forEach(c => c.classList.remove("active"));

        card.classList.add("active");
        card.querySelector("input").checked = true;
    };
});

const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
togglePassword.onclick = () => {
    const isPassword = passwordInput.type === "password";

    passwordInput.type = isPassword ? "text" : "password";

    togglePassword.textContent = 
        isPassword
        ? "visibility"
        : "visibility_off";
};