import { db } from "../../core/firebase.js";
import {
  collection,
  query,
  where,
  getDocs,  
  doc,
  onSnapshot,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function loadStudentPapers(classId) {
    const container = document.getElementById("contentArea");
    const q = query(
        collection(db, "pastpapers"),
        where("classId", "==", classId)
    );

    onSnapshot(q, async (snapshot) => {
        container.innerHTML = "";
        if (snapshot.empty) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">menu_book</span>
                    <h3>No Past Papers</h3>
                    <p>Past papers will appear here</p>
                </div>
            `;
            return;
        }
        snapshot.forEach(docSnap => {
            const paper = docSnap.data();
            const card = document.createElement("div");
            card.className = "paper-card";
            card.innerHTML = `
                <div class="paper-preview">
                    <img src="${paper.thumbnail || 'paper.jpeg'}">
                </div>
                
                <div class="paper-content">
                    <div class="paper-year">
                        ${paper.year || "2025"}
                    </div>
                    
                    <h3>${paper.title}</h3>
                    <p>${paper.subject || "Past Paper"}</p>
                    
                    <div class="paper-actions">
                        <button class="view-paper-btn">View Paper</button>
                        <a href ="${paper.fileUrl}"
                            download
                            class="download-paper-btn">Download
                        </a>
                    </div>
                </div>
            `;
            card.querySelector(".view-paper-btn").onclick = () => {
                openPDFViewer(paper.fileUrl, paper.title);
            };
            container.appendChild(card);
        });
    });
}