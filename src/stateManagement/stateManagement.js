// background.js
let globalState = {
  activeComponent: 'start', // default value
};

// Listen for messages from the frontend
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'setActiveComponent' && message.payload) {
    globalState.activeComponent = message.payload;
    sendResponse({ success: true, activeComponent: globalState.activeComponent });
    chrome.runtime.sendMessage({ activeComponent: globalState.activeComponent });
  } 
  else if (message.action === 'recordTask' && message.payload) {
    const { name, objectives, startUrl, steps } = message.payload;
    recordState.currentTask = {
      ...recordState.currentTask,
      name: name !== undefined ? name : recordState.currentTask.name,
      objectives: objectives !== undefined ? objectives : recordState.currentTask.objectives,
      url: startUrl !== undefined ? startUrl : recordState.currentTask.url,
      steps: steps !== undefined && Array.isArray(steps)
        ? steps.map((step) => ({
            id: step.id || '',
            text: step.text || '',
            actionsTaken: step.actionsTaken || [],
            interactableElements: step.interactableElements || [],
            screenshots: step.screenshots || []
          }))
        : recordState.currentTask.steps,
    };
    sendResponse({ success: true, recordedTask: recordState.currentTask });
  }
  else if (message.action === 'getRecordState') {
    // Return the current recordState object.
    sendResponse({ recordState });
  }
  else if (message.action === 'getActiveComponent') {
    sendResponse({ activeComponent: globalState.activeComponent });
  }
});

let recordState = {
  currentTask: {
    name: '',
    objectives: '',
    url: '',
    // Each step now includes the extended properties:
    // id, text, actionsTaken, interactableElements, screenshots
    steps: []
  },
};
