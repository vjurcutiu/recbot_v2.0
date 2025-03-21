import './liteExport/main.js';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'ping') {
      // Respond to the ping so that ensureContentScript knows we're ready.
      sendResponse({ pong: true });
      return;
    }});
  
    document.addEventListener('mousedown', (event) => {
      // If the user’s actual mousedown was on a <select> or on one of its ancestors:
      if (event.target.matches('select, select *')) {
        return;  // Don’t send the message
      }
      // Otherwise, proceed
      chrome.runtime.sendMessage({ action: 'userClicked' });
    });

  document.addEventListener('keydown', (event) => {
    // Check if the event originates from an input, textarea, or select element.
    if (event.target.matches('input, textarea, select')) {
      // Check if the Enter key was pressed.
      if (event.key === 'Enter') {
        chrome.runtime.sendMessage({ action: 'userInput' });
      }
    }
  });

  // Notify the background script that the content script is ready.
  chrome.runtime.sendMessage({ action: 'contentScriptReady' });
  console.log('Click handler content script loaded.');