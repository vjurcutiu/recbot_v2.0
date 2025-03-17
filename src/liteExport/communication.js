// communication.js
export function setupCommunication({ initializeTracking, captureInteractableElements, destroyTracking, recordCurrentUrl, triggerScreenshot }) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "ping") {
        sendResponse({ pong: true });
        return; // Exit immediately on ping
      }
      try {
        if (message.action === "start") {
          initializeTracking();
          captureInteractableElements();
          recordCurrentUrl()
          triggerScreenshot('start')
          sendResponse({ status: "lite tracking + element capture started" });
        } else if (message.action === "stop") {
          triggerScreenshot('stop')
          destroyTracking();
          sendResponse({ status: "lite tracking stopped" });
        } else if (message.action === "exportLite") {
          sendResponse({ status: "export not handled here" });
        } else if (message.action === "resume") {
          initializeTracking();
          captureInteractableElements();
          recordCurrentUrl()
          triggerScreenshot('resume')
          sendResponse({ status: "lite tracking resumed" });
        }        
        else if (message.action === "pause") {
          triggerScreenshot('pause')
          destroyTracking();
          sendResponse({ status: "lite tracking paused" });
        }
        
        else if (message.action === "clearLiteEvents") {
          // Not used in this new pattern.
        }
      } catch (err) {
        console.error("Error in message handler:", err);
        sendResponse({ error: err.message });
      }
    });
  }
  