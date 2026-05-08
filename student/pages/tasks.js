import { db } from "../../core/firebase.js";
import { getUser, getUserData } from "../../core/auth.js";
import { canAccessTasks } from "../../core/taskAccess.js";
import { navigate } from "../../core/router.js";

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function loadTasksPage() {
    const container = document.getElementById("contentArea");

    container.innerHTML = `
        <div class="tasks-page">

            <div id="tasksContent">
                <div class="tasks-header">
                    <div>
                        <h2 id="todayDate"></h2>
                        <p id="todayLabel">Today</p>
                    </div>
            
                    <button class="btn primary" id="addTaskBtn">
                        <span class="material-icons">add</span>
                            Add Task
                    </button>
                </div>
        
                <div class="week-calendar" id="weekCalendar"></div>
        
                <div class="task-list" id="taskList"></div>
            </div>
        </div>
    `;

    const allowed = await canAccessTasks();

    if (!allowed) {
        showTasksPremiumOverlay();
    }

    initDateHeader();
    generateWeek();
}

function initDateHeader() {
    const today = new Date();

    const options = { day: "numeric", month: "long" };
    const formatted = today.toLocaleDateString("en-US", options);

    document.getElementById("todayDate").textContent = formatted;

    document.getElementById("todayLabel").textContent = "Today";
}

async function getTaskDates() {
    const user = getUser();

    const q = query(
        collection(db, "tasks"),
        where("userId", "==", user.uid)
    );

    const snap = await getDocs(q);

    const dates = new Set();

    snap.forEach(doc => {
        const data = doc.data();
        if (!data.date) return;

        const key = new Date(data.date).toDateString();

        dates.add(key);
    });

    return dates;
}

async function generateWeek(selectedDate = new Date()) {
    const weekContainer = document.getElementById("weekCalendar");
    weekContainer.innerHTML = "";

    const taskDates = await getTaskDates();

    const start = new Date(selectedDate);
    const day = start.getDay();
    const diff = start.getDate() - day +  (day === 0 ? -6 : 1);
    start.setDate(diff);

    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);

        const key = d.toDateString();
        const hasTasks = taskDates.has(key);


        const isToday = isSameDay(d, new Date());
        const isSelected = isSameDay(d, selectedDate);

        const el = document.createElement("div");
        el.className = `week-day ${isSelected ? "active" : ""} ${isToday ? "today" : ""}`;

        el.innerHTML = `
            <span>${d.toLocaleDateString("en-US", { weekday: "short" })}</span>
            <strong>${d.getDate()}</strong>
            <div class="task-dot ${hasTasks ? "active" : ""}"></div>
        `;

        el.onclick = () => {
            generateWeek(d);
            loadTasksForDay(d);
        };

        weekContainer.appendChild(el);
    }

    loadTasksForDay(selectedDate);
}

