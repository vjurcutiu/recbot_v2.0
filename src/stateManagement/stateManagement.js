// background.js

const globalState = {
  activeComponent: null,
  filesLoaded: false, // now globally available
};

const recordState = {
  currentTask: {
    name: '',
    objectives: [],
    startUrl: '', // changed from 'url' to 'startUrl'
    steps: []
  },
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'setActiveComponent':
      if (message.payload) {
        globalState.activeComponent = message.payload;
        // Optionally broadcast the updated active component.
        chrome.runtime.sendMessage({
          action: 'activeComponentChanged',
          payload: globalState.activeComponent
        });
        sendResponse({
          success: true,
          activeComponent: globalState.activeComponent
        });
      }
      break;

    case 'setFilesLoaded':
      if (typeof message.payload === 'boolean') {
        globalState.filesLoaded = message.payload;
        sendResponse({
          success: true,
          filesLoaded: globalState.filesLoaded
        });
      }
      break;

    case 'getFilesLoaded':
      sendResponse({ filesLoaded: globalState.filesLoaded });
      break;

    case 'recordTask':
      if (message.payload) {
        const { name, objectives, startUrl, steps } = message.payload;
        recordState.currentTask = {
          name: name ?? recordState.currentTask.name,
          objectives: objectives ?? recordState.currentTask.objectives,
          startUrl: startUrl ?? recordState.currentTask.startUrl, // using startUrl consistently
          steps: Array.isArray(steps)
            ? steps.map((step) => ({
                id: step.id || '',
                text: step.text || '',
                actionsTaken: step.actionsTaken || [],
                interactableElements: step.interactableElements || [],
                screenshots: step.screenshots || []
              }))
            : recordState.currentTask.steps,
        };
        sendResponse({
          success: true,
          recordedTask: recordState.currentTask
        });
      }
      break;

    case 'getRecordState':
      sendResponse({ recordState });
      break;

    case 'getActiveComponent':
      sendResponse({ activeComponent: globalState.activeComponent });
      break;

    default:
      // Unknown action
      break;
  }
});
