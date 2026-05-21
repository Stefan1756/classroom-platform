import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

export async function ensureFreeTrial(user) {
  
  const userRef = doc(db, "users", user.uid);

  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return;

  const userData = userSnap.data();

  if (userData.role !== "student") return;

  if (user.subscriptionStatus === "active") return;

  const now = new Date();

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 7);

  await setDoc(userRef, {
    subscriptionPlan: "Free Trial",
    subscriptionPlanId: "free_trial",
    subscriptionStatus: "active",
    classLimit: -1,
    subscriptionStart: Timestamp.fromDate(now),
    subscriptionEnd: Timestamp.fromDate(endDate),
    hasActiveSubscription: true
  }, { merge: true });

  console.log("Free trial activated");
  
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

export function logout() {
  auth.signOut();
  window.location.href = "index.html";
}