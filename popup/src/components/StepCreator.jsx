import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import StepSubCreator from './StepSubCreator';
import { updateRecordTask, updateActiveComponent } from '../services/uiStateManagement';

function StepCreator() {
  const dispatch = useDispatch();
  const [steps, setSteps] = useState([]);

  const handleDone = () => {
    const taskPayload = {
      steps: steps,
    };

    // Dispatch the update record task action.
    dispatch(updateRecordTask(taskPayload));

    // Dispatch the action to update the active component.
    dispatch(updateActiveComponent('StepLoop'));
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
