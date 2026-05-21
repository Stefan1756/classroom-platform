import { db } from "../../../core/firebase.js";

import { getUser, getUserData } from "../../../core/auth.js";

import { showToast } from "../../../core/ui.js";

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { navigate } from "../../../core/router.js";

export async function renderAllClassesTab() {

    const container = document.getElementById("classesTabContent");

    container.innerHTML = `
        <div class="classes-grid" id="allClassesGrid">
        </div>
    `;

    const grid = document.getElementById("allClassesGrid");

    const snap = await getDocs(collection(db, "classes"));

    if (snap.empty) {
        grid.innerHTML = `
            <div class="empty-state">
                <span class="material-icons">
                    school
                </span>
                
                <p>No classes available yet</p>
            </div>
        `;

        return;
    }

    for (const docSnap of snap.docs) {
        const classData = docSnap.data();
        const classId = docSnap.id;

        const user = getUser();

       const enrollQuery = query(
            collection(db, "enrollments"),
            where("studentId", "==", user.uid),
            where("classId", "==", classId)
        );

        const enrollSnap = await getDocs(enrollQuery);

        let buttonText = "Enroll Now";
        let buttonClass = "enroll-btn";

        if (!enrollSnap.empty) {

            const enrollData = enrollSnap.docs[0].data();

            if (enrollData.status === "pending") {
                buttonText = "Pending";
                buttonClass += " pending";
            }

            if (enrollData.status === "approved") {
                continue;
            }
        }

        const image =
            classData.image ||
            getClassImage(classData.name)
        const card = document.createElement("div");

        card.className = "modern-class-card";

        card.innerHTML = `
            <div class="class-banner">
                <img src="${image}" />
            </div>
            
            <div class="class-body">
            
                <h3>${classData.name}</h3>
                
                <p>
                    ${classData.description || "No description"}
                </p>
                
                <button class="${buttonClass}">
                    ${buttonText}
                </button>
                
            </div>
        `;

        card.querySelector(".enroll-btn").onclick = () => {

            if (buttonText === "Pending") return;

            if (buttonText === "Continue Learning") {
                loadMyClassroom();
                return;
            }
                openEnrollmentPage(
                    classData,
                    classId
                );
            };

            grid.appendChild(card);
    };
}

function getClassImage(name = "") {

    const subject = name.toLowerCase();

    if (subject.includes("biology")) {
        return "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=752&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
    }
    if (subject.includes("classification")) {
        return "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=752&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
    }
    if (subject.includes("chemistry")) {
        return "https://images.unsplash.com/photo-1694230155228-cdde50083573?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y2hlbWlzdHJ5fGVufDB8fDB8fHww";
    }
    if (subject.includes("bonding")) {
        return "https://images.unsplash.com/photo-1694230155228-cdde50083573?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y2hlbWlzdHJ5fGVufDB8fDB8fHww";
    }
    if (subject.includes("physics")) {
        return "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGh5c2ljc3xlbnwwfHwwfHx8MA%3D%3D";
    }
    if (subject.includes("mathematics")) { 
        return "https://images.unsplash.com/photo-1676302440263-c6b4cea29567?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fG1hdGhlbWF0aWNzfGVufDB8fDB8fHww";
    }
    if (subject.includes("algebra")) { 
        return "https://images.unsplash.com/photo-1676302440263-c6b4cea29567?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fG1hdGhlbWF0aWNzfGVufDB8fDB8fHww";
    }
    if (subject.includes("economics")) { 
       return "https://plus.unsplash.com/premium_photo-1676673189320-76524a64684a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGVjb25vbWljc3xlbnwwfHwwfHx8MA%3D%3D";
    }
    if (subject.includes("history")) {
       return "https://plus.unsplash.com/premium_photo-1674727219372-4ba6644106bc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjF8fGhpc3Rvcnl8ZW58MHx8MHx8fDA%3D";
    }
    if (subject.includes("commerce")) {
        return "https://plus.unsplash.com/premium_photo-1683141154082-324d296f3c66?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8Y29tbWVyY2V8ZW58MHx8MHx8fDA%3D";
    }
    if (subject.includes("geography")) {
        return "https://images.unsplash.com/photo-1604351888999-9ea0a2851e61?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Z2VvZ3JhcGh5fGVufDB8fDB8fHww";
    };

    return "https://plus.unsplash.com/premium_photo-1682125773446-259ce64f9dd7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8c2Nob29sfGVufDB8fDB8fHww";
}

