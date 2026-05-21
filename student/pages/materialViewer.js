import { db } from "../../core/firebase.js";
import { goBack } from "../../core/router.js";
import { getUser } from "../../core/auth.js";

import {
    doc,
    getDoc,
    setDoc
 } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function openMaterialViewer(materialId) {
    const container = document.getElementById("contentArea");
    const materialRef = doc(db, "materials", materialId);
    const materialSnap = await getDoc(materialRef);
    if (!materialSnap.exists()) return;
    const material = materialSnap.data();
    container.innerHTML = `
        <div class="material-viewer">
            <div class="viewer-header">
                <span class="material-icons" id="backViewer">arrow_back_ios</span>
                <h3>${material.title}</h3>
            </div>
            
            <div class="viewer-body">
                ${renderMaterialContent(material)}
            </div>
            
            <button class="complete-btn" id="completeLessonBtn">
                Mark As Completed
            </button>
        </div>
    `;
    document.getElementById("backViewer").onclick = () => {
        goBack();
    };

    handleLessonCompletion(materialId);
}

function renderMaterialContent(material) {
    if (
        material.fileType &&
        material.fileType.startsWith("video")
    ) {
        return `
            <video controls class="lesson-video">
                <source src="${material.fileType}" />
            </video>
        `;
    }
    
    if (
        material.fileType &&
        material.fileType.startsWith("image")
    ) {
        return `
            <img src="${material.fileUrl}"
                class="lesson-image-viewer"
            />
        `;
    }

    if (
        material.fileType &&
        material.fileType.includes("pdf")
    ) {
        return `
            <iframe src="${material.fileUrl}"
                class="pdf-viewer"
            </iframe>
        `;
    }

    if (material.type === "link") {
        return `
            <a href="${material.fileUrl}" target="_blank"
                class="open-link-btn"> Open Learning Resources
            </a>
        `;
    }

    return `<p>Unsupported material type</p>`;
}

async function handleLessonCompletion(materialId) {
    const btn = document.getElementById("completeLessonBtn");
    const progressId = `${getUser().uid}_${materialId}`;
    btn.onclick = async () => {
        await setDoc(
            doc(
                db,
                "lessonProgress", 
                progressId
            ),
            {
                studentId: getUser().uid,
                materialId,
                completed: true,
                completedAt: new Date()
           }
        );
        btn.innerText = "Completed";
        btn.disabled = true;
    };
}