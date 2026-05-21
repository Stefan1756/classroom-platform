import { db } from "../../core/firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { navigate } from "../../core/router.js";

let expanded = false;

export async function renderExploreClasses(container) {
    const snap = await getDocs(collection(db, "classes"));

    const classes = {};

    snap.forEach(doc => {
        const data = doc.data();
        const key = (data.subject || "General").toLowerCase();

        if (!classes[key]) {
            classes[key] = {
                name: data.subject || "General",
                count: 0,
                image: getClassImage(data.subject),
            };
        }

        classes[key].count++;
    });

    const classArray = Object.values(classes);

    const visible = expanded ? classArray : classArray.slice(0, 6);

    container.innerHTML = `
        <div class="explore-section">
        
            <div class="explore-header">
                <h3>Explore Classes</h3>
                <button id="toggleExplore">${expanded ? "Show less" : "See more"}</button>
            </div>
            
            <div class="class-grid">
                ${visible.map(c => `
                    <div class="class-card" data-name="${c.name}">
                    
                        <div class="class-image">
                            <img src="${c.image}" />
                        </div>
                        
                        <div class="class-overlay">
                            <h4>${c.name}</h4>
                            <p>${c.count} classes</p>
                        </div>
                        
                    </div>
                    `).join("")}
                </div>
                
            </div>
        `;

        container.querySelectorAll(".class-card").forEach(card => {
            card.onclick = () => {
                const name = card.dataset.name;

                console.log("Navigate to:", name);

                navigate("classes");
            };
        });

        document.getElementById("toggleExplore").onclick = () => {
            expanded = !expanded;
            renderExploreClasses(container);
        };
}

function getClassImage(subject) {
    const map = {
        biology: "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=752&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        chemistry: "https://images.unsplash.com/photo-1694230155228-cdde50083573?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y2hlbWlzdHJ5fGVufDB8fDB8fHww",
        physics: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGh5c2ljc3xlbnwwfHwwfHx8MA%3D%3D",
        mathematics: "https://images.unsplash.com/photo-1676302440263-c6b4cea29567?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fG1hdGhlbWF0aWNzfGVufDB8fDB8fHww",
        economics: "https://plus.unsplash.com/premium_photo-1676673189320-76524a64684a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGVjb25vbWljc3xlbnwwfHwwfHx8MA%3D%3D",
        history: "https://plus.unsplash.com/premium_photo-1674727219372-4ba6644106bc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjF8fGhpc3Rvcnl8ZW58MHx8MHx8fDA%3D",
        commerce: "https://plus.unsplash.com/premium_photo-1683141154082-324d296f3c66?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8Y29tbWVyY2V8ZW58MHx8MHx8fDA%3D",
        geography: "https://images.unsplash.com/photo-1604351888999-9ea0a2851e61?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Z2VvZ3JhcGh5fGVufDB8fDB8fHww",
    };

    return map[subject?.toLowerCase()] || "https://plus.unsplash.com/premium_photo-1682125773446-259ce64f9dd7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8c2Nob29sfGVufDB8fDB8fHww";
}