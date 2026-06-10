import { db } from "../../core/firebase.js";
import {
    deleteUser,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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
                                help
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

            <div class="profile-section">
                <h4>Install App</h4>
                <button id="installBtn" class="install-btn hidden">
                    <span class="material-icons">download</span>
                    Install TuityHub
                </button>
            
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
        openChangePasswordPage();
    };

    document.getElementById("helpCenterBtn").onclick = () => {
        openHelpCenterPage();
    };

    document.getElementById("privacyBtn").onclick = () => {
        openPrivacyPolicyPage();
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
                <button class="edit-account-btn"
                            id="editAccountBtn">
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

    document.getElementById("editAccountBtn").onclick = () => {
        openEditAccountModal();
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

function openEditAccountModal() {
    const userData = getUserData();
    const modal = document.createElement("div");
    modal.className = "edit-account-modal";
    modal.innerHTML = `
        <div class="edit-account-content">
            <div class="edit-modal-header">
                <h2>Edit Profile</h2>
                <button id="closeEditModalBtn">
                    <span class="material-icons">
                        close
                    </span>
                </button>
            </div>
            
            <div class="edit-avatar-wrap">
                <label for="profileAvatarInput"
                    class="avatar-upload-label">
                    ${
                        userData?.avatar
                        ? `
                            <img src="${userData.avatar}"
                            id="avatarPreview"
                            class="edit-avatar-img" />
                        `
                        : `
                            <div id="avatarPreview"
                                class="edit-avatar-placeholder">
                                ${(userData?.username || "S")
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>
                        `
                    }
                    
                    <div class="camera-badge">
                        <span class="material-icons">
                            photo_camera
                        </span>
                    </div>
                </label>
                
                <input type="file"
                    id="profileAvatarInput"
                    accept="image/*"
                    hidden />
            </div>
            
            <div class="edit-group">
                <h4>Personal Details</h4>
                
                <input type="text"
                    id="editFullName"
                    placeholder="Full name"
                    value="${userData?.username || ""}" />
                    
                <input type="text"
                    id="editPhone"
                    placeholder="Phone number"
                    value="${userData?.phone || ""}" />
                    
                <input type="text"
                    id="editNationality"
                    placeholder="Nationality"
                    value="${userData?.nationality || "Tanzanian"}" />
            </div>
            
            <div class="edit-group">
                <h4>School Details</h4>
                
                <input type="text"
                    id="editSchoolName"
                    placeholder="School name"
                    value="${userData?.schoolName || ""}" />
                    
                <select id="editSchoolLevel">
                    <option value="">
                        Select School Level
                    </option>
                    
                    <option value="Primary">
                        Primary
                    </option>
                    
                    <option value="Secondary">
                        Secondary
                    </option>
                    
                    <option value="College">
                        College
                    </option>
                    
                    <option value="University">
                        University
                    </option>
                </select>
            </div>
            
            <button id="saveAccountChangesBtn"
                class="save-account-btn">
                Save Changes
            </button>
        </div>
    `;
    document.body.appendChild(modal);

    const levelSelect = document.getElementById("editSchoolLevel");
    levelSelect.value = userData?.schoolLevel || "";

    document.getElementById("closeEditModalBtn").onclick = () => {
        modal.remove();
    };

    document.getElementById("profileAvatarInput").onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const preview = document.getElementById("avatarPreview");
        const url = URL.createObjectURL(file);
        if (preview.tagName === "IMG") {
            preview.src = url;
        } else {
            preview.outerHTML = `
                <img src="${url}"
                    id="avatarPreview"
                    class="edit-avatar-img" />
            `;
        }
    };

    document.getElementById("saveAccountChangesBtn").onclick = async () => {
        const btn = document.getElementById("saveAccountChangesBtn");

        btn.innerHTML = "Saving...";
        btn.disabled = true;

        try {
            const user = getUser();
            const fullName = document.getElementById("editFullName").value.trim();
            const phone = document.getElementById("editPhone").value.trim();
            const nationality = document.getElementById("editNationality").value.trim();
            const schoolName = document.getElementById("editSchoolName").value.trim();
            const schoolLevel = document.getElementById("editSchoolLevel").value.trim();
            const avatarFile = document.getElementById("profileAvatarInput").files[0];
            let avatarUrl = userData?.avatar || "";
            if (avatarFile) {
                const storageRef = ref(
                    storage,
                    `avatars/${user.uid}_${Date.now()}`
                );
                await uploadBytes(
                    storageRef,
                    avatarFile
                );
                avatarUrl = await getDownloadURL(storageRef);
            }

            await updateDoc(
                doc(db, "users", user.uid),
                {
                    username: fullName,
                    phone,
                    nationality,
                    schoolName,
                    schoolLevel,
                    avatar: avatarUrl
                }
            );
            modal.remove();
            loadProfile();
        } catch (err) {
            console.error(err);
            showToast("Failed to update profile", "error");
        }
        btn.innerHTML = "Save Changes";
        btn.disabled = false;
    };
}

export function openChangePasswordPage() {
    const container = document.getElementById("contentArea");
    container.innerHTML = `
        <div class="change-password-page">
            <div class="change-password-header">
                <button id="backProfileBtn" class="back-details-btn">
                    <span class="material-icons">
                        arrow_back_ios
                    </span>
                </button>
                <h2>Change Password</h2>
            </div>
            
            <div class="password-card">
                <div class="password-input-group">
                    
                    <div class="password-input-box">
                        <input
                            type="password"
                            id="currentPassword"
                            placeholder="Current Password"
                        />
                        
                        <span
                            class="material-icons toggle-password"
                            data-target="currentPassword">
                            visibility_off
                        </span>
                    </div>
                </div>
                
                <div class="password-input-group">
                    
                    <div class="password-input-box">
                        <input
                            type="password"
                            id="newPassword"
                            placeholder="New Password"
                        />
                        
                        <span
                            class="material-icons toggle-password"
                            data-target="newPassword">
                            visibility_off
                        </span>
                    </div>
                </div>
                
                <div class="password-input-group">
                    
                    <div class="password-input-box">
                        <input
                            type="password"
                            id="confirmPassword"
                            placeholder="Confirm Password"
                        />
                        
                        <span
                            class="material-icons toggle-password"
                            data-target="confirmPassword">
                            visibility_off
                        </span>
                    </div>
                </div>
                
                <button id="changePasswordBtn"
                        class="change-password-btn">
                    Change Password
                </button>
            </div>
        </div>
    `;
    document.getElementById("backProfileBtn").onclick = () => {
        loadProfile();
    };

    initPasswordToggles();
    handlePasswordChange();
}

function initPasswordToggles() {
    document.querySelectorAll(".toggle-password").forEach(icon => {
        icon.onclick = () => {
            const target = document.getElementById(icon.dataset.target);
            
            if (target.type === "password") {
                target.type = "text";
                icon.textContent = "visibility";
            } else {
                target.type = "password";
                icon.textContent = "visibility_off";
            }
        };
    });
}

async function handlePasswordChange() {
    const btn = document.getElementById("changePasswordBtn");
    btn.onclick = async () => {
        const currentPassword = document.getElementById("currentPassword").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (
            !currentPassword ||
            !newPassword ||
            !confirmPassword
        ) {
            showToast("Fill all fields", "warning");
            return;
        }

        if (newPassword.length < 6) {
            showToast(
                "Password must be at least 6 characters",
                "warning"
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast(
                "Password do not match",
                "error"
            );
            return;
        }

        try {
            btn.innerHTML = "Updating...";
            btn.disabled = true;

            const user = getUser();

            const credential = 
                EmailAuthProvider.credential(
                    user.email,
                    currentPassword
                );

            await reauthenticateWithCredential(
                user,
                credential
            );

            await updatePassword(
                user,
                newPassword
            );

            showToast(
                "Password Updated successfully",
                "success"
            );

            setTimeout(() => {
                loadProfile();
            }, 1200);
        } catch (err) {
            console.error(err);
            showToast(
                "Current password is incorrect",
                "error"
            );
        }

        btn.innerHTML = "Change Password";
        btn.disabled = false;
    };
}

function openHelpCenterPage() {
    const container = document.getElementById("contentArea");
    container.innerHTML = `
        <div class="help-center-page">
            <div class="help-header">
                <button id="backHelpBtn"
                        class="back-details-btn">
                    <span class="material-icons">
                        arrow_back_ios
                    </span>
                </button>
                <h2>Help Center</h2>
            </div>
            
            <div class="help-hero">
                <div class="help-icon-wrap">
                    <span class="material-icons">
                        support_agent
                    </span>
                </div>

                <h3>How Can We Help?</h3>
                
                <p>
                    Get in touch with our support team
                    through any of the channels below.
                </p>
            </div>
            
            <div class="support-options">
                <div class="support-card"
                    id="callSupportBtn">
                    
                    <div class="support-icon call">
                        <span class="material-icons">
                            call
                        </span>
                    </div>
                    
                    <div class="support-info">
                        <h4>Call Us</h4>
                        <p>+255 617 397 356</p>
                    </div>
                    
                    <span class="material-icons arrow">
                        chevron_right
                    </span>
                </div>
                
                <div class="support-card"
                    id="emailSupportBtn">
                    
                    <div class="support-icon email">
                        <span class="material-icons">
                            mail
                        </span>
                    </div>
                    
                    <div class="support-info">
                        <h4>Email Us</h4>
                        <p>32veenanthony@gmail.com</p>
                    </div>
                    
                    <span class="material-icons arrow">
                        chevron_right
                    </span>
                </div>
                
                <div class="support-card"
                    id="whatsappSupportBtn">
                    
                    <div class="support-icon whatsapp">
                        <span class="material-icons">
                            chat
                        </span>
                    </div>
                    
                    <div class="support-info">
                        <h4>WhatsApp Us</h4>
                        <p>Chat with support team</p>
                    </div>
                    
                    <span class="material-icons arrow">
                        chevron_right
                    </span>
                </div>
            </div>
        </div>
    `;
    document.getElementById("backHelpBtn").onclick = () => {
        loadProfile();
    };

    document.getElementById("callSupportBtn").onclick = () => {
        window.location.href = "tel:+255617397356";
    };

    document.getElementById("emailSupportBtn").onclick = () => {
        window.location.href = "mailto:32veenanthony@gmail.com";
    };

    document.getElementById("whatsappSupportBtn").onclick = () => {
        window.open(
            "https://wa.me/255757584984",
            "_blank"
        );
    };
}

function openPrivacyPolicyPage() {
    const container = document.getElementById("contentArea");
    container.innerHTML = `
        <div class="privacy-page">
            <div class="privacy-header">
                <button id="backPrivacyBtn"
                        class="back-details-btn">
                    <span class="material-icons">
                        arrow_back_ios
                    </span>
                </button>
                
                <h2>Privacy & Terms</h2>
            </div>
            
            <div class="privacy-top-card">
                <div class="privacy-icon">
                    <span class="material-icons">
                        verified_user
                    </span>
                </div>
                
                <h3>Your Privacy Matters</h3>
                
                <p>
                    We are committed to protecting
                    your information and creating
                    a safe learning environments.
                </p>
            </div>
            
            <div class="policy-section">
                <h3>Privacy Policy</h3>
                <div class="policy-card">
                    <h4>1. Information We Collect</h4>
                    
                    <p>
                        We collect basic student
                        information including name,
                        email address, phone number,
                        school information and learning
                        activity to improve user
                        experience and educational
                        services.
                    </p>
                    
                    <h4>2. How We Use Your Data</h4>
                    
                    <p>
                        Your information is used to
                        manage your learning account,
                        improve course recommendations,
                        track classroom progress and 
                        provide customer support.
                    </p>
                    
                    <h4>3. Data Protection</h4>
                    
                    <p>
                        We use secure technologies and
                        encrypted systems to protect
                        your personal information from
                        unauthorized access or misuse.
                    </p>
                    
                    <h4>4. Third Party Services</h4>
                    
                    <p>
                        Our platform may integrate with 
                        trusted third-party services such
                        as payment providers, cloud
                        storage and communication tools.
                    </p>
                    
                    <h4>5. Student Responsibility</h4>
                    
                    <p>
                        Students are responsible for
                        keeping their login credentials
                        private and using the platform
                        respectfully.
                    </p>
                </div>
            </div>
            
            <div class="policy-section">
                <h3>Terms & Conditions</h3>
                <div class="policy-card">
                    <h4>1. Educational Purpose</h4>
                    
                    <p>
                        This platform is strictly created
                        for educational learning,
                        collaboration and academic
                        improvement.
                    </p>
                    
                    <h4>2. Classroom Access</h4>
                    
                    <p>
                        Students may only access
                        classrooms they have officially
                        enrolled in and been approved for.
                    </p>
                    
                    <h4>3. Content Ownership</h4>
                    
                    <p>
                        All uploaded materials, exams,
                        videos and educational content
                        belong to their respective
                        teachers or content owners.
                    </p>
                    
                    <h4>4. Prohibited Activities</h4>
                    
                    <p>
                        Users must not abuse the platform,
                        upload harmful content, share
                        illegal material or attempt
                        unauthorized system access.
                    </p>
                    
                    <h4>5. Account Suspension</h4>
                    
                    <p>
                        The system reserves the right to
                        suspend accounts involved in
                        miscound, cheating or platform
                        abuse.
                    </p>
                    
                    <h4>6. Updates To Policies</h4>
                    
                    <p>
                        Policies and terms may be updated
                        periodically to improve platform
                        security and services.
                    </p>
                </div>
            </div>
            
            <div class="policy-footer">
                Last Updated, May 2026
            </div>
        </div>
    `;
    document.getElementById("backPrivacyBtn").onclick = () => {
        loadProfile();
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