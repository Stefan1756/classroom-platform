let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;

    document
        .getElementById("installBtn")
        ?.classList.remove("hidden");
});

document.addEventListener("click", async (e) => {
    if (e.target.id !== "installBtn") return;
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
});