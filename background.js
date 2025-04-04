import { globalState, recordState, updateRecordStateWithScreenshot, updateRecordStateWithUrl, handleMessage as stateHandleMessage } from './src/nu/stateManagement/stateManagement.js';
import { createContext, removeContext, getContext } from './src/nu/loop/context.js';
import { exportRecordState, exportScreenshots } from './src/nu/exporter/exporter.js';

let windowOpened = false;
let screenshotQueue = [];
let screenshotCounter = 0;

const stateManagementActions = new Set([
  'setActiveComponent',
  'setFilesLoaded',
  'getFilesLoaded',
  'updateTaskInfo',
  'updateTaskSteps',
  'updateToggleAnswers',
  'addFragment',
  'updateFragment',
  'setActiveFragmentIndex',
  'getActiveIndices',
  'updateActionsTaken',
  'recordInteractableElements',
  'getRecordState',
  'getActiveComponent',
  // … add any other state actions here
]);

function ensureFirstStepAndFragment() {
  const task = recordState.currentTask;
  if (!Array.isArray(task.steps)) {
    task.steps = [];
  }
  if (!task.steps[0]) {
    task.steps[0] = {
      fragments: [{
        fragmentIndex: 0,
        actionsTaken: [],
        interactableElements: [],
        screenshots: [],
        toggleAnswers: {},
      }]
    };
  }
  // Also confirm active indices
  task.activeStepIndex = 0;
  task.activeFragmentIndex = 0;
}

function openStartWindow(delay = 300, autoCloseAfter = null) {
  if (windowOpened) {
    console.log("Window is already open. Not opening a new one.");
    return;
  }
  // Set the flag immediately to prevent re-entry.
  windowOpened = true;
  setTimeout(() => {
    chrome.windows.create({
      url: chrome.runtime.getURL("./dist/popup/start.html"),
      type: "popup",
      focused: true,
      width: 800,
      height: 600
    }, (win) => {
      if (chrome.runtime.lastError || !win) {
        console.error("Failed to open window:", chrome.runtime.lastError);
        // Reset the flag if creation failed.
        windowOpened = false;
        return;
      }
      console.log("start.html window opened:", win);
      
      // Optionally auto-close the window after a specified timeout.
      if (autoCloseAfter) {
        setTimeout(() => {
          chrome.windows.remove(win.id, () => {
            windowOpened = false;
            console.log("Window automatically closed after timeout.");
          });
        }, autoCloseAfter);
      }
      
      // Listen for the window being closed manually to reset the flag.
      chrome.windows.onRemoved.addListener(function onRemoved(removedWindowId) {
        if (removedWindowId === win.id) {
          windowOpened = false;
          chrome.windows.onRemoved.removeListener(onRemoved);
          console.log("Window closed, flag reset.");
        }
      });
    });
  }, delay);
}


function ensureContentScript(tabId, callback, retries = 3) {
  chrome.tabs.sendMessage(tabId, { action: "ping" }, (response) => {
    if (chrome.runtime.lastError || !response) {
      if (retries > 0) {
        setTimeout(() => {
          ensureContentScript(tabId, callback, retries - 1);
        }, 500);
      } else {
        console.error("Content script did not respond for tab", tabId);
      }
    } else {
      callback();
    }
  });
}

