import React, { useState, useEffect } from 'react';
import StepSubCreator from './StepSubCreator';
import './styles/StepCreator.css'

function StepCreator({ setActiveComponent }) {
  const [steps, setSteps] = useState([]);
  const [currentTask, setCurrentTask] = useState({});

  // Retrieve the current task from the background state on mount.
  useEffect(() => {
    chrome.runtime.sendMessage({ action: 'getRecordState' }, (response) => {
      if (response && response.recordState) {
        setCurrentTask(response.recordState.currentTask);
        // To capture a snapshot rather than a reference, you can do:
        console.log(JSON.parse(JSON.stringify(response.recordState.currentTask)));
      }
    });
  }, []);

  const handleDone = () => {
    if (steps.length === 0) {
      alert("Please add at least one step before clicking done.");
      return;
    }

    // Update steps and activeStepIndex using the new messaging system.
    chrome.runtime.sendMessage(
      {
        action: 'updateTaskSteps',
        payload: {
          steps,
          activeStepIndex: currentTask.activeStepIndex,
        },
      },
      (response) => {
        console.log('Task steps updated:', response);
      }
    );

    // Switch active component to "StepLoop".
    setActiveComponent('StepLoop');

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
    <div className="stepcreator-container">
      <h1>Step Creator</h1>
      <StepSubCreator steps={steps} setSteps={setSteps} baseStepNumber={0} />
      <br />
      <button onClick={handleDone}>Done</button>
    </div>
  );
}

export default StepCreator;
