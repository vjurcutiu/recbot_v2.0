//open a new tab on startURL

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background script received message:', message);
    
    if (message.action === 'open-new-tab' && message.url) {
      chrome.tabs.create({ url: message.url }, (tab) => {
        if (chrome.runtime.lastError) {
          console.error('Error creating tab:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log('Tab created:', tab);
          sendResponse({ success: true, tabId: tab.id });
        }
      });
      // Return true to indicate that we will send a response asynchronously.
      return true;
    }
    
    if (message.action === 'start-recording-from-ui') {
      console.log('Starting recording');
      // ... your recording logic
      sendResponse({ success: true });
      return true;
    }
  });
  
  