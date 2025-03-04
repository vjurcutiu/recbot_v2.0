// popup.js
import { openWindow } from '../src/frontendUtils/WindowOpen';

// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('start-button');
  if (startButton) {
    startButton.addEventListener('click', () => {
      openWindow('../dist/popup/start.html', {
        // Optionally override default options here
        width: 800,
        height: 600
      })
      .then((newWindow) => {
        console.log('New window created:', newWindow);
      })
      .catch((error) => {
        console.error('Error creating window:', error);
      });
    });
  }
});
