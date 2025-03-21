import { pauseTracking, resumeTracking, startTracking, timedBuffer } from './eventManagement.js';


// communication.js
export function setupCommunication({ initializeTracking, captureInteractableElements, destroyTracking, recordCurrentUrl, triggerScreenshot }) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "ping") {
      sendResponse({ pong: true });
      return;
    }
    try {
      if (message.action === "start") {
        startTracking()
        initializeTracking();
        captureInteractableElements();
        recordCurrentUrl();
        triggerScreenshot('start');
        sendResponse({ status: "lite tracking + element capture started" });
      } else if (message.action === "stop") {
        timedBuffer()
        triggerScreenshot('stop');
        destroyTracking();
        sendResponse({ status: "lite tracking stopped" });
      } else if (message.action === "resume") {
        // Instead of full re-initialization, simply resume processing buffered events.
        resumeTracking();
        initializeTracking();
        captureInteractableElements();
        recordCurrentUrl();
        triggerScreenshot('resume');
        sendResponse({ status: "lite tracking resumed" });
      } else if (message.action === "pause") {
        timedBuffer()
        triggerScreenshot('pause');
        // Instead of destroying tracking, just pause processing new events.
        pauseTracking();
        sendResponse({ status: "lite tracking paused" });
      }
      } catch (err) {
        console.error("Error in message handler:", err);
        sendResponse({ error: err.message });
      }
    });
  }
  