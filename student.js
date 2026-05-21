import { initAuth } from "../core/auth.js";
import { registerRoutes, navigate } from "../core/router.js";
import { loadDashboard } from "./student/pages/dashboard.js";
import { loadClasses } from "./student/pages/classes.js";
import { loadProfile } from "./student/pages/profile.js";
import { loadSearch } from "./student/pages/search.js";



initAuth((user) => {

  registerRoutes({
    dashboard: loadDashboard,
    classes: loadClasses,
    search: loadSearch,
    profile: loadProfile
  });

  setupNav();

  navigate("dashboard");
});

function setupNav() {
  document.querySelectorAll(".nav-item").forEach(item => {
    item.onclick = () => {
      document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      navigate(item.dataset.page);
    };
  });
}