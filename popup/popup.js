// popup.js
import { openWindow } from '../src/frontendUtils/WindowOpen';

document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('start-button');
  if (startButton) {
    startButton.addEventListener('click', () => {
      // Set the active component to "Start" via the background script
      chrome.runtime.sendMessage(
        { action: 'setActiveComponent', payload: 'Start' },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error setting active component:', chrome.runtime.lastError);
          } else {
            console.log('Active component set to:', response.activeComponent);
          }
          // Instead of directly opening the window, ask the backend to open it.
          chrome.runtime.sendMessage({ action: 'openWindow' }, (res) => {
            if (chrome.runtime.lastError) {
              console.error('Error opening window:', chrome.runtime.lastError);
            } else {
              console.log('Window open request processed:', res);
            }
          });
        }
      );
    });
  }
});
