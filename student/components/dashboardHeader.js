import { getStudentIdentity } from "../../core/auth.js";
import { navigate } from "../../core/router.js";

export function renderDashboardHeader() {
    const user = getStudentIdentity();

    const hour = new Date().getHours();

    let greeting = "Good Evening";
    if (hour < 12) greeting = "Good Morning";
    else if (hour < 18) greeting = "Good Afternoon";

    const searchPlaceholders = [
      "What do you want to learn?",
      "Search Biology, Math, Physics...",
      "Find classes, exams, past papers...",
      "With best teachers around the country"
    ]

    let placeholderIndex = 0;

    const container = document.getElementById("contentArea");

    container.innerHTML = `
             
        <div class="dashboard-header">
        
          <div class="header-content">

              <div class="header-top">
                  <div class="greeting-block">
                    <h2>${greeting}</h2>
                    <p>${user.username}</p>
                  </div>
               
                  <div class="header-actions">

                      <div class="icon-btn" id="notifBtn">
                        <span class="material-icons">notifications</span>
                        <span class="notif-dot"></span>
                      </div>
                  
                      <div class="avatar">
                      <img src="${user.avatar}" />
                  </div>
                  
                </div>
              </div>
              
              <div class="search-box" id="searchBox">
                <span class="material-icons search-icon">search</span>
                <input type="text" id="searchInput" placeholder="What do you want to learn?" />
              </div>
            </div>
        </div>
      `;
      const input = document.getElementById("searchInput");
      setInterval(() => {
        placeholderIndex = (placeholderIndex + 1) % searchPlaceholders.length;
        input.setAttribute("placeholder", searchPlaceholders[placeholderIndex]);
      }, 2500);

      document.getElementById("searchBox").onclick = () => {
        navigate("search");
      };

      input.addEventListener("keydown", (e) => {
        e.preventDefault();
      });
}