export async function openEnrollmentPage(classData, classId) {
    const content = document.getElementById("contentArea");

    const teacherRef = doc(db,"users",classData.teacherId);

    const teacherSnap = await getDoc(teacherRef);

    const teacher = teacherSnap.exists()
        ? teacherSnap.data()
        : {}

    const image =
        classData.image ||
        getSubjectImage(classData.name)
    content.innerHTML = `
        <div class="payment-page">
        
            <div class="payment-header">

                <span class="material-icons back-btn"
                    id="backToDetails">
                    arrow_back_ios
                </span>

                <h3>Course Payment</h3>

            </div>

            <div class="payment-card">
               
                <div class="payment-class">
            
                    <img src="${image}" />
            
                    <div> 
                        <h2>${classData.name}</h2>
                        <h3>Mwalimu ${teacher.username || ""}</h3>
                    </div>
                
                </div>

                <div class="payment-section">

                    <h4>Student Details</h4>

                    <input
                        type="text"
                        id="studentName"
                        value="${getUserData()?.username || ""}"
                        placeholder="Student Name"
                    />

                    <input
                        type="text"
                        id="studentNumber"
                        placeholder="Your Payment Number"
                    />
                
                </div>

                <div class="payment-section">

                    <h4>Teacher Payment Info</h4>

                    <div class="payment-info-box">
                        <strong>${teacher.username || "Mwalimu"}</strong>
                        <small>${teacher.number || "No number"}</small>
                    </div>

                </div>
                
                <div class="payment-section">
                    
                    <h4>Course Price</h4>

                    <div class="price-box">
                            Tsh ${classData.price || 0}
                    </div>
                    
                </div>
                
                <div class="payment-instruction">

                    Send payment using the teacher number above.
                    After payment click confirm payment below.
                    Your enrollment will remain pending until approved.

                </div>
                
                <button class="confirm-payment-btn"
                    id="confirmPaymentBtn">

                    Confirm Payment

                </button>
                
            </div>
            
        </div>
        
    `;

    document.getElementById("backToDetails").onclick = () => {
        navigate("classes");
    };

    handlePaymentConfirmation(classData, classId, teacher);
}

async function handlePaymentConfirmation(classData, classId, teacher) {
    const btn = document.getElementById("confirmPaymentBtn");

    btn.onclick = async () => {

        const studentNumber = document.getElementById("studentNumber").value;

        if (!studentNumber) {
            showToast("Enter your payment number", "warning");
            return;
        }

        btn.innerText = "Processing...";
        btn.disabled = true;

        try {
            await addDoc(collection(db, "enrollments"), {
                classId,
                teacherId: classData.teacherId,
                studentId: getUser().uid,
                studentName: getUserData()?.username || "",
                studentPaymentNumber: studentNumber,
                teacherPaymentNumber: teacher.number || "",
                amount: classData.price || 0,
                status: "pending",
                createdAt: serverTimestamp()
            });

            showToast("Payment submitted successfully");

            navigate("classes")
        } catch (err) {
            console.error(err);
            showToast("Failed to submit payment", "error");

            btn.disabled = false;
            btn.innerText = "Confirm Payment";
        }
    };
}

function getSubjectImage(name = "") {

    const subject = name.toLowerCase();

    if (subject.includes("biology")) {
        return "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=752&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
    }
    if (subject.includes("classification")) {
        return "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=752&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
    }
    if (subject.includes("chemistry")) {
        return "https://images.unsplash.com/photo-1694230155228-cdde50083573?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y2hlbWlzdHJ5fGVufDB8fDB8fHww";
    }
    if (subject.includes("bonding")) {
        return "https://images.unsplash.com/photo-1694230155228-cdde50083573?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y2hlbWlzdHJ5fGVufDB8fDB8fHww";
    }
    if (subject.includes("physics")) {
        return "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGh5c2ljc3xlbnwwfHwwfHx8MA%3D%3D";
    }
    if (subject.includes("mathematics")) { 
        return "https://images.unsplash.com/photo-1676302440263-c6b4cea29567?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fG1hdGhlbWF0aWNzfGVufDB8fDB8fHww";
    }
    if (subject.includes("algebra")) { 
        return "https://images.unsplash.com/photo-1676302440263-c6b4cea29567?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fG1hdGhlbWF0aWNzfGVufDB8fDB8fHww";
    }
    if (subject.includes("economics")) { 
       return "https://plus.unsplash.com/premium_photo-1676673189320-76524a64684a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGVjb25vbWljc3xlbnwwfHwwfHx8MA%3D%3D";
    }
    if (subject.includes("history")) {
       return "https://plus.unsplash.com/premium_photo-1674727219372-4ba6644106bc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjF8fGhpc3Rvcnl8ZW58MHx8MHx8fDA%3D";
    }
    if (subject.includes("commerce")) {
        return "https://plus.unsplash.com/premium_photo-1683141154082-324d296f3c66?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8Y29tbWVyY2V8ZW58MHx8MHx8fDA%3D";
    }
    if (subject.includes("geography")) {
        return "https://images.unsplash.com/photo-1604351888999-9ea0a2851e61?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Z2VvZ3JhcGh5fGVufDB8fDB8fHww";
    };

    return "https://plus.unsplash.com/premium_photo-1682125773446-259ce64f9dd7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8c2Nob29sfGVufDB8fDB8fHww";
}