import { db } from "./firebase.js";
import { getUser } from "./auth.js";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function canAccessClass(classId) {
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

    let endDate;

    if (userData.subscriptionEnd?.toDate) {
        endDate = userData.subscriptionEnd.toDate();
    } else {
        endDate = new Date(userData.subscriptionEnd);
    }

    if (endDate <= new Date()) {
        return false;
    }

    if (userData.classLimit === -1) {
        return true;
    }

    const enrollmentsSnap = await getDocs(
        query(
            collection(db, "enrollments"),
            where("studentId", "==", user.uid),
            where("status", "==", "approved")
        )
    );

    const allowedClasses = enrollmentsSnap.docs
        .slice(0, userData.classLimit)
        .map(doc => doc.data().classId);

    return allowedClasses.includes(classId);
}