import { db } from "./firebase.js";
import { getUser } from "./auth.js";
import { 
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const PUBLIC_PAGES = [
    "subscription",
    "payment"
];

export async function checkPageAccess(page) {
    
    if (PUBLIC_PAGES.includes(page)) {
        return true;
    }

    const user = getUser();

    if (!user) return false;

    const userSnap = await getDoc(
        doc(db, "users", user.uid)
    );

    if (!userSnap.exists()) return false;

    const userData = userSnap.data();

    if (!userData.subscriptionStatus) {
        return false;
    }

    if (
        userData.subscriptionStatus === "expired"
    ) {
        return false;
    }

    if (
        userData.subscriptionStatus === "pending"
    ) {
        return false;
    }

    if (
        userData.subscriptionStatus === "rejected"
    ) {
        return false;
    }

    if (
        userData.subscriptionStatus === "active"
    ) {

        let endDate;

        if (userData.subscriptionEnd?.toDate) {
            endDate = userData.subscriptionEnd.toDate();
        } else {
            endDate = new Date(userData.subscriptionEnd);
        }

        if (endDate <= new Date()) {

            return false;
        }

        return true;
    }

    return false;
}