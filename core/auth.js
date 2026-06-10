import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;
let currentUserData = null;

export function initAuth(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    currentUser = user;

    const snap = await getDoc(doc(db, "users", user.uid));
    currentUserData = snap.exists() ? snap.data() : null;

    callback(user, currentUserData);
  });
}

export function getUser() {
  return currentUser;
}

export function getStudentIdentity() {
  const user = getUser();
  const data = getUserData();

  return {
    username: data?.username || "Student",
    email: user?.email || "",
    avatar: data?.avatar || "default.jpeg"
  };
}

export function getUserData() {
  return currentUserData;
}

export function logoutUser() {
  auth.signOut();
  window.location.href = "index.html";
}

export function getAuthUser(auth) {
    return new Promise((resolve, reject) => {

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();

            if (user) resolve(user);
            else reject("NO_USER");
        });
    });
}