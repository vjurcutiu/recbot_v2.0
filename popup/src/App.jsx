import React, { useState, useEffect, useCallback } from 'react';
import Start from './components/Start';
import StepCreator from './components/StepCreator';
import StepLoop from './components/StepLoop';
import End from './components/End';

function App() {
  const [activeComponent, setActiveComponentState] = useState('Start');

  // Centralized function to update active component in the background and locally.
  const handleSetActiveComponent = useCallback((componentName) => {
    chrome.runtime.sendMessage(
      { action: 'setActiveComponent', payload: componentName },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
        } else {
          // Update the App's state, which in turn controls which component is rendered.
          setActiveComponentState(componentName);
        }
      }
    );
  }, []);

  // On mount, fetch the current active component from the background.
  useEffect(() => {
    chrome.runtime.sendMessage({ action: 'getActiveComponent' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
      } else if (response && response.activeComponent) {
        setActiveComponentState(response.activeComponent);
      }
    });

    // Listen for any changes from the background.
    const listener = (message, sender, sendResponse) => {
      if (message.action === 'activeComponentChanged' && message.payload) {
        setActiveComponentState(message.payload);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, []);

  return (
    <div>
      {activeComponent === 'Start' && (
        <Start setActiveComponent={handleSetActiveComponent} />
      )}
      {activeComponent === 'StepCreator' && (
        <StepCreator setActiveComponent={handleSetActiveComponent} />
      )}
      {activeComponent === 'StepLoop' && (
        <StepLoop setActiveComponent={handleSetActiveComponent} />
      )}
      {activeComponent === 'End' && <End setActiveComponent={handleSetActiveComponent} />}
    </div>
  );
}

export default App;
