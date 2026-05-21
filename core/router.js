let routes = {};
let historyStack = [];

export function registerRoutes(r) {
  routes = r;
}

export async function navigate(page, data = null) {

  historyStack.push({
    page,
    data
  });

  if (!routes[page]) {
    console.error("Route not found:", page);
    return;
  }

  routes[page]();
}

export function goBack() {
  historyStack.pop();
  const previous = historyStack[historyStack.length - 1];
  if (!previous) {
    navigate("dashboard");
    return;
  }

  routes[previous.page](previous.data);
}