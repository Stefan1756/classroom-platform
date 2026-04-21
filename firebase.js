import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyBqv4KMgqbE5FOloNmA56Sh0pzWVmR7ym0",
  authDomain: "health-app-c1d95.firebaseapp.com",
  projectId: "health-app-c1d95",
  storageBucket: "health-app-c1d95.firebasestorage.app",
  messagingSenderId: "884460034764",
  appId: "1:884460034764:web:e808c6bae4179414f04069",
  measurementId: "G-96PBEZFSD1"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

