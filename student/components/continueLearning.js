import { db } from "../../core/firebase.js";
import { getUser } from "../../core/auth.js";
import { openClassroomHome } from "../pages/classroomHome.js";
import { 
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function renderContinueLearning(container) {
    const user = getUser();

    const enrollQ = query(
        collection(db, "enrollments"),
        where("studentId", "==", user.uid),
        where("status", "==", "approved")
    );

    const enrollSnap = await getDocs(enrollQ);

    container.innerHTML = `
        <div class="continue-section">
        
            <div class="section-title-row">
                <h3>Continue Learning</h3>
            </div>
            
            <div id="continueFeed"></div>
            
        </div>
    `;

    const feed = document.getElementById("continueFeed");

    if (enrollSnap.empty) {
        feed.innerHTML = `
            <div class="empty-feed">
                <span class="material-icons">school</span>
                <p>No active classes yet</p>
            </div>
        `;
        return;
    }

    const classes = [];

    for (const enrollDoc of enrollSnap.docs) {
        const enroll = enrollDoc.data();

        const classDoc = await getDoc(
            doc(db, "classes", enroll.classId)
        );

        if (!classDoc.exists()) continue;

        const cls = classDoc.data();

        classes.push({
            id: enroll.classId,
            name: cls.name,
            image: getFeedImage(cls.subject),
            progress: randomProgress(),
            lastAccessed: enroll.lastAccessed
        });
    }

    classes.sort((a, b) =>
        (b.lastAccessed?.seconds || 0) -
        (a.lastAccessed?.seconds || 0)
    );

    feed.innerHTML = classes.map(cls => `
        <div class="continue-card">
        
            <div class="continue-image">
                <img src="${cls.image}" />
            </div>
            
            <div class="continue-content">
            
                <h4>${cls.name}</h4>
                
                <small>
                    ${formatLastAccess(cls.lastAccessed)}
                </small>
                
                <div class="progress-bar">
                    <div class="progress-fill"
                        style="width:${cls.progress}%">
                    </div>
                </div>
                
                <div class="continue-footer">
                
                    <span>${cls.progress}% completed</span>
                    
                    <button class="continue-btn"
                            data-id="${cls.id}">
                        Continue
                    </button>
                    
                </div>
                
            </div>
            
        </div>
    `).join("");

    document.querySelectorAll(".continue-btn")
        .forEach(btn => {

            btn.onclick = () => {
                const classId = btn.dataset.id;

                openClassroomHome(classId);
            };
        });
}

function formatLastAccess(ts) {
    if (!ts) return "Recently opened";

    const date = ts.toDate();

    return date.toLocaleDateString();
}

function randomProgress() {
    return Math.floor(Math.random() * 70) + 20;
}

function getFeedImage(subject) {

    const images = {
        biology: "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=752&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        chemistry: "https://images.unsplash.com/photo-1694230155228-cdde50083573?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y2hlbWlzdHJ5fGVufDB8fDB8fHww",
        physics: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGh5c2ljc3xlbnwwfHwwfHx8MA%3D%3D",
        mathematics: "https://images.unsplash.com/photo-1676302440263-c6b4cea29567?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fG1hdGhlbWF0aWNzfGVufDB8fDB8fHww",
        economics: "https://plus.unsplash.com/premium_photo-1676673189320-76524a64684a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGVjb25vbWljc3xlbnwwfHwwfHx8MA%3D%3D",
        history: "https://plus.unsplash.com/premium_photo-1674727219372-4ba6644106bc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjF8fGhpc3Rvcnl8ZW58MHx8MHx8fDA%3D",
        commerce: "https://plus.unsplash.com/premium_photo-1683141154082-324d296f3c66?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8Y29tbWVyY2V8ZW58MHx8MHx8fDA%3D",
        geography: "https://images.unsplash.com/photo-1604351888999-9ea0a2851e61?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Z2VvZ3JhcGh5fGVufDB8fDB8fHww",
    };

    return images[subject?.toLowerCase()]
     || "https://plus.unsplash.com/premium_photo-1682125773446-259ce64f9dd7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8c2Nob29sfGVufDB8fDB8fHww";
}