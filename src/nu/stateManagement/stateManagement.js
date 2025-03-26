// stateManagement.js

export const globalState = {
  activeComponent: null,
  filesLoaded: false,
  allowedTabIds: [],    // Array to store all allowed recording tab IDs.
  recordingTabId: null, // The current active allowed tab.
  recording: false,
};

export const recordState = {
  currentTask: {
    id: '',
    name: '',
    objectives: [],
    startUrl: '',
    activeStepIndex: 0,
    activeFragmentIndex: 0, // tracks the active fragment index.
    steps: [],
  },
};

// New: an update log array to keep track of all changes
export const updateLog = [];

// Helper function to log state updates.
function logUpdate(action, payload) {
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    payload: JSON.parse(JSON.stringify(payload)) // deep copy for safety
  };
  updateLog.push(entry);
  console.log("State Update Log:", entry);
}

export function updateRecordStateWithUrl(url) {
  const activeStepIndex = recordState.currentTask.activeStepIndex ?? 0;
  const activeFragmentIndex = recordState.currentTask.activeFragmentIndex ?? 0;
  const step = recordState.currentTask.steps && recordState.currentTask.steps[activeStepIndex];
  
  // Instead of auto-creating missing fragments, we check if the fragment exists.
  if (step && Array.isArray(step.fragments) && step.fragments[activeFragmentIndex] !== undefined) {
    step.fragments[activeFragmentIndex].currentURL = url;
    logUpdate('updateRecordStateWithUrl', { url, activeStepIndex, activeFragmentIndex });
    console.log("Updated currentURL in active fragment:", url);
  } else {
    console.error("Active step or fragment not found for updating currentURL.");
  }
}

export function updateRecordStateWithScreenshot(filename) {
  const activeStepIndex = recordState.currentTask.activeStepIndex ?? 0;
  const activeFragmentIndex = recordState.currentTask.activeFragmentIndex ?? 0;
  const step = recordState.currentTask.steps && recordState.currentTask.steps[activeStepIndex];
  if (step && Array.isArray(step.fragments) && step.fragments[activeFragmentIndex] !== undefined) {
    if (!Array.isArray(step.fragments[activeFragmentIndex].screenshots)) {
      step.fragments[activeFragmentIndex].screenshots = [];
    }
    step.fragments[activeFragmentIndex].screenshots.push(filename);
    logUpdate('updateRecordStateWithScreenshot', { filename, activeStepIndex, activeFragmentIndex });
    console.log("Updated recordState screenshots:", step.fragments[activeFragmentIndex].screenshots);
  } else {
    console.error("Active step or fragment not found for recordScreenshot.");
  }
}

export function handleMessage(message, sender, sendResponse) {
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
      const { id, name, objectives, startUrl } = message.payload;
      recordState.currentTask = {
        ...recordState.currentTask,
        id: id !== undefined ? id : recordState.currentTask.id,
        name: name !== undefined ? name : recordState.currentTask.name,
        objectives: objectives !== undefined ? objectives : recordState.currentTask.objectives,
        startUrl: startUrl !== undefined ? startUrl : recordState.currentTask.startUrl,
      };
      logUpdate('updateTaskInfo', { id, name, objectives, startUrl });
      sendResponse({ success: true, recordedTask: recordState.currentTask });
      break;
    }
  
    case 'updateTaskSteps': {
      const { steps, activeStepIndex } = message.payload;
      if (steps !== undefined) {
        recordState.currentTask.steps = Array.isArray(steps)
          ? steps.map((step) => {
              const fragments = Array.isArray(step.fragments) && step.fragments.length
                ? step.fragments
                : [{
                    actionsTaken: step.actionsTaken || [],
                    interactableElements: step.interactableElements || [],
                    screenshots: step.screenshots || [],
                    toggleAnswers: step.toggleAnswers || {},
                    fragmentIndex: 0,
                  }];
              return {
                ...step,
                fragments,
              };
            })
          : recordState.currentTask.steps;
      }
      if (activeStepIndex !== undefined) {
        recordState.currentTask.activeStepIndex = activeStepIndex;
      }
      logUpdate('updateTaskSteps', { steps, activeStepIndex });
      sendResponse({ success: true, recordedTask: recordState.currentTask });
      break;
    }
  
    case 'updateToggleAnswers': {
      const { toggleAnswers, activeStepIndex, fragmentIndex } = message.payload;
      const step = recordState.currentTask.steps[activeStepIndex];
      if (step && Array.isArray(step.fragments) && step.fragments[fragmentIndex] !== undefined) {
        step.fragments[fragmentIndex].toggleAnswers = toggleAnswers;
        logUpdate('updateToggleAnswers', { toggleAnswers, activeStepIndex, fragmentIndex });
        sendResponse({ success: true, recordedTask: recordState.currentTask });
      } else {
        sendResponse({ success: false, error: 'Fragment not found' });
      }
      break;
    }

    case 'addFragment': {
      const { stepIndex, fragment } = message.payload;
      const step = recordState.currentTask.steps[stepIndex];
      if (step) {
        if (!Array.isArray(step.fragments)) {
          step.fragments = [{
            actionsTaken: step.actionsTaken || [],
            interactableElements: step.interactableElements || [],
            screenshots: step.screenshots || [],
            toggleAnswers: step.toggleAnswers || {},
            fragmentIndex: 0,
          }];
        }
        const newFragmentIndex = step.fragments.length;
        const newFragment = { 
          actionsTaken: fragment.actionsTaken || [], 
          interactableElements: fragment.interactableElements || [], 
          screenshots: fragment.screenshots || [], 
          toggleAnswers: fragment.toggleAnswers || {},
          fragmentIndex: newFragmentIndex,
        };
        step.fragments.push(newFragment);
        logUpdate('addFragment', { stepIndex, newFragment });
        sendResponse({ success: true, addedFragment: newFragment });
      } else {
        sendResponse({ success: false, error: 'Step not found' });
      }
      break;
    }

    case 'updateFragment': {
      const { stepIndex, fragmentIndex, fragmentData } = message.payload;
      const step = recordState.currentTask.steps[stepIndex];
      if (step && Array.isArray(step.fragments) && step.fragments[fragmentIndex] !== undefined) {
        step.fragments[fragmentIndex] = {
          ...step.fragments[fragmentIndex],
          ...fragmentData,
          fragmentIndex,
        };
        logUpdate('updateFragment', { stepIndex, fragmentIndex, fragmentData });
        sendResponse({ success: true, updatedFragment: step.fragments[fragmentIndex] });
      } else {
        sendResponse({ success: false, error: 'Fragment not found' });
      }
      break;
    }
  
    case 'setActiveFragmentIndex': {
      const { activeFragmentIndex } = message.payload;
      recordState.currentTask.activeFragmentIndex = activeFragmentIndex;
      logUpdate('setActiveFragmentIndex', { activeFragmentIndex });
      sendResponse({ success: true, activeFragmentIndex });
      break;
    }

    case 'getActiveIndices': {
      sendResponse({
        activeStepIndex: recordState.currentTask.activeStepIndex,
        activeFragmentIndex: recordState.currentTask.activeFragmentIndex ?? 0
      });
      break;
    }

    case 'updateActionsTaken': {
      const { liteEvent } = message.payload;
      const stepIndex = message.payload.stepIndex ?? recordState.currentTask.activeStepIndex;
      const fragmentIndex = message.payload.fragmentIndex ?? recordState.currentTask.activeFragmentIndex;
      console.log("Inside updateActionsTaken:", stepIndex, fragmentIndex, recordState.currentTask.steps)
    
      if (!recordState.currentTask.steps || !recordState.currentTask.steps[stepIndex]) {
        sendResponse({ success: false, error: 'Step does not exist' });
        break;
      }
      const step = recordState.currentTask.steps[stepIndex];
      if (!Array.isArray(step.fragments) || !step.fragments[fragmentIndex]) {
        sendResponse({ success: false, error: 'Fragment does not exist' });
        break;
      }
      
      step.fragments[fragmentIndex].actionsTaken.push(liteEvent);
      logUpdate('updateActionsTaken', { liteEvent, stepIndex, fragmentIndex });
      console.log("Updated actionsTaken:", step.fragments[fragmentIndex].actionsTaken);
      sendResponse({ success: true });
      break;
    }

    case 'recordInteractableElements': {
      const { interactableElements } = message.payload;
      console.log("Received interactableElements payload:", interactableElements);
    
      const activeStepIndex = recordState.currentTask.activeStepIndex ?? 0;
      const activeFragmentIndex = recordState.currentTask.activeFragmentIndex ?? 0;
      const step = recordState.currentTask.steps && recordState.currentTask.steps[activeStepIndex];
    
      if (step && Array.isArray(step.fragments) && step.fragments[activeFragmentIndex] !== undefined) {
        // Initialize the set if it hasn't been already
        if (!globalState.loggedInteractableElements) {
          globalState.loggedInteractableElements = new Set();
        }
        const loggedSet = globalState.loggedInteractableElements;
        console.log("Current loggedInteractableElements set:", Array.from(loggedSet));
    
        // Filter out elements already logged based on a unique key (e.g. xpath)
        const newElements = interactableElements.filter(el => {
          if (loggedSet.has(el.xpath)) {
            console.log("Skipping already logged element with xpath:", el.xpath);
            return false;
          }
          console.log("Logging new element with xpath:", el.xpath);
          loggedSet.add(el.xpath);
          return true;
        });
    
        // Optionally merge the new elements with the ones already stored
        step.fragments[activeFragmentIndex].interactableElements = [
          ...(step.fragments[activeFragmentIndex].interactableElements || []),
          ...newElements
        ];
    
        console.log("New elements after filtering:", newElements);
        console.log("Updated loggedInteractableElements set:", Array.from(loggedSet));
        console.log("Updated interactableElements in fragment:", step.fragments[activeFragmentIndex].interactableElements);
    
        logUpdate('recordInteractableElements', {
          newElements,
          activeStepIndex,
          activeFragmentIndex
        });
    
        sendResponse({
          success: true,
          updatedInteractables: step.fragments[activeFragmentIndex].interactableElements
        });
      } else {
        console.error("Active step or fragment not found for recordInteractableElements.");
        sendResponse({ success: false, error: "Active step or fragment not found" });
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
      sendResponse({ success: false, error: 'Unrecognized stateManagement action.' });
      break;
  }
}
