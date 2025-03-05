// background.js
let globalState = {
    activeComponent: 'start', // default value
  };
  
  // Listen for messages from the frontend
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // If the message instructs to update the active component:
    if (message.action === 'setActiveComponent' && message.payload) {
      globalState.activeComponent = message.payload;
      // Optionally, send a confirmation back
      sendResponse({ success: true, activeComponent: globalState.activeComponent });
      // Optionally, broadcast the update to all extension pages
      chrome.runtime.sendMessage({ activeComponent: globalState.activeComponent });
    }
    // If the frontend wants to retrieve the current active component
    else if (message.action === 'getActiveComponent') {
      sendResponse({ activeComponent: globalState.activeComponent });
    }
  });
  
let recordState = {
    currentTask: '',
}