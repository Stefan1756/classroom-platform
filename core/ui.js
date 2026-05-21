// core/ui.js

export function render(containerId, html) {
  document.getElementById(containerId).innerHTML = html;
}

export function showSkeleton(containerId) {
  render(containerId, `
    <div class="card">
      <div class="skeleton" style="height:20px;width:60%"></div>
      <div class="skeleton" style="height:14px;width:40%;margin-top:6px"></div>
    </div>
  `);
}

 export function showToast(message, type = "success") {
    const old = 
        document.querySelector(".custom-toast");

    if (old) old.remove();

    const toast = 
        document.createElement("div");

    toast.className = 
        `custom-toast ${type}`;

    toast.innerHTML = `
        <span class="material-icons">
            ${
                type === "success"
                ? "check_circle"

                : type === "error"
                ? "error"

                : "info"
            }
        </span>
        
        <p>${message}</p>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("show");
    }, 50);

    setTimeout(() => {
        toast.classList.remove("show");

        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000)
}