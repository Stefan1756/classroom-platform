import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        let role = "student";
        let status = "active";

        if (email === "32veenanthony@gmail.com") {
            role = "admin";
        }

        if (email.includes("teacher")) {
            role = "teacher";
            status = "pending";
        }

        await setDoc(doc(db, "users", user.uid), {
            username,
            email,
            role,
            status,
            createdAt: serverTimestamp()
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