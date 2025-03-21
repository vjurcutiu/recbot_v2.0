// eventManagement.js
import { handleClick, handleContextMenu, handleMouseMove, handleScroll, handleResize, handleInput, handleKeydown, handleUrlChange, handleFormSubmit } from './eventHandlers.js';
import { observeDomMutations, observeDynamicContent, waitForStableDOM } from './observers.js';


// Global event buffer and paused flag.
let eventBuffer = [];
export let paused = false;

export function addEvent(eventRecord) {
  // Always add the event to the buffer
  eventBuffer.push(eventRecord);
}

export function flushEventBuffer() {
  // Sort events by their timestamp to ensure correct order
  eventBuffer.sort((a, b) => a.timestamp - b.timestamp);
  // Process each event in order:
  eventBuffer.forEach(event => {
    chrome.runtime.sendMessage({
      action: "updateActionsTaken",
      payload: { liteEvent: event }
    });
  });
  // Clear the buffer after flushing
  eventBuffer = [];
}

export function timedBuffer() {
  setTimeout(flushEventBuffer, 2000);
}

export function pauseTracking() {
  paused = true;
  console.log("Tracking paused (buffering events).");
}

export function resumeTracking() {
  paused = false;
  // Flush any events that occurred while paused
  flushEventBuffer();
  console.log("Tracking resumed and events flushed.");
}

export function startTracking() {
  paused = false;
  console.log("Tracking started. Events will be flushed on a schedule or real-time.");
}

export function attachEventListeners() {
  document.addEventListener("click", handleClick, true);
  document.addEventListener("contextmenu", handleContextMenu);
  document.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("scroll", handleScroll);
  window.addEventListener("resize", handleResize);
  document.addEventListener("input", handleInput);
  document.addEventListener("keydown", handleKeydown);
  window.addEventListener("popstate", handleUrlChange);
  window.addEventListener("hashchange", handleUrlChange);
  document.addEventListener("submit", handleFormSubmit, true);

  // Begin observing dynamic content and DOM mutations.
  observeDynamicContent();
}

export function removeEventListeners() {
  document.removeEventListener("click", handleClick, true);
  document.removeEventListener("contextmenu", handleContextMenu);
  document.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("scroll", handleScroll);
  window.removeEventListener("resize", handleResize);
  document.removeEventListener("input", handleInput);
  document.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("popstate", handleUrlChange);
  window.removeEventListener("hashchange", handleUrlChange);
  document.removeEventListener("submit", handleFormSubmit, true);
}

let trackingInitialized = false;
export function initializeTracking() {
  if (trackingInitialized) return;
  attachEventListeners();
  trackingInitialized = true;
  console.log("LiteExport tracking initialized.");
}

export function destroyTracking() {
  if (!trackingInitialized) return;
  removeEventListeners();
  trackingInitialized = false;
  console.log("LiteExport tracking destroyed.");
}