function pauseRecordingForTab(tabId, sendResponse) {
  const context = getContext(tabId);
  if (!context) {
    console.log(`Tab ${tabId} is not within context. Ignoring click.`);
    sendResponse({ success: false, error: 'No context found for tab' });
    return;
  }
  chrome.storage.local.get({ recording: false }, (res) => {
    if (res.recording) {
      chrome.storage.local.set({ recording: false }, () => {
        console.log(`Pausing recording for tab ${tabId}. Context preserved.`);
        ensureContentScript(tabId, () => {
          // Delay sending the pause message to allow the click to be recorded.
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, { action: 'pause' }, () => {
              console.log(`Recording paused on tab ${tabId} due to click.`);
              // Open the UI to allow the user to resume later.
              openStartWindow();
              sendResponse({ success: true, recording: false });
            });
          }, 50); // Adjust delay as needed.
        });
      });
    } else {
      console.log(`No active recording for tab ${tabId}. Click ignored.`);
      sendResponse({ success: false, error: 'No active recording' });
    }
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Router received message:', message);

  if (stateManagementActions.has(message.action)) {
    stateHandleMessage(message, sender, sendResponse);
    return true; // Keep the message channel open for asynchronous responses.
  }

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

    case 'openWindow': {
      openStartWindow();
      sendResponse({ success: true });
      break;
    }

    case 'recordTask':
      if (message.payload) {
        const { id, name, objectives, startUrl, steps } = message.payload;
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

      case 'takeScreenshot': {
        const recordingTabId = globalState.recordingTabId;
        if (!recordingTabId) {
          console.error("No recording tab set.");
          return;
        }
        // Retrieve the tab info to get its windowId
        chrome.tabs.get(recordingTabId, (tab) => {
          if (chrome.runtime.lastError || !tab) {
            console.error("Recording tab not found:", chrome.runtime.lastError);
            return;
          }
          // Use the recording tab's windowId
          chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" }, (dataUrl) => {
            if (chrome.runtime.lastError) {
              console.error("Screenshot capture failed:", chrome.runtime.lastError.message);
              return;
            }
            try {
              screenshotCounter++;
              const timestamp = Date.now();
              const screenshotType = message.screenshotType || "unknown";
              const filename = `${screenshotCounter}.SS-${timestamp}-${screenshotType}.png`;
              screenshotQueue.push({ filename, dataUrl });
              console.log("Screenshot queued:", filename);
              updateRecordStateWithScreenshot(filename);
            } catch (innerErr) {
              console.error("Error in screenshot callback:", innerErr);
            }
          });
        });
        break;
      }
      

    case 'getCurrentUrl': {
      const tabId = globalState.recordingTabId;
      if (tabId) {
        chrome.tabs.get(tabId, (tab) => {
          console.log('url is', tab.url);
          updateRecordStateWithUrl(tab.url);
          sendResponse({ success: true });
        });
        return true;
      } else {
        sendResponse({ error: 'No recording tab found.' });
      }
      break;
    }

    case 'getRecordState':
      sendResponse({ recordState });
      break;

    case 'getActiveComponent':
      sendResponse({ activeComponent: globalState.activeComponent });
      break;

      case 'open-new-tab':
        const startUrl = recordState.currentTask.startUrl;
        if (startUrl) {
          chrome.tabs.create({ url: startUrl }, (tab) => {
            console.log('New tab opened with startUrl:', tab);
            createContext(tab.id);
            // Add new tab id to the allowedTabIds array
            globalState.allowedTabIds.push(tab.id);
            // Set this new tab as the current active recording tab
            globalState.recordingTabId = tab.id;
            sendResponse({ success: true, tabId: tab.id });
          });
        } else {
          sendResponse({ success: false, error: 'No start URL found in the global state' });
        }
        break;

    case 'start-recording-from-ui': {
      ensureFirstStepAndFragment()
      globalState.recording = true;
      chrome.storage.local.set({ recording: true }, () => {
        console.log('Recording started via UI.');
        const tabId = globalState.recordingTabId;
        console.log("Global recording tab id:", tabId);
        if (tabId) {
          let context = getContext(tabId);
          if (!context) {
            console.warn("No context found for tab, creating new one.");
            context = createContext(tabId);
          }
          context.recording = true;
          ensureContentScript(tabId, () => {
            chrome.tabs.sendMessage(tabId, { action: 'start' }, (response) => {
              if (chrome.runtime.lastError) {
                console.error("Error sending 'start' message:", chrome.runtime.lastError.message);
              } else {
                console.log("Start message sent successfully. Response:", response);
              }
            });
          });
        } else {
          console.error("No recording tab found in global state.");
        }
        sendResponse({ success: true, recording: true });
      });
      break;
    }

    case 'stopRecording': {
      const tabId = globalState.recordingTabId || (sender.tab && sender.tab.id);
      if (tabId) {
        let context = getContext(tabId);
        if (context) {
          context.recording = false;
          removeContext(tabId);
          console.log(`Recording stopped in tab ${tabId}. Context removed.`);
          sendResponse({ success: true, recording: false });
        } else {
          sendResponse({ success: false, error: 'No active recording for tab. Click ignored.' });
        }
      }
      break;
    }

    case 'userClicked':
    case 'userInput': {
      const tabId = globalState.recordingTabId || (sender.tab && sender.tab.id);
      if (!tabId) {
        console.log("No valid tabId found.");
        break;
      }
      pauseRecordingForTab(tabId, sendResponse);
      break;
    }

    case 'resumeRecording': {
      const tabId = globalState.recordingTabId;
      if (tabId) {
        let context = getContext(tabId);
        if (context) {
          context.recording = true;
          globalState.recording = true;
          chrome.storage.local.set({ recording: true }, () => {
            console.log(`Recording resumed in tab ${tabId}`, context);
            ensureContentScript(tabId, () => {
              chrome.tabs.sendMessage(tabId, { action: 'resume' }, (response) => {
                if (chrome.runtime.lastError) {
                  console.error(`Error sending 'resume' message: ${chrome.runtime.lastError.message}`);
                  sendResponse({ success: false, error: 'Failed to send resume message' });
                } else {
                  console.log(`Recording resumed on tab ${tabId}:`, response);
                  sendResponse({ success: true, recording: true });
                }
              });
            });
          });
        } else {
          console.error(`No active context for tab ${tabId}. Resume ignored.`);
          sendResponse({ success: false, error: 'No active context for the recording tab.' });
        }
      } else {
        sendResponse({ success: false, error: 'No active recording tab stored.' });
      }
      break;
    }

    case 'contentScriptReady':
      console.log('Content script is ready.');
      break;

    case 'ping':
      sendResponse({ pong: true });
      break;

    // Integrate the export functions here
    case 'export': {
      console.log('Export action received from', sender);
      // Export the recordState as a JSON file.
      exportRecordState();
      // Export the screenshot queue as a ZIP archive.
      exportScreenshots(screenshotQueue, () => {
        // Clear the screenshot queue and reset the counter after export.
        screenshotQueue = [];
        screenshotCounter = 0;
        console.log("Screenshot queue cleared after export.");
      });
      sendResponse({ success: true, message: 'Export initiated for record state and screenshots.' });
      break;
    }

    default:
      console.log('Unknown action received:', message.action);
      break;
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (getContext(tabId)) {
    removeContext(tabId);
  }
});

