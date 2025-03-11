import React, { useState, useEffect } from 'react';
import StepSubCreator from './StepSubCreator';

function StepCreator({ setActiveComponent }) {
  const [steps, setSteps] = useState([]);
  const [currentTask, setCurrentTask] = useState({});

  // Retrieve the current task from the background state on mount.
  useEffect(() => {
    chrome.runtime.sendMessage({ action: 'getRecordState' }, (response) => {
      if (response && response.recordState) {
        setCurrentTask(response.recordState.currentTask);
      }
    });
  }, []);

  const handleDone = () => {
    // If no steps are added, prompt the user to add at least one step.
    if (steps.length === 0) {
      alert("Please add at least one step before clicking done.");
      return;
    }
  
    // Update the current task with the new steps in the background state.
    chrome.runtime.sendMessage(
      { action: 'recordTask', payload: { steps } },
      (response) => {
        console.log('Task recorded:', response);
      }
    );
  
    // Switch active component to "StepLoop".
    setActiveComponent('StepLoop');
  
    console.log('currentTask:', currentTask);
  
    // Open a new tab with the task's start URL if available.
    if (currentTask.startUrl) {
      chrome.runtime.sendMessage(
        { action: 'open-new-tab', url: currentTask.startUrl },
        (response) => {
          console.log("open-new-tab response:", response);
        }
      );
    } else {
      console.warn("No start URL provided in currentTask");
    }
  
    // Trigger recording from the UI.
    chrome.runtime.sendMessage(
      { action: 'start-recording-from-ui' },
      (response) => {
        console.log('start-recording-from-ui response:', response);
        window.close();
      }
    );
  };
  

  return (
    <div>
      <h1>Step Creator</h1>
      <StepSubCreator steps={steps} setSteps={setSteps} baseStepNumber={0} />
      <br />
      <button onClick={handleDone}>Done</button>
    </div>
  );
}

export default StepCreator;
