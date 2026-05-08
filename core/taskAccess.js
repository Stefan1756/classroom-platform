import { db } from "./firebase.js";
import { getUser } from "./auth.js";
import {
  getDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function canAccessTasks() {
    const user = getUser();

    if (!user) return false;

    const userSnap = await getDoc(
        doc(db, "users", user.uid)
    );

    if (!userSnap.exists()) return false;

    const userData = userSnap.data();

    if (
        userData.subscriptionStatus !== "active"
    ) {
        return false;
    }

    return userData.subscriptionPlanId === "plan_1month";
}