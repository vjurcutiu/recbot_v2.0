// background.js
let globalState = {
    activeComponent: 'start', // default value
  };
  
  // Listen for messages from the frontend
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // If the message instructs to update the active component:
    if (message.action === 'setActiveComponent' && message.payload) {
      globalState.activeComponent = message.payload;
      sendResponse({ success: true, activeComponent: globalState.activeComponent });
      chrome.runtime.sendMessage({ activeComponent: globalState.activeComponent });
    } else if (message.action === 'recordTask' && message.payload) {
      const { name, objectives, startUrl, steps } = message.payload;
      recordState.currentTask = {
        ...recordState.currentTask,
        name: name !== undefined ? name : recordState.currentTask.name,
        objectives: objectives !== undefined ? objectives : recordState.currentTask.objectives,
        url: startUrl !== undefined ? startUrl : recordState.currentTask.url,
        steps:
          steps !== undefined && Array.isArray(steps)
            ? steps.map((step) => ({
                id: step.id || '',
                name: step.name || '',
              }))
            : recordState.currentTask.steps,
      };
      sendResponse({ success: true, recordedTask: recordState.currentTask });
    } else if (message.action === 'getRecordState') {
      // Return the current recordState object.
      sendResponse({ recordState });
    }
    else if (message.action === 'recordTask' && message.payload) {
      // Merge new payload fields with the existing task.
      recordState.currentTask = {
        ...recordState.currentTask,
        // Only update these fields if they are provided in the payload.
        name: message.payload.name !== undefined ? message.payload.name : recordState.currentTask.name,
        objectives: message.payload.objectives !== undefined ? message.payload.objectives : recordState.currentTask.objectives,
        url: message.payload.startUrl !== undefined ? message.payload.startUrl : recordState.currentTask.url,
        steps:
          message.payload.steps !== undefined && Array.isArray(message.payload.steps)
            ? message.payload.steps.map((step) => ({
                id: step.id || '',
                name: step.name || '',
              }))
            : recordState.currentTask.steps,
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
      steps: [] // Now an array of step objects
    },
  };
