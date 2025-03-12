// stateManagement.js

export const globalState = {
  activeComponent: null,
  filesLoaded: false,
  recordingTabId: null,
  recording: false,
};

export const recordState = {
  currentTask: {
    id: '',
    name: '',
    objectives: [],
    startUrl: '',
    steps: [],
    activeStepIndex: 0,  // <-- Added activeStepIndex here
  },
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'setActiveComponent':
      if (message.payload) {
        globalState.activeComponent = message.payload;
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

      case 'recordTask': {
        if (message.payload) {
          const { id, name, objectives, startUrl, steps, toggleAnswers, activeStepIndex } = message.payload;
  
          // If steps are provided, update them entirely.
          if (steps) {
            recordState.currentTask = {
              id: id || recordState.currentTask.id,
              name: name ?? recordState.currentTask.name,
              objectives: objectives ?? recordState.currentTask.objectives,
              startUrl: startUrl ?? recordState.currentTask.startUrl,
              steps: Array.isArray(steps)
                ? steps.map((step) => ({
                    id: step.id || '',
                    name: step.name || '',
                    actionsTaken: step.actionsTaken || [],
                    interactableElements: step.interactableElements || [],
                    screenshots: step.screenshots || [],
                    toggleAnswers: step.toggleAnswers || {}
                  }))
                : recordState.currentTask.steps,
              // Update activeStepIndex if provided
              activeStepIndex: activeStepIndex !== undefined ? activeStepIndex : recordState.currentTask.activeStepIndex,
            };
          }
  
          // If toggleAnswers are provided, update the correct step.
          if (toggleAnswers !== undefined) {
            // Use the activeStepIndex from the payload if provided,
            // otherwise fall back to the stored activeStepIndex.
            const index = activeStepIndex !== undefined ? activeStepIndex : recordState.currentTask.activeStepIndex || 0;
            if (recordState.currentTask.steps && recordState.currentTask.steps.length > index) {
              recordState.currentTask.steps[index] = {
                ...recordState.currentTask.steps[index],
                toggleAnswers: toggleAnswers,
              };
            }
          }
  
          // Update the activeStepIndex if provided and not already handled by the steps branch.
          if (activeStepIndex !== undefined && !steps) {
            recordState.currentTask.activeStepIndex = activeStepIndex;
          }
          
          sendResponse({
            success: true,
            recordedTask: recordState.currentTask,
          });
        }
        break;
      }
  
    

    case 'getRecordState':
      sendResponse({ recordState });
      break;

    case 'getActiveComponent':
      sendResponse({ activeComponent: globalState.activeComponent });
      break;

    default:
      break;
  }
});
