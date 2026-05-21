import { db } from "../../core/firebase.js";
import { navigate } from "../../core/router.js";
import { openMaterialsFeed } from "./materialsFeed.js"
import { loadStudentExams } from "./examsFeed.js";
import { loadStudentPapers } from "./studentPapers.js";

import {
  collection,
  query,
  where,
  getDocs,  
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function openClassroomHome(classId) {
    
    const container = document.getElementById("contentArea");

    const classRef = doc(db, "classes", classId);

    const classSnap = await getDoc(classRef);

    if (!classSnap.exists()) return;

    const classData = classSnap.data();

    let teacher = {};

    if (classData.teacherId) {

        const teacherRef = doc(
            db,
            "users",
            classData.teacherId
        );

        const teacherSnap = await getDoc(teacherRef);

        if (teacherSnap.exists()) {
            teacher = teacherSnap.data();
        }
    }

    const image =
            classData.image ||
            getClassImage(classData.name)
        
    container.innerHTML = `
    
        <div class="classroom-home">
        
            <div class="classroom-banner">
            
                <img
                    src="${image}" class="banner-image"
                />
                
                <div class="banner-overlay">
                
                    <span
                        class="material-icons back-classroom"
                        id="backClassroom">
                        arrow_back_ios
                    </span>
                    
                    <div class="banner-content">
                    
                        <h1>${classData.name}</h1>
                        
                        <p>
                            ${classData.description || ""}
                        </p>
                        
                    </div>
                    
                </div>
                
            </div>
            
            <div class="classroom-body">
             
                <div class="teacher-card">
                
                    <img
                        src="${
                            teacher.photoURL || "default.jpeg"
                        }"
                        class="teacher-avatar-big"
                    />
                    
                    <div>
                    
                        <h3>
                            ${teacher.username || "Teacher"}
                        </h3>
                        
                        <small>
                            ${classData.subject || "Subject Teacher"}
                        </small>
                        
                    </div>
                    
                </div>
                
                <div class="progress-card">
                
                    <div class="progress-top">
                    
                        <h3>Course Progress</h3>
                        
                        <strong>35%</strong>
                        
                    </div>
                    
                    <div class="progress-bar">
                    
                        <div
                            class="progress-fill"
                            style="width:35%">
                        </div>
                        
                    </div>
                    
                    <small>
                        Keep learning to complete this course
                    </small>
                    
                </div>
                
                <div class="lesson-section">
                
                    <div
                        class="lesson-box materials-box"
                        id="openMaterials">

                        <div class="lesson-left">

                            <div class="lesson-icon">
                                <span class="material-icons">
                                    menu_book
                                </span>
                            </div>

                        <div>
                        
                            <h3>Materials</h3>
                        
                            <p id="materialsCount">
                                Loading...
                            </p>
                        
                        </div>

                    </div>

                    <div class="lesson-right">

                        <div class="lesson-progress-ring">
                         
                            <span id="materialsProgress">
                                0%
                            </span>
                        
                        </div>

                    </div>

                </div>

                <div
                    class="lesson-box exams-box"
                    id="openExams">

                    <div class="lesson-left">

                        <div class="lesson-icon">
                            <span class="material-icons">
                                quiz
                            </span>
                        </div>

                        <div>
                        
                            <h3>Exams</h3>
                        
                            <p id="examsCount">
                                Loading...
                            </p>
                        
                        </div>

                    </div>

                    <div class="lesson-right">

                        <div class="lesson-progress-ring">
                         
                            <span id="examsProgress">
                                0%
                            </span>
                        
                        </div>

                    </div>

                </div>
                
                <div
                    class="lesson-box papers-box"
                        id="openPapers">

                        <div class="lesson-left">

                            <div class="lesson-icon">
                                <span class="material-icons">
                                    history_edu
                                </span>
                            </div>

                        <div>
                        
                            <h3>Past Papers</h3>
                        
                            <p id="papersCount">
                                Loading...
                            </p>
                        
                        </div>

                    </div>

                    <div class="lesson-right">

                        <div class="lesson-progress-ring">
                         
                            <span id="papersProgress">
                                0%
                            </span>
                        
                        </div>

                    </div>

                </div>

            </div>
        
        `;

    document.getElementById(
        "backClassroom"
    ).onclick = () => {
        navigate("classes");
    }

    document.getElementById("openMaterials").onclick = () => {
        openMaterialsFeed(classId);
    }

    document.getElementById("openExams").onclick = () => {
        loadStudentExams(classId);
    }

    document.getElementById("openPapers").onclick = () => {
        loadStudentPapers(classId);
    }

    loadLessonStats(classId);
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

async function loadLessonStats(classId) {
    
    const materialsSnap = await getDocs(
        query(
            collection(db, "materials"),
            where("classId", "==", classId)
        )
    );

    const examsSnap = await getDocs(
        query(
            collection(db, "examinations"),
            where("classId", "==", classId)
        )
    );

    const papersSnap = await getDocs(
        query(
            collection(db, "pastpapers"),
            where("classId", "==", classId)
        )
    );

    document.getElementById("materialsCount").textContent = `${materialsSnap.size} learning resources`;
    document.getElementById("examsCount").textContent = `${examsSnap.size} available exams`;
    document.getElementById("papersCount").textContent = `${papersSnap.size} revision papers`;

    document.getElementById("materialsProgress").textContent = "35%";
    document.getElementById("examsProgress").textContent = "10%";
    document.getElementById("papersProgress").textContent = "0%";
}