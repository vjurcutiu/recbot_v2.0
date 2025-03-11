import { blobToDataUrl, downloadDataUrl, exportGenericData } from './src/utils.js';
import { globalState, recordState } from './src/nu/recorder/exporter/stateManagement/stateManagement.js';

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
          const { name, objectives, startUrl, steps } = message.payload;
          recordState.currentTask = {
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
  
      // New actions to handle additional component requests.
      case 'open-new-tab':
        if (message.url) {
          chrome.tabs.create({ url: message.url }, (tab) => {
            console.log('New tab opened:', tab);
            sendResponse({ success: true, tabId: tab.id });
          });
        } else {
          sendResponse({ success: false, error: 'No URL provided' });
        }
        break;
  
      case 'start-recording-from-ui':
        // Implement your recording start logic here.
        globalState.recording = true;
        console.log('Recording started via UI');
        sendResponse({ success: true, recording: globalState.recording });
        break;

      case 'resumeRecording':
        // Implement the logic to resume recording if needed.
        globalState.recording = true;
        console.log('Recording resumed via UI');
        sendResponse({ success: true, recording: globalState.recording });
        break;
  
      default:
        console.log('Unknown action received:', message.action);
        break;
    }
  });
  