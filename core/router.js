import { checkPageAccess } from "./access.js";

let routes = {};

export function registerRoutes(r) {
  routes = r;
}

export async function navigate(page) {
  const allowed = await checkPageAccess(page);

  if (!allowed) {
    page = "subscription";
  }

  if (!routes[page]) {
    console.error("Route not found:", page);
    return;
  }

  routes[page]();
}