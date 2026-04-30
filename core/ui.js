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

export function toast(message) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerText = message;

  document.body.appendChild(t);

  setTimeout(() => t.remove(), 2500);
}