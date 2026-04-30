// core/router.js

let routes = {};

export function registerRoutes(r) {
  routes = r;
}

export function navigate(page) {
  if (!routes[page]) {
    console.error("Route not found:", page);
    return;
  }

  routes[page]();
}