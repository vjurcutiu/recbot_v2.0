import React, { useState } from 'react';
import StepSubCreator from './StepSubCreator';

function StepCreator() {
  const [steps, setSteps] = useState([]);

  // When done, record the steps array (each with an id and name) in recordState
  const handleDone = () => {
    const taskPayload = {
      steps: steps, // Sending the array of step objects (with id and name)
    };

    chrome.runtime.sendMessage(
      { action: 'recordTask', payload: taskPayload },
      (response) => {
        if (response && response.success) {
          console.log('Task recorded:', response.recordedTask);

          // Request the full global state from the background script
          chrome.runtime.sendMessage({ action: 'getRecordState' }, (resp) => {
            if (chrome.runtime.lastError) {
              console.error('Error getting record state:', chrome.runtime.lastError);
            } else {
              console.log('Full global state:', resp.recordState);
            }
          });

          // Update active component after recording if needed
          chrome.runtime.sendMessage(
            { action: 'setActiveComponent', payload: 'StepLoop' },
            (resp) => {
              if (resp && resp.success) {
                console.log('Global state updated to StepLoop');
              } else {
                console.error('Failed to update global state');
              }
            }
          );
        } else {
          console.error('Failed to record task');
        }
      }
    );
  };

  return (
    <div>
      <h1>Step Creator</h1>
      {/* Delegate the step management UI to StepSubCreator */}
      <StepSubCreator steps={steps} setSteps={setSteps} baseStepNumber={0} />
      <br />
      <button onClick={handleDone}>Done</button>
    </div>
  );
}

export default StepCreator;
