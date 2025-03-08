import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import StepSubLoop from './StepSubLoop';
import StepSubCreator from './StepSubCreator';
import { updateActiveComponent } from '../services/uiStateManagement';

function StepLoop() {
  const dispatch = useDispatch();
  
  // Relay that StepLoop is the active component on mount.
  useEffect(() => {
    dispatch(updateActiveComponent('StepLoop'));
  }, [dispatch]);

  // Read steps from the Redux store.
  const recordState = useSelector((state) => state.recordState);
  const currentTask = recordState.currentTask;
  const stepsFromStore = currentTask.steps || [];

  const [steps, setSteps] = useState(stepsFromStore);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isEditable, setIsEditable] = useState(false);
  const [isReplanning, setIsReplanning] = useState(false);
  const [replannedSteps, setReplannedSteps] = useState([]);

  // Callback to move to the next step.
  const handleNext = () => {
    setActiveStepIndex((prevIndex) =>
      prevIndex < steps.length - 1 ? prevIndex + 1 : prevIndex
    );
  };

  // Callback to enable replanning.
  const handleEnableReplan = () => {
    const confirmed = window.confirm(
      "This will delete all future steps. Do you wish to continue?"
    );
    if (confirmed) {
      setSteps((prevSteps) => prevSteps.slice(0, activeStepIndex + 1));
      setReplannedSteps([]);
      setIsReplanning(true);
    }
  };

  // Confirm the replanning and merge new steps.
  const confirmReplan = () => {
    setSteps([...steps, ...replannedSteps]);
    setIsReplanning(false);
  };

  const currentStep = steps[activeStepIndex] || { id: 1, name: '' };
  const title = `Step ${currentStep.id}`;

  return (
    <div>
      <h1>{title}</h1>
      <ul>
        {steps.map((step, index) => (
          <li
            key={index}
            style={{
              fontWeight: index === activeStepIndex ? 'bold' : 'normal',
            }}
          >
            {isEditable ? (
              <input
                type="text"
                value={step.name}
                onChange={(e) => {
                  const updatedSteps = [...steps];
                  updatedSteps[index].name = e.target.value;
                  setSteps(updatedSteps);
                }}
              />
            ) : (
              `Step ${step.id}: ${step.name}`
            )}
          </li>
        ))}
      </ul>

      {isReplanning ? (
        <div>
          <StepSubCreator
            steps={replannedSteps}
            setSteps={setReplannedSteps}
            baseStepNumber={currentStep.id}
          />
          <button onClick={confirmReplan}>Confirm Replan</button>
        </div>
      ) : (
        <StepSubLoop
          key={activeStepIndex}
          onNext={handleNext}
          onEnableReplan={handleEnableReplan}
          isLastStep={activeStepIndex === steps.length - 1}
        />
      )}
    </div>
  );
}

export default StepLoop;
