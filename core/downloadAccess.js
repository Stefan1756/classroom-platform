import { db } from "./firebase.js";
import { getUser } from "./auth.js";
import {
  doc,
  getDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function canDownloadResource() {
    
    const user = getUser();

    if (!user) {
        return {
            allowed: false,
            message: "Login required"
        };
    }

    const userRef = doc(db, "users", user.uid);

    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        return {
            allowed: false,
            message: "User not found"
        };
    }

    const userData = userSnap.data();

    if (
        userData.subscriptionStatus !== "active"
    ) {
        return {
            allowed: false,
            message: "Subscription expired"
        };
    }

    if (userData.downloadLimit == -1) {
        return {
            allowed: true
        };
    }

    const used = userData.downloadUsed || 0;

    if (used >= userData.downloadLimit) {
        
        return {
            allowed: false,
            message: "Your 5 downloads limit is finished. Upgrade to 1 Month Plan for unlimited downloads."
        };
    }

    return {
        allowed: true
    };
}

export async function registerDownload() {
    
    const user = getUser();

    if (!user) return;

    const userRef = doc(db, "users", user.uid);

    await updateDoc(userRef, {
        downloadUsed: increment(1)
    });
}