async function loadTasksForDay(date) {
    const container = document.getElementById("taskList");

    const user = getUser();

    const formattedDate = formatDate(date); // 🔥 IMPORTANT

    const q = query(
        collection(db, "tasks"),
        where("studentId", "==", user.uid),
        where("date", "==", formattedDate) // ✅ MATCH STRING
    );

    const snap = await getDocs(q);

    const tasks = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="material-icons empty-icon">event_busy</span>
                <h3>No tasks for this day</h3>
                <p>You have nothing scheduled for this day.</p>
                <button class="btn primary" id="emptyAddTask">Add Task</button>
            </div>
        `;

        document.getElementById("emptyAddTask").onclick = () => {
            openAddTaskPage();
        };

        return;
    }

    renderTasks(tasks);
}

function isSameDay(d1, d2) {
    return d1.toDateString() === d2.toDateString();
}

function renderTasks(tasks) {
    const container = document.getElementById("taskList");

    if (!container) {
        console.error("TaskList not found");
        return;
        
    }

    if (!Array.isArray(tasks) || tasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="material-icons empty-icon">task_alt</span>
                <h3>No tasks for this day</h3>
                <p>You have nothing scheduled for this day.</p>
                <button class="btn primary" id="emptyAddTask">Add Task</button>
            </div>
        `;
        document.getElementById("emptyAddTask").onclick = () => {
            openAddTaskPage();
        };
        return;
    }
    
    container.innerHTML = `<div class="task-timeline" id="timeline"></div>`;

    const timeline = document.getElementById("timeline");

    if (!timeline) {
        console.error("timeline not created");
    }

    tasks.sort((a, b) => {
        const aTime = a.time || "00:00";
        const bTime = b.time || "00:00";
        return bTime.localeCompare(aTime);
    });


    tasks.forEach(task => {
        const isCompleted = task.completed === true;

        const color = isCompleted
            ? "#9ca3af"
            : getPriorityColor(task.priority);

        const item = document.createElement("div");
        item.className = "task-item";

        item.innerHTML = `
        <div class="timeline-left">
            <div class="timeline-dot" style="background:${color}"></div>
            <span class="timeline-time">
                 ${task.time ? task.time : "00:00"}
            </span>
        </div>
            
            <div class="task-card ${isCompleted ? "completed" : ""}" style="background:${color}">

            <div class="task-menu">
                <span class="material-icons more-btn">more_vert</span>

                <div class="task-dropdown">
                    <div class="dropdown-item complete-task ${isCompleted ? "disabled" : ""}">
                        ${isCompleted ? "Completed" : "Mark Complete"}
                    </div>
                </div>

            </div>
            
                <div class="task-top">
                    <h4>${task.title}</h4>
                </div>
                
                <p class="task-topic">${task.topic || ""}</p>
                
                <div class="task-meta">
                    <span class="category">
                        ${getCategoryIcon(task.category)} ${task.category}
                    </span>
                    
                    <span class="priority" style="color:${color}">
                        ${task.priority}
                    </span>
                </div>
                
            </div>
        `;

        timeline.appendChild(item);

        const moreBtn = item.querySelector(".more-btn");
        const dropdown = item.querySelector(".task-dropdown");

        moreBtn.onclick = (e) => {
            e.stopPropagation();

            document.querySelectorAll(".task-dropdown").forEach(d => {
                if (d !== dropdown) d.style.display = "none";
            });

            dropdown.style.display = 
                dropdown.style.display === "block" ? "none" : "block";
        };

        document.addEventListener("click", () => {
            dropdown.style.display = "none";
        });

        item.querySelector(".complete-task").onclick = async () => {
            try {
                await updateDoc(doc(db, "tasks", task.id), {
                    completed: true,
                    completedAt: serverTimestamp()
                });

                showToast("Task completed");
            } catch (error) {
                console.error(err);
            }
        };
    });
}

function getPriorityColor(priority) {
    if (priority === "high") return "#ef4444";
    if (priority === "medium") return "#f59e0b";
    if (priority === "low") return "#10b981";
    return "#6b7280";
}

function getCategoryIcon(category) {
    if (category === "class") return `<span class="material-icons">school</span>`;
    if (category === "exams") return `<span class="material-icons">quiz</span>`;
    if (category === "lab") return `<span class="material-icons">science</span>`;
    if (category === "assignments") return `<span class="material-icons">assignment</span>`;
    return `<span class="material-icons">task</span>`;
}

document.addEventListener("click", (e) => {
    if (e.target.closest("#addTaskBtn")) {
        openAddTaskPage() 
    }
});

