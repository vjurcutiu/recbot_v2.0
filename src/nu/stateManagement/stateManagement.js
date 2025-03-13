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
    activeStepIndex: 0, 
    steps: [],
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

      case 'updateTaskInfo': {
        // Update only basic task info
        const { id, name, objectives, startUrl } = message.payload;
        recordState.currentTask = {
          ...recordState.currentTask,
          id: id !== undefined ? id : recordState.currentTask.id,
          name: name !== undefined ? name : recordState.currentTask.name,
          objectives: objectives !== undefined ? objectives : recordState.currentTask.objectives,
          startUrl: startUrl !== undefined ? startUrl : recordState.currentTask.startUrl,
        };
        sendResponse({ success: true, recordedTask: recordState.currentTask });
        break;
      }
  
      case 'updateTaskSteps': {
        // Update steps separately
        const { steps, activeStepIndex } = message.payload;
        if (steps !== undefined) {
          recordState.currentTask.steps = Array.isArray(steps)
            ? steps.map((step) => ({
                id: step.id || '',
                name: step.name || '',
                actionsTaken: step.actionsTaken || [],
                interactableElements: step.interactableElements || [],
                screenshots: step.screenshots || [],
                toggleAnswers: step.toggleAnswers || {},
              }))
            : recordState.currentTask.steps;
        }
        if (activeStepIndex !== undefined) {
          recordState.currentTask.activeStepIndex = activeStepIndex;
        }
        sendResponse({ success: true, recordedTask: recordState.currentTask });
        break;
      }
  
      case 'updateToggleAnswers': {
        // Update toggle answers for a specific step
        const { toggleAnswers, activeStepIndex } = message.payload;
        const index = activeStepIndex !== undefined ? activeStepIndex : recordState.currentTask.activeStepIndex || 0;
        if (recordState.currentTask.steps && recordState.currentTask.steps.length > index) {
          recordState.currentTask.steps[index] = {
            ...recordState.currentTask.steps[index],
            toggleAnswers,
          };
          sendResponse({ success: true, recordedTask: recordState.currentTask });
        } else {
          sendResponse({ success: false, error: 'Step not found' });
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
