import { globalState, recordState } from './src/nu/stateManagement/stateManagement.js';
import { createContext, removeContext, getContext } from './src/nu/loop/context.js';

let windowOpened = false;

function openStartWindow() {
  chrome.windows.create({
    url: chrome.runtime.getURL("./dist/popup/start.html"),
    type: "popup",
    width: 800,
    height: 600
  }, (win) => {
    console.log("start.html window opened:", win);
  });
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
          chrome.tabs.sendMessage(tabId, { action: 'pause' }, () => {
            console.log(`Recording paused on tab ${tabId} due to click.`);
            // Open the UI to allow the user to resume later.
            openStartWindow();
            sendResponse({ success: true, recording: false });
          });
        });
      });
    } else {
      console.log(`No active recording for tab ${tabId}. Click ignored.`);
      sendResponse({ success: false, error: 'No active recording' });
    }
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);

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

    case 'recordTask':
      if (message.payload) {
        const { id, name, objectives, startUrl, steps } = message.payload;
        recordState.currentTask = {
          id: id || recordState.currentTask.id, // This now ensures id is stored.
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

    case 'getRecordState':
      sendResponse({ recordState });
      break;

    case 'getActiveComponent':
      sendResponse({ activeComponent: globalState.activeComponent });
      break;

    case 'open-new-tab':
      // Use the URL from the global state (recordState.currentTask.startUrl)
      const startUrl = recordState.currentTask.startUrl;
      if (startUrl) {
        chrome.tabs.create({ url: startUrl }, (tab) => {
          console.log('New tab opened with startUrl:', tab);
          // Create a new context for the opened tab.
          createContext(tab.id);
          // Save the new tab id in the global state.
          globalState.recordingTabId = tab.id;
          sendResponse({ success: true, tabId: tab.id });
        });
      } else {
        sendResponse({ success: false, error: 'No start URL found in the global state' });
      }
      break;

    case 'start-recording-from-ui': {
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
          
          // Wait for the content script to be ready
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
      // Use the global tab id if available; otherwise, fallback to sender.tab.id.
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

    case 'userClicked': {
      // Use the global recording tab id, fallback to sender.tab.id if needed.
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
    
            // Ensure content script is available before sending resume message
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
      // For debugging: reply to pings.
      sendResponse({ pong: true });
      break;

    case 'export': {
      console.log('Export action received from', sender);
      // Here you can add any processing logic for exporting data.
      // For example, you might package data and send it to a file, or trigger another process.
      sendResponse({ success: true, message: 'Export handled in background script.' });
      break;
    }

    default:
      console.log('Unknown action received:', message.action);
      break;
  }
});

// Clean up contexts when tabs are closed.
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (getContext(tabId)) {
    removeContext(tabId);
  }
});