import { db } from "../../core/firebase.js";
import { getUser } from "../../core/auth.js";
import {
  collection,
  query,
  where,
  getDocs,  
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { openMaterialViewer } from "./materialViewer.js";
import { openClassroomHome } from "./classroomHome.js";

export async function openMaterialsFeed(classId) {
    const container = document.getElementById("contentArea");
    container.innerHTML = `
        <div class="materials-feed">
            <div class="materials-header">
                <span class="material-icons" id="backMaterials">arrow_back_ios</span>
                <h2>Learning Materials</h2>
            </div>
            
            <div id="materialsList"></div>
        </div>
    `;
    document.getElementById("backMaterials").onclick = () => {
        openClassroomHome(classId);
    };
    loadMaterials(classId);
}

async function loadMaterials(classId) {
    const list = document.getElementById("materialsList");
    const q = query(collection(
        db, "materials"),
        where("classId", "==", classId)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
        list.innerHTML = `
            <div class="empty-state">
                <span class="material-icons">menu_book</span>
                <p>No materials uploaded yet</p>
            </div>
        `;
        return;
    }
    for (const materialDoc of snap.docs) {
        const material = materialDoc.data();
        const progressRef = doc(db, "lessonProgress", `${getUser().uid}_${materialDoc.id}`);
        const progressSnap = await getDoc(progressRef);
        const completed = progressSnap.exists();
        const card = document.createElement("div");
        card.className = "material-feed-card";
        card.innerHTML = `
            <div class="feed-left">
                <div class="feed-icon">
                    <span class="material-icons">
                        ${
                            material.fileType?.startsWith("video")
                            ? "play_circle"

                            : material.fileType?.includes("pdf")
                            ? "picture_as_pdf"

                            : "image"
                        }
                    </span>
                </div>
                
                <div>
                    <h3>${material.title}</h3>
                    
                    <p>
                        ${
                            completed
                            ? "Completed"
                            : "Not completed"
                        }
                    </p>
                </div>
            </div>
            
            <div class="feed-status">
                ${
                    completed
                    ? `
                        <span class="material-icons completed">check_circle</span>`
                    : `
                        <span class="material-icons pending">radio_button_unchecked</span>`
                }
            </div>
        `;
        card.onclick = () => {
            openMaterialViewer(materialDoc.id);
        };
        list.appendChild(card);
    }
}