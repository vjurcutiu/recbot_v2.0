// StepCreator.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import StepSubCreator from './StepSubCreator';
import { updateRecordTask } from '../services/uiStateManagement';

function StepCreator() {
  const dispatch = useDispatch();
  const [steps, setSteps] = useState([]);
  const currentTask = useSelector((state) => state.recordState.currentTask);

  // On mount, update the active component via the background script
  useEffect(() => {
    chrome.runtime.sendMessage(
      { action: 'setActiveComponent', payload: 'StepCreator' },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error setting active component:', chrome.runtime.lastError);
        } else {
          console.log('Active component set to:', response.activeComponent);
        }
      }
    );
  }, []);

  const handleDone = () => {
    // Update task record using Redux
    dispatch(updateRecordTask({ steps }));

    // Switch active component to "StepLoop" via the background script
    chrome.runtime.sendMessage(
      { action: 'setActiveComponent', payload: 'StepLoop' },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error setting active component:', chrome.runtime.lastError);
        } else {
          console.log('Active component updated to:', response.activeComponent);
        }
      }
    );

    console.log('currentTask:', currentTask);

    // Open a new tab with the task's start URL if available
    if (currentTask.startUrl) {
      chrome.runtime.sendMessage({ action: 'open-new-tab', url: currentTask.startUrl }, (response) => {
        console.log("open-new-tab response:", response);
      });
    } else {
      console.warn("No start URL provided in currentTask");
    }

    // Trigger the recording from the UI
    chrome.runtime.sendMessage({ action: 'start-recording-from-ui' }, (response) => {
      console.log('start-recording-from-ui response:', response);
      window.close;
    });
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
