// context.js

// Map to hold context objects keyed by tabId.
const tabContexts = new Map();

/**
 * Creates a new context for the given tab id.
 * You can customize the initial state as needed.
 */
export function createContext(tabId) {
  const context = {
    tabId,
    activeComponent: null,
    recording: false,
    // Add other properties as needed for your extension.
  };
  tabContexts.set(tabId, context);
  console.log(`Context created for tab ${tabId}:`, context);
  return context;
}

/**
 * Retrieves the context for a given tab id.
 */
export function getContext(tabId) {
  return tabContexts.get(tabId);
}

/**
 * Removes the context for a given tab id.
 */
export function removeContext(tabId) {
  if (tabContexts.has(tabId)) {
    tabContexts.delete(tabId);
    console.log(`Context removed for tab ${tabId}`);
  }
}
