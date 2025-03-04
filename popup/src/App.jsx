import React, { useState, useEffect } from 'react';
import Start from './components/Start';
// Import additional components as needed.
// import OtherComponent from './components/OtherComponent';

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
      {/* Add additional conditions for other components.
          For example: */}
      {/* {activeComponent === 'other' && <OtherComponent />} */}
    </div>
  );
}

export default App;
