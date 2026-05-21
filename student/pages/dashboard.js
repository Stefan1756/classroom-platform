import { db } from "../../core/firebase.js";
import { getUser, getUserData } from "../../core/auth.js";
import { navigate } from "../../core/router.js"
import { renderDashboardHeader } from "../components/dashboardHeader.js";
import { renderExploreClasses} from "../components/exploreClasses.js";
import { renderContinueLearning } from "../components/continueLearning.js";

import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  updateDoc,
  addDoc,
  getDoc,
  setDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function loadDashboard() {
  const container = document.getElementById("contentArea");

  container.innerHTML = "";

  renderDashboardHeader();

  const exploreContainer = document.createElement("div");
  container.appendChild(exploreContainer);

  renderExploreClasses(exploreContainer);

  const feedContainer = document.createElement("div");
  container.appendChild(feedContainer);

  renderContinueLearning(feedContainer);
}