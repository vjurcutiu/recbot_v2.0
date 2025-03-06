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
    else if (message.action === 'recordTask' && message.payload) {
      const { name, objectives, startUrl } = message.payload;
      recordState.currentTask = {
        name: name || '',
        objectives: objectives || [],
        url: startUrl || ''
      };
      sendResponse({ success: true, recordedTask: recordState.currentTask });
    }
    // If the frontend wants to retrieve the current active component
    else if (message.action === 'getActiveComponent') {
      sendResponse({ activeComponent: globalState.activeComponent });
    }
  });
  
let recordState = {
    currentTask: {
      name: '',
      objectives: '',
      url: '',
      steps:  {
        id: '',
        text: '',
        start_url: '',
        interactable_elements: '',
        user_actions: '',
        feedback: '',
        succes_status:  '',
      },
    },
}
