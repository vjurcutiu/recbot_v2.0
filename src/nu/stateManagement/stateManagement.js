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
    activeFragmentIndex: 0, // New property to track the active fragment index.
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
      // Update only basic task info (ID, name, objectives, startUrl)
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
      // Update steps separately. For each step, if no fragments exist,
      // create a default fragment that contains the properties that were
      // formerly stored at the step level.
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
                // Preserve step ID, name and other core properties.
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
      // Now update toggleAnswers at the fragment level rather than on the step.
      // Expects payload: { toggleAnswers: object, activeStepIndex: number, fragmentIndex: number }
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

    // Listener to add a fragment to a specific step.
    case 'addFragment': {
      // Expects payload: { stepIndex: number, fragment: object }
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

    // Listener to update a specific fragment.
    case 'updateFragment': {
      // Expects payload: { stepIndex: number, fragmentIndex: number, fragmentData: object }
      const { stepIndex, fragmentIndex, fragmentData } = message.payload;
      const step = recordState.currentTask.steps[stepIndex];
      if (step && Array.isArray(step.fragments) && step.fragments[fragmentIndex] !== undefined) {
        step.fragments[fragmentIndex] = {
          ...step.fragments[fragmentIndex],
          ...fragmentData,
          fragmentIndex, // ensure index remains unchanged
        };
        sendResponse({ success: true, updatedFragment: step.fragments[fragmentIndex] });
      } else {
        sendResponse({ success: false, error: 'Fragment not found' });
      }
      break;
    }
  
    // New message: Set the active fragment index.
    case 'setActiveFragmentIndex': {
      const { activeFragmentIndex } = message.payload;
      recordState.currentTask.activeFragmentIndex = activeFragmentIndex;
      sendResponse({ success: true, activeFragmentIndex });
      break;
    }

    // New message: Return both active step and active fragment indices.
    case 'getActiveIndices': {
      sendResponse({
        activeStepIndex: recordState.currentTask.activeStepIndex,
        activeFragmentIndex: recordState.currentTask.activeFragmentIndex || 0
      });
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
