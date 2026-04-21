import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

document.getElementById("loginBtn").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDoc = await getDoc(doc(db, "users", user.uid));
        const data = userDoc.data();

        if (data.status === "pending") {
            showMessage("Waiting for admin approval.", "warning");
            return;
        }

        if (data.status === "suspended") {
            showMessage("Your account has been suspended. Contact admin.", "error");
            return;
        }

        redirectUser(data.role);

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
    
    box.innerText = text;
    box.className = `message show ${type}`;

    setTimeout(() => {
        box.classList.remove("show");
    }, 4000);
}