function openAddTaskPage() {
    const container = document.getElementById("contentArea");

    container.innerHTML = `
        <div class="add-task-page">

            <div class="greeting">
                <p id="greetUser">Hello...</p>
                <h3>Add a Task</h3>
            </div>

            <h4>Categories</h4>
            <div class="categories">
                <button class="cat-btn" data-type="class">
                    <span class="material-icons">school</span>
                        Class
                </button>

                <button class="cat-btn" data-type="exam">
                    <span class="material-icons">quiz</span>
                        Exams
                </button>

                <button class="cat-btn" data-type="lab">
                    <span class="material-icons">science</span>
                        Labs
                </button>

                <button class="cat-btn" data-type="assignment">
                        <span class="material-icons">assignment</span>
                            Assignment
                </button>
            </div>

            <div id="taskForm" class="task-form hidden">
                <input type="text" id="taskTitle" placeholder="Task name" />
                <input type="text" id="taskTopic" placeholder="Task topic" />

                <div class="priority">
                    <button data-priority="low">Low</button>
                    <button data-priority="medium">Medium</button>
                    <button data-priority="high">High</button>
                </div>

                <div class="pickers">
                    <input type="date" id="taskDate" />
                    <input type="time" id="taskTime" />
                </div>

                <button id="createTaskBtn" class="create-btn">
                    Add Task
                </button>
            </div>
        
        </div>
    `;

    initAddTaskLogic();
}

function initAddTaskLogic() {
    const userData = getUserData();
    document.getElementById("greetUser").textContent =
        `Hello ${userData?.username || "Student"}`;


let selectedCategory = null;

document.querySelectorAll(".cat-btn").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".cat-btn")
            .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");
        selectedCategory = btn.dataset.type;

        document.getElementById("taskForm")
            .classList.remove("hidden");
    };
});

let selectedPriority = "medium";

document.querySelectorAll(".priority button").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".priority button")
            .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");
        selectedPriority = btn.dataset.priority;
    };
});

const dateInput = document.getElementById("taskDate");

const today = new Date();
const end = new Date();
end.setDate(today.getDate() + 6);

dateInput.min = today.toISOString().split("T")[0];
dateInput.max = end.toISOString().split("T")[0];

document.getElementById("createTaskBtn").onclick = async () => {
    const user = getUser();

    const title = document.getElementById("taskTitle").value;
    const topic = document.getElementById("taskTopic").value;
    const date = document.getElementById("taskDate").value;
    const time = document.getElementById("taskTime").value;

    if (!title || !date || !selectedCategory) {
        alert("Fill all required fields");
        return;
    }

    const dateValue = document.getElementById("taskDate").value;
    const timeValue = document.getElementById("taskTime").value;

   await addDoc(collection(db, "tasks"), {
    studentId: getUser().uid,
    title,
    topic,
    category: selectedCategory,
    priority: selectedPriority,
    date: dateValue, // ✅ STRING YYYY-MM-DD
    time: timeValue || "00:00", // ✅ fallback fix
    completed: false,
    createdAt: serverTimestamp()
});

    showToast("Task added!");

    document.getElementById("taskTitle").value = "";
    document.getElementById("taskTopic").value = "";
    document.getElementById("taskTime").value = "";
   };
}

function formatDate(dateObj) {
    return dateObj.toISOString().split("T")[0];
}

function onDateClick(dateObj) {
    const formatted = formatDate(dateObj);

    loadTasksForDay(formatted);
}

function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2500);
}

function showTasksPremiumOverlay() {

    removePremiumOverlay();

    const tasksContent = document.getElementById("tasksContent");

    if (!tasksContent) return;

    tasksContent.classList.add("tasks-blurred");

    const overlay = document.createElement("div");

    overlay.id = "premiumOverlay";

    overlay.className = "premium-overlay";

    overlay.innerHTML = `
        <div class="premium-box">
        
            <span class="material-icons premium-icon">
                workspace_premium
            </span>
            
            <h2>Premium Feature</h2>
            
            <p>
                Upgrade to 1 Month Plan
                to create and manage tasks.
            </p>
            
            <button id="upgradePlanBtn">
                Upgrade Now
            </button>
        </div>
    `;

    tasksContent.appendChild(overlay);

    document
        .getElementById("upgradePlanBtn")
        .onclick = () => {

            removePremiumOverlay();
             
            navigate("subscription");
        };
}

function removePremiumOverlay() {
    const overlay = document.getElementById("premiumOverlay");

    if (overlay) {
        overlay.remove();
    }

    const tasksContent = document.getElementById("tasksContent");

    if (tasksContent) {
        tasksContent.classList.remove("tasks-blurred");
    }
}
