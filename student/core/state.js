let currentUser = null;

export function setUser(user) {
    currentUser = user;
}

export function getUser() {
    return currentUser;
}