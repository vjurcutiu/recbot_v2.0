import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import StepSubCreator from './StepSubCreator';
import { updateRecordTask } from '../services/uiStateManagement';

function StepCreator({ setActiveComponent }) {
  const dispatch = useDispatch();
  const [steps, setSteps] = useState([]);
  const currentTask = useSelector((state) => state.recordState.currentTask);

  // Removed the useEffect that sends a message on mount

  const handleDone = () => {
    // Update task record using Redux
    dispatch(updateRecordTask({ steps }));

    // Switch active component to "StepLoop" using the passed-in callback
    setActiveComponent('StepLoop');

    console.log('currentTask:', currentTask);

    // Open a new tab with the task's start URL if available
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

    // Trigger the recording from the UI
    chrome.runtime.sendMessage(
      { action: 'start-recording-from-ui' },
      (response) => {
        console.log('start-recording-from-ui response:', response);
        window.close;
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
