// popup.js
import { openWindow } from '../src/frontendUtils/WindowOpen';

// Wait for the DOM to fully load
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
          // Now open the window after setting the active component
          openWindow('../dist/popup/start.html', {
            width: 800,
            height: 600,
          })
            .then((newWindow) => {
              console.log('New window created:', newWindow);
            })
            .catch((error) => {
              console.error('Error creating window:', error);
            });
        }
      );
    });
  }
});
