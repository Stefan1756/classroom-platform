import { renderAllClassesTab } from "./tabs/allClassesTab.js";
import { renderMyClassroomTab } from "./tabs/myClassroomTab.js";

export function loadClasses() {
  const container = document.getElementById("contentArea");

  container.innerHTML = `
    <div class="classes-page">
    
      <div class="classes-header">
      
        <h2>Find your favorite lessons</h2>
        
        <p>
          Explore classes and continue your learning journey
        </p>
        
      </div>
      
      <div class="classes-tabs">
      
        <button class="class-tab active"
                data-tab="all">
            All Classes
        </button>
        
        <button class="class-tab"
                data-tab="my">
            My Classroom
        </button>
        
      </div>
      
      <div id="classesTabContent"></div>
      
    </div>
  `;

  initClassTabs();
}

function initClassTabs() {
  const tabs = document.querySelectorAll(".class-tab");

  tabs.forEach(tab => {

    tab.onclick = () => {

      tabs.forEach(t =>
        t.classList.remove("active")
      );

      tab.classList.add("active");

      const type = tab.dataset.tab;

      if (type === "all") {
        renderAllClassesTab();
      }

      if (type === "my") {
        renderMyClassroomTab();
      }
    };
  });

  renderAllClassesTab();
}