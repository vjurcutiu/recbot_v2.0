// App.jsx
import React, { useState, useEffect } from 'react';
import Start from './components/Start';
import StepCreator from './components/StepCreator';
import StepLoop from './components/StepLoop';
import End from './components/End';

function App() {
  const [activeComponent, setActiveComponent] = useState('Start');

  useEffect(() => {
    // Retrieve the initial active component from the background script.
    chrome.runtime.sendMessage({ action: 'getActiveComponent' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
      } else if (response && response.activeComponent) {
        setActiveComponent(response.activeComponent);
      }
    });

    // Listen for any changes to the active component from the background.
    const listener = (message, sender, sendResponse) => {
      if (message.action === 'activeComponentChanged' && message.payload) {
        setActiveComponent(message.payload);
      }
    };

    chrome.runtime.onMessage.addListener(listener);

    // Clean up the listener when the component unmounts.
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, []);

  return (
    <div>
      {activeComponent === 'Start' && <Start />}
      {activeComponent === 'StepCreator' && <StepCreator />}
      {activeComponent === 'StepLoop' && <StepLoop />}
      {activeComponent === 'End' && <End />}
    </div>
  );
}

export default App;
