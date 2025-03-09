import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import StepSubCreator from './StepSubCreator';
import { updateRecordTask, updateActiveComponent } from '../services/uiStateManagement';

function StepCreator() {
  const dispatch = useDispatch();
  const [steps, setSteps] = useState([]);
  const currentTask = useSelector((state) => state.recordState.currentTask);

  useEffect(() => {
    dispatch(updateActiveComponent('StepCreator'));
  }, [dispatch]);

  const handleDone = () => {
    dispatch(updateRecordTask({ steps }));
    dispatch(updateActiveComponent('StepLoop'));

    console.log('currentTask:', currentTask);


    if (currentTask.startUrl) {
      chrome.runtime.sendMessage({ action: 'open-new-tab', url: currentTask.startUrl }, (response) => {
        console.log("open-new-tab response:", response);
      });
    } else {
      console.warn("No start URL provided in currentTask");
    }

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
