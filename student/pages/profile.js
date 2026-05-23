import { db } from "../../core/firebase.js";
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
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
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
        console.log("go to");
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