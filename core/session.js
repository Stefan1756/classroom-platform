import{
    onSnapshot,
    doc,
    updateDoc,
    Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


export function requireUser() {
    const user = getUser();

    if (!user?.uid) {
        window.location.href = "index.html";
        throw new Error("No authenticated user");
    }

    return user;
}

export async function getCurrentUserDoc() {
    const user = requireUser();

    const snap = await getDoc(
        doc(db, "users", user.uid)
    );

    if (!snap.exists()) {
        throw new Error("User document not found");
    }

    return snap.data();
}

export function getSubscriptionState(user) {

    if (!user) {
        return {
            active: false,
            expired: true,
            status: "inactive",
            endDate: null
        };
    }

    let endDate = null;

    try {
        endDate = user.subscriptionEnd?.toDate?.() || null;
    } catch {
        endDate = null;
    }

    const now = new Date();

    const expired =
        !endDate ||
        now > endDate;

    const active =
        !expired &&
        user.accountAccess !== "suspended" &&
        user.status !== "suspended";

    return {
        active,
        expired,
        status: active ? "active" : "expired",
        endDate,
        plan: user.subscriptionPlan || "No Plan"
    };
}

export async function teacherHasAccess() {
    try {
        const user = await getCurrentUserDoc();
        return getSubscriptionState(user).active;
    } catch {
        return false;
    }
}


let cachedSubscription = null;

export function listenToSubscription(db, userId, callback) {

    const ref = doc(db, "users", userId);

    return onSnapshot(ref, (snap) => {

        if (!snap.exists()) return;

        const user = snap.data();
        const state = getSubscriptionState(user);

        cachedSubscription = state;

        callback(state, user);
    });
}

export function getCachedSubscription() {
    return cachedSubscription;
}

export async function enforceExpiry(db, userId, user) {

    const state = getSubscriptionState(user);

    if (!state.expired) return;

    await updateDoc(doc(db, "users", userId), {
        subscriptionStatus: "expired",
        accountAccess: "suspended",
        hasActiveSubscription: false
    });
}

export function canAccessApp(state) {
    return state?.active === true;
}