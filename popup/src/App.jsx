import React, { useState, useEffect } from 'react';
import Start from './components/Start';
import StepCreator from './components/StepCreator'; // Import the StepCreator component
import StepLoop from './components/StepLoop'

function App() {
  // Set "start" as the default component.
  const [activeComponent, setActiveComponent] = useState('start');

  useEffect(() => {
    // Check if the chrome runtime API is available.
    if (window.chrome && chrome.runtime && chrome.runtime.onMessage) {
      // Listen for messages from the background process.
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        // Expect the message to have an "activeComponent" property.
        if (message && message.activeComponent) {
          setActiveComponent(message.activeComponent);
        }
      });
    }
  }, []);

  return (
    <div>
      {activeComponent === 'start' && <Start />}
      {activeComponent === 'StepCreator' && <StepCreator />}
      {activeComponent === 'StepLoop' && <StepLoop />}
      {/* You can add more conditions for other components as needed. */}
    </div>
  );
}

export default App;
