import React from 'react';

function StepLoop() {
  // Resets the global state to "StepLoop"
  const handleRetry = () => {
    chrome.runtime.sendMessage(
      { action: 'setActiveComponent', payload: 'StepLoop' },
      (response) => {
        if (response && response.success) {
          console.log('Global state reset to StepLoop');
        } else {
          console.error('Failed to reset global state');
        }
      }
    );
  };

  // Closes the current window
  const handleDone = () => {
    window.close();
  };

  return (
    <div>
      <h1>Step Loop</h1>
      <button onClick={handleRetry}>Retry</button>
      <button onClick={handleDone}>Done</button>
    </div>
  );
}

export default StepLoop;
