// Navigation stack management for mobile tab preservation
const STORAGE_KEY = 'nav_stack_v1';

export function getNavStack() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : { '/': ['/'], '/menu': ['/menu'], '/rewards': ['/rewards'], '/promotions': ['/promotions'], '/account': ['/account'] };
  } catch {
    return { '/': ['/'], '/menu': ['/menu'], '/rewards': ['/rewards'], '/promotions': ['/promotions'], '/account': ['/account'] };
  }
}

export function saveNavStack(stack) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stack));
  } catch {}
}

export function pushToStack(tabPath, currentPath) {
  const stack = getNavStack();
  if (!stack[tabPath]) {
    stack[tabPath] = [];
  }
  // Only push if it's a different path than the last one
  const lastPath = stack[tabPath][stack[tabPath].length - 1];
  if (lastPath !== currentPath) {
    stack[tabPath].push(currentPath);
    saveNavStack(stack);
  }
}

export function getStackForTab(tabPath) {
  const stack = getNavStack();
  return stack[tabPath] || [tabPath];
}

export function clearStack(tabPath) {
  const stack = getNavStack();
  stack[tabPath] = [tabPath];
  saveNavStack(stack);
}