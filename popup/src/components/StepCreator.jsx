import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import StepSubCreator from './StepSubCreator';
import { updateRecordTask, updateActiveComponent } from '../services/uiStateManagement';

function StepCreator() {
  const dispatch = useDispatch();
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    dispatch(updateActiveComponent('StepCreator'));
  }, [dispatch]);

  const handleDone = () => {
    // 1) Dispatch Redux updates
    dispatch(updateRecordTask({ steps }));
    dispatch(updateActiveComponent('StepLoop'));

    // 2) Tell background script to start recording
    if (chrome && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'start-recording-from-ui' }, (response) => {
        console.log('Background response:', response);
        // 3) Close the current extension window after we get a response
        window.close();
      });
    } else {
      console.warn('Chrome runtime not found: are you in a normal webpage instead of an extension context?');
    }
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
