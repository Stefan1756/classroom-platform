import { db } from "../../../core/firebase.js";
import { getUser } from "../../../core/auth.js";
import { openClassroomHome } from "../classroomHome.js";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function renderMyClassroomTab() {
    
    const container = document.getElementById("classesTabContent");

    container.innerHTML = `
        <div class="my-classroom-list"
            id="myClassroomList">
        </div>
    `;

    const list = document.getElementById("myClassroomList")

    const q = query(
        collection(db, "enrollments"),
        where("studentId", "==", getUser().uid),
        where("status", "==", "approved")
    );

    onSnapshot(q, async (snapshot) => {

        if (snapshot.empty) {

            list.innerHTML = `
                <div class="empty-state">

                    <span class="material-icons">
                        auto_stories
                    </span>
                
                    <p>
                        You havent't enrolled in any class yet           
                    </p>

                </div>
            `;

            return;
        }

        for (const enrollDoc of snapshot.docs) {

        const enrollData = enrollDoc.data();

        const classRef = doc(
            db,
            "classes",
            enrollData.classId
        );

        const classSnap = await getDoc(classRef);

        if (!classSnap.exists()) continue;

        const classData = classSnap.data();

        const card = document.createElement("div");

        card.className = "my-classroom-card";

        const image =
            classData.image ||
            getClassImage(classData.name)

        card.innerHTML = `
            <div class="my-class-image">
                <img src="${image}" />
            </div>
            
            <div class="my-class-content">
            
                <h3>${classData.name}</h3>
                
                <p>
                    ${classData.description || ""}
                </p>
                
                <button class="continue-learning-btn">
                    Continue Learning
                </button>
                
            </div>
        `;

        card.querySelector(
            ".continue-learning-btn"
        ).onclick = () => {
            openClassroomHome(
                enrollData.classId
            );
        };

        list.appendChild(card);
    }      
});

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