chrome.tabs.onCreated.addListener((tab) => {
  // Check if the new tab has an openerTabId and if that opener is in allowedTabIds.
  if (tab.openerTabId && globalState.allowedTabIds.includes(tab.openerTabId)) {
    console.log('New tab opened from an allowed tab, adding to allowedTabIds:', tab.id);
    globalState.allowedTabIds.push(tab.id);
    // Optionally create a context if you use one.
    createContext(tab.id);
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  const activeTabId = activeInfo.tabId;
  // If the activated tab is one of the allowed recording tabs, update recordingTabId.
  if (globalState.allowedTabIds.includes(activeTabId)) {
    globalState.recordingTabId = activeTabId;
    console.log('Updated recordingTabId to:', activeTabId);
  } else {
    console.log('Activated tab is not in the allowed list.');
  }
});

chrome.tabs.onCreated.addListener(function(tab) {
  if (tab.openerTabId && globalState.allowedTabIds.indexOf(tab.openerTabId) !== -1) {
      if (globalState.allowedTabIds.indexOf(tab.id) === -1) {
          console.log("New tab opened from allowed tab, adding context:", tab.id);
          globalState.allowedTabIds.push(tab.id);
          createContext(tab.id);
      }
  }
});

chrome.webNavigation.onCreatedNavigationTarget.addListener(function(details) {
  if (globalState.allowedTabIds.indexOf(details.sourceTabId) !== -1) {
      if (globalState.allowedTabIds.indexOf(details.tabId) === -1) {
          console.log("New navigation target from allowed tab, adding context:", details.tabId);
          globalState.allowedTabIds.push(details.tabId);
          createContext(details.tabId);
      }
      globalState.recordingTabId = details.tabId;
      chrome.tabs.sendMessage(details.tabId, { action: "start" }, function(response) {
          console.log("Started recording on new navigation target tab:", response);
      });
  }
});