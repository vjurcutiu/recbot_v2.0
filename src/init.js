import './liteExport/main.js';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'ping') {
      // Respond to the ping so that ensureContentScript knows we're ready.
      sendResponse({ pong: true });
      return;
    }
    
    switch (message.action) {
    case 'start':
        try {
            console.log("Recording started in content script.");
            // (Your code to actually start recording can go here)
        
            // Now, notify the background to update actionsTaken with a recording message.
        
            sendResponse({ status: 'started' });
        } catch (error) {
            console.error("Error in start case:", error);
            sendResponse({ status: 'error', error: error.toString() });
        }
        break;

      case 'stop':
        console.log("Recording stopped in content script.");
        // Insert your code to finalize/stop recording here.
        sendResponse({ status: 'stopped' });
        break;

      case 'pause':
        console.log("Recording paused in content script.");
        // Insert your code to pause recording here.
        sendResponse({ status: 'paused' });
        break;
      default:
        break;
    }
  });
  
  // Listen for clicks and send the click event to the background.
  document.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'userClicked' });
  });
  
  // Notify the background script that the content script is ready.
  chrome.runtime.sendMessage({ action: 'contentScriptReady' });
  console.log('Click handler content script loaded.');