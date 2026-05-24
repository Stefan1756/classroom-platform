import { db } from "../../core/firebase.js";
import { deleteUser } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { storage } from "../../core/firebase.js";
import { getUser, getUserData, logoutUser } from "../../core/auth.js";
import { 
    ref,
    uploadBytes,
    getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js"
import { navigate } from "../../core/router.js";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function loadProfile() {
    const container = document.getElementById("contentArea");
    const user = getUser();
    const userData = getUserData();
    const username = userData?.username || "Student";
    const email = user?.email || "No email";
    const avatar = userData?.avatar || "";
    const initial = username.charAt(0).toUpperCase();

    container.innerHTML = `
        <div class="modern-profile-page">
            <div class="profile-page-header">
                <p class="top-label">MY ACCOUNT</p>
                <h2>Account Details</h2>
            </div>
            
            <div class="profile-center">
                ${
                    avatar
                    ?  `
                        <img src="${avatar}"
                        class="profile-avatar" />
                    `
                    :   `
                        <div class="profile-avatar initials">
                            ${initial}
                        </div>
                    `
                }
                <h3>${username}</h3>
                <p>${email}</p>
            </div>
            
            <div class="profile-section">
                <h4>Individual</h4>
                <div class="profile-card active-status">
                    <div class="left">
                        <span class="material-icons">
                            verified
                        </span>
                        
                        <div>
                            <h5>Account Status</h5>
                        </div>
                    </div>
                    <span class="status-badge">
                        Active
                    </span>
                </div>
            </div>
            
            <div class="profile-section">
                <h4>Account</h4>
                <div class="profile-list">
                    <div class="profile-item"
                        id="accountDetailsBtn">
                        
                        <div class="left">
                            <span class="material-icons">
                                person
                            </span>
                            
                            <p>Account Details</p>
                        </div>
                        
                        <span class="material-icons arrow">
                            chevron_right
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="profile-section">
                <h4>Security</h4>
                <div class="profile-list">
                    <div class="profile-item"
                        id="changePasswordBtn">
                        
                        <div class="left">
                            <span class="material-icons">
                                lock
                            </span>
                            
                            <p>Change Password</p>
                        </div>
                        
                        <span class="material-icons arrow">
                            chevron_right
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="profile-section">
                <h4>Support & Legal</h4>
                <div class="profile-list">
                    <div class="profile-item"
                        id="helpCenterBtn">
                        
                        <div class="left">
                            <span class="material-icons">
                                support_agent
                            </span>
                            
                            <p>Help Center</p>
                        </div>
                        
                        <span class="material-icons arrow">
                            chevron_right
                        </span>
                    </div>

                    <div class="profile-item"
                        id="privacyBtn">
                        
                        <div class="left">
                            <span class="material-icons">
                                privacy_tip
                            </span>
                            
                            <p>Privacy Policy</p>
                        </div>
                        
                        <span class="material-icons arrow">
                            chevron_right
                        </span>
                    </div>

                </div>
            </div>
            
            <div class="profile-section">
                <h4>About</h4>
                <div class="profile-list">
                    <div class="profile-item no-arrow"
                        id="changePasswordBtn">
                        
                        <div class="left">
                            <span class="material-icons">
                                info
                            </span>
                            
                            <p>App Version</p>
                        </div>
                        
                        <span class="version-text">
                            v.1.0.0
                        </span>
                    </div>

                </div>
            </div>
            
            <div class="logout-wrap">
                <button id="logoutBtn"
                    class="logout-btn">
                    
                    <span class="material-icons">
                        logout
                    </span>
                    Logout
                </button>
            </div>
        </div>
    `;
    setupProfileActions();
}

function setupProfileActions() {
    document.getElementById("accountDetailsBtn").onclick = () => {
        openAccountDetailsPage();
    };

    document.getElementById("changePasswordBtn").onclick = () => {
        console.log("go to");
    };

    document.getElementById("helpCenterBtn").onclick = () => {
        console.log("go to");
    };

    document.getElementById("privacyBtn").onclick = () => {
        console.log("go to");
    };

    document.getElementById("logoutBtn")
    .onclick = async () => {
        await logoutUser();
        location.href = "index.html";
    };
}

function openAccountDetailsPage() {
    const container = document.getElementById("contentArea");
    const user = getUser();
    const userData = getUserData();
    const username = userData?.username || "Student";
    const joinedDate = user.metadata.creationTime
        ? new Date(user.metadata.creationTime)
            .toDateString()
        : "Unknown";

    const shortId = user.uid.slice(0, 6).toUpperCase();
    container.innerHTML = `
        <div class="account-details-page">
            <div class="details-header">
                <button class="back-details-btn"
                    id="backProfileBtn">
                    <span class="material-icons">
                        arrow_back_ios
                    </span>
                </button>
                
                <div>
                    <h2>Account Details</h2>
                </div>
            </div>
            
            <div class="account-main-card">
                <div class="account-main-left">
                    <div class="account-icon">
                        <span class="material-icons">
                            person
                        </span>
                    </div>
                    
                    <div>
                        <h3>Account Details</h3>
                        <p>Joined ${joinedDate}</p>
                    </div>
                </div>
                <button class="edit-account-btn">
                    Edit
                </button>
            </div>
            
            <div class="details-section">
                <h4>PERSONAL DETAILS</h4>
                <div class="details-card">
                    ${buildDetailRow(
                        "Full Name",
                        username
                    )}
                    
                    ${buildDetailRow(
                        "Student ID",
                        shortId
                    )}
                    
                    ${buildDetailRow(
                        "Phone Number",
                        userData?.phone || "Not set"
                    )}
                    
                    ${buildDetailRow(
                        "Email",
                        user.email || "No Email"
                    )}
                    
                    ${buildDetailRow(
                        "Nationality",
                        userData?.nationality || "Tanzanian"
                    )}
                </div>
            </div>
            
            <div class="details-section">
                <h4>SCHOOL DETAILS</h4>
                <div class="details-card">
                    ${buildDetailRow(
                        "School Name",
                        userData?.schoolName || "Not set"
                    )}
                    
                    ${buildDetailRow(
                        "School Level",
                        userData.schoolLevel || "Not set"
                    )}
                </div>
            </div>
            
            <div class="delete-account-wrap">
                <button class="delete-account-btn"
                    id="openDeleteModalBtn">
                    <span class="material-icons">
                        delete
                    </span>
                    Delete Account
                </button>
            </div>
        </div>
    `;
    document.getElementById("backProfileBtn").onclick = () => {
        loadProfile();
    };

    document.getElementById("openDeleteModalBtn").onclick = () => {
        openDeleteAccountModal(username);
    };
}

function buildDetailRow(label, value) {
    return `
        <div class="detail-row">
            <span class="detail-label">
                ${label}
            </span>
            
            <span class="detail-value">
                ${value}
            </span>
        </div>
    `;
}

function openDeleteAccountModal(username) {
    const modal = document.createElement("div");
    modal.className = "delete-modal";
    modal.innerHTML = `
        <div class="delete-modal-content">
            <div class="delete-icon-wrap">
                <span class="material-icons">
                    delete_forever
                </span>
            </div>
            
            <h2>Delete Account</h2>
            <p>
                This action is permanent.
                Type your full name to confirm deletion.
            </p>
            
            <input type="text"
                id="confirmDeleteInput"
                placeholder="Type full name" />
                
            <button id="confirmDeleteBtn"
                class="confirm-delete-btn"
                disabled>
                
                Permanently Delete
            </button>
            
            <button id="cancelDeleteBtn"
                class="cancel-delete-btn">
                Cancel
            </button>
        </div>
    `;
    document.body.appendChild(modal);
    const input = document.getElementById("confirmDeleteInput");
    const confirmBtn = document.getElementById("confirmDeleteBtn");
    input.oninput = () => {
        if (
            input.value.trim().toLowerCase() ===
            username.toLowerCase()
        ) {
            confirmBtn.disabled = false;
            confirmBtn.classList.add("active");
        } else {
            confirmBtn.disabled = true;
            confirmBtn.classList.remove("active");
        }
    };

    document.getElementById("cancelDeleteBtn").onclick = () => {
        modal.remove();
    };

    confirmBtn.onclick = async () => {
        try {
            const user = getUser();

            await deleteDoc(
                doc(db, "users", user.uid)
            );

            await deleteUser(user);

            location.href = "signup.html";
        } catch (err) {
            console.error(err);
            showToast(
                "Please login again before deleting account",
                "warning"
            );
        }
    };
}

function showToast(message, type = "success") {
    const old = 
        document.querySelector(".custom-toast");

    if (old) old.remove();

    const toast = 
        document.createElement("div");

    toast.className = 
        `custom-toast ${type}`;

    toast.innerHTML = `
        <span class="material-icons">
            ${
                type === "success"
                ? "check_circle"

                : type === "error"
                ? "error"

                : "info"
            }
        </span>
        
        <p>${message}</p>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("show");
    }, 50);

    setTimeout(() => {
        toast.classList.remove("show");

        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000)
}