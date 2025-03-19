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

export function updateRecordStateWithUrl(url) {
  const activeStepIndex = recordState.currentTask.activeStepIndex ?? 0;
  const activeFragmentIndex = recordState.currentTask.activeFragmentIndex ?? 0;
  const step = recordState.currentTask.steps && recordState.currentTask.steps[activeStepIndex];
  
  if (step && Array.isArray(step.fragments) && step.fragments[activeFragmentIndex] !== undefined) {
    step.fragments[activeFragmentIndex].currentURL = url;
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
    console.log("Updated recordState screenshots:", step.fragments[activeFragmentIndex].screenshots);
  } else {
    console.error("Active step or fragment not found for recordScreenshot.");
  }
}

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
      sendResponse({ success: true, recordedTask: recordState.currentTask });
      break;
    }
  
    case 'updateToggleAnswers': {
      const { toggleAnswers, activeStepIndex, fragmentIndex } = message.payload;
      const step = recordState.currentTask.steps[activeStepIndex];
      if (step && Array.isArray(step.fragments) && step.fragments[fragmentIndex] !== undefined) {
        step.fragments[fragmentIndex].toggleAnswers = toggleAnswers;
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
        sendResponse({ success: true, updatedFragment: step.fragments[fragmentIndex] });
      } else {
        sendResponse({ success: false, error: 'Fragment not found' });
      }
      break;
    }
  
    case 'setActiveFragmentIndex': {
      const { activeFragmentIndex } = message.payload;
      recordState.currentTask.activeFragmentIndex = activeFragmentIndex;
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

    // Updated updateActionsTaken handler:
    case 'updateActionsTaken': {
      // Use provided indexes or fallback to the active ones from recordState
      const { liteEvent } = message.payload;
      const stepIndex = message.payload.stepIndex ?? recordState.currentTask.activeStepIndex ?? 0;
      const fragmentIndex = message.payload.fragmentIndex ?? recordState.currentTask.activeFragmentIndex ?? 0;
    
      console.log("Logging event at step", stepIndex, "fragment", fragmentIndex);
    
      if (recordState.currentTask.steps && recordState.currentTask.steps[stepIndex]) {
        const step = recordState.currentTask.steps[stepIndex];
        if (!Array.isArray(step.fragments)) {
          step.fragments = [];
        }
        while (step.fragments.length <= fragmentIndex) {
          step.fragments.push({
            actionsTaken: [],
            interactableElements: [],
            screenshots: [],
            toggleAnswers: {},
            fragmentIndex: step.fragments.length,
          });
        }
        step.fragments[fragmentIndex].actionsTaken.push(liteEvent);
        console.log("Updated actionsTaken:", step.fragments[fragmentIndex].actionsTaken);
        sendResponse({ success: true });
      } else {
        console.error("Step not found for index:", stepIndex);
        sendResponse({ success: false, error: "Step not found" });
      }
      break;
    }

    case 'recordInteractableElements': {
      const { interactableElements } = message.payload;
      console.log('interactable elements', interactableElements);
      const activeStepIndex = recordState.currentTask.activeStepIndex ?? 0;
      const activeFragmentIndex = recordState.currentTask.activeFragmentIndex ?? 0;
      const step = recordState.currentTask.steps && recordState.currentTask.steps[activeStepIndex];
      if (step && Array.isArray(step.fragments) && step.fragments[activeFragmentIndex]) {
        step.fragments[activeFragmentIndex].interactableElements = interactableElements;
        console.log("Updated interactableElements:", step.fragments[activeFragmentIndex].interactableElements);
        sendResponse({ success: true, updatedInteractables: step.fragments[activeFragmentIndex].interactableElements });
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
      break;
  }
});
