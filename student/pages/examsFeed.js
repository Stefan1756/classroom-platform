import { db, storage } from "../../core/firebase.js";
import { getUser } from "../../core/auth.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

import {
  collection,
  query,
  where,
  getDocs,  
  doc,
  addDoc,
  onSnapshot,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { goBack } from "../../core/router.js";

export async function loadStudentExams(classId) {
    const container = document.getElementById("contentArea");
    const userId = getUser().uid;

    const examQuery = query(
        collection(db, "examinations"),
        where("classId", "==", classId)
    );

    onSnapshot(examQuery, async (snapshot) => {
        container.innerHTML = "";

        if (snapshot.empty) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">quiz</span>
                    <h3>No Exams Yet</h3>
                    <p>Teacher has not uploaded exams yet</p>
                </div>
            `;
            return;
        }

        for (const docSnap of snapshot.docs) {
            const exam = docSnap.data();
            const examId = docSnap.id;

            // 🔥 STEP 1: get student's submission for this exam
            const subQuery = query(
                collection(db, "examSubmissions"),
                where("examId", "==", examId),
                where("studentId", "==", userId)
            );

            const subSnap = await getDocs(subQuery);

            let submission = null;
            if (!subSnap.empty) {
                submission = subSnap.docs[0].data();
            }

            let statusText = "Not Started";
            let statusClass = "not-started";
            let gradeBlock = "";

            if (submission) {
                if (submission.status === "graded") {
                    statusText = "Graded";
                    statusClass = "graded";

                    gradeBlock = `
                        <div class="exam-grade-box">
                            <strong>Grade: ${submission.grade || 0}%</strong>
                            <p>${submission.teacherFeedback || "No feedback"}</p>
                        </div>
                    `;
                } else {
                    statusText = "Pending Review";
                    statusClass = "pending";
                }
            }

            const card = document.createElement("div");
            card.className = "modern-exam-card";

            card.innerHTML = `
                <div class="exam-banner">
                    <img src="${exam.thumbnail || 'exam.jpeg'}">
                </div>

                <div class="exam-body">
                    <div class="exam-top">
                        <span class="exam-badge">
                            ${exam.duration || 60} mins
                        </span>

                        <span class="exam-status ${statusClass}">
                            ${statusText}
                        </span>
                    </div>

                    <h3>${exam.title}</h3>
                    <p>${exam.description || "Prepare carefully before attempting."}</p>

                    <div class="exam-meta">
                        <div>
                            <span class="material-icons">schedule</span>
                            <small>${exam.duration || 60} mins</small>
                        </div>

                        <div>
                            <span class="material-icons">workspace_premium</span>
                            <small>${exam.totalMarks || 100} Marks</small>
                        </div>
                    </div>

                    ${gradeBlock}

                    <button class="start-exam-btn">
                        ${submission ? "View Exam" : "Start Exam"}
                    </button>
                </div>
            `;

            card.querySelector(".start-exam-btn").onclick = () => {
                openStudentExam(examId, exam);
            };

            container.appendChild(card);
        }
    });
}

function openStudentExam(examId, exam) {
    const content = document.getElementById("contentArea");
    
    content.innerHTML = `
        <div class="student-exam-page">
            <div class="exam-top-banner">
                <button id="backBtn" class="back-btn">
                    <span class="material-icons">arrow_back_ios</span>
                </button>
                
                <h2>${exam.title}</h2>
            </div>
            
            <div class="exam-content-card">
                <div class="exam-meta">
                    <div class="exam-meta-item">
                        <span class="material-icons">calendar_month</span>
                        <p>${exam.dueDate || "No Date"}</p>
                    </div>

                    <div class="exam-meta-item">
                        <span class="material-icons">timer</span>
                        <p>${exam.duration || "Unlimited Time"}</p>
                    </div>
                </div>
            
                <div class="exam-section">
                    <h3>Instructions</h3>
                    <p class="exam-instructions">
                        ${exam.instructions || "Read all questions carefully before answering."}
                    </p>
                </div>
            
                <div class="exam-file-box">
                    <span class="material-icons exam-file-icon">description</span>

                    <div>
                        <h4>Exam File</h4>
                        <p>Download and answer the questions</p>
                    </div>
                </div>

                <a href="${exam.fileUrl}"
                    target="_blank"
                    class="download-exam-btn">

                    <span class="material-icons">download</span>Open Exam
                </a>

                <div class="submit-section">
                    <h3>Submit Your Answer</h3><br>
                    <p>File in PDF format only</p>

                    <input type="file"
                            id="examPdfInput"
                            accept=".pdf" />

                    <button id="submitExamBtn"
                            class="submit-exam-btn">
                        Confirm Submission
                    </button>
                </div>
            </div>
        </div>
    `;
    document.getElementById("backBtn").onclick = () => {
        goBack();
    };

    document.getElementById("submitExamBtn").onclick = () => {
        console.log("submitting:", examId);
        
        submitStudentExam(examId);
    }
}

async function submitStudentExam(examId) {
    const fileInput = document.getElementById("examPdfInput");
    const file = fileInput.files[0];
    if (!file) {
        showToast("Please upload PDF", "warning");
        return;
    }

    const btn = document.getElementById("submitExamBtn");

    btn.innerHTML = "Submitting...";
    btn.disabled = true;

    try {
        const storageRef = ref(
            storage,
            `examSubmissions/${Date.now()}_${file.name}`
        );
        await uploadBytes(storageRef, file);
        const fileUrl = await getDownloadURL(storageRef);
        await addDoc(
            collection(db, "examSubmissions"),
            {
                examId: examId,
                studentId: getUser().uid,
                fileUrl,
                submittedAt: serverTimestamp(),
                status: "Pending",
                grade: null,
                teacherFeedback: ""
            }
        );
        btn.innerHTML = "Submitted";
        btn.classList.add("submitted");
        showToast("Exam submitted successfully");
    } catch (err) {
        console.error(err);
        showToast("Failed to submit exam", "error");
        btn.innerHTML = "Confirm Submission";
        btn.disabled = false;
    }
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