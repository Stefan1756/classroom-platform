// core/notifications.js
import { db } from "./firebase.js";
import { getUser } from "./auth.js";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function listenNotifications(callback) {
  const user = getUser();

  const q = query(
    collection(db, "notifications"),
    where("userId", "==", user.uid)
  );

  return onSnapshot(q, (snap) => {
    const notifications = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    callback(notifications);
  });
}

export async function markAsRead(id) {
  await updateDoc(doc(db, "notifications", id), {
    read: true 
  });
}

export async function createNotification(data) {
  await addDoc(collection(db, "notifications"), {
    ...data,
    read: false,
    createdAt: serverTimestamp()
  });
}
