import React, { useState, useEffect } from 'react';
import StepSubLoop from './StepSubLoop';
import StepSubCreator from './StepSubCreator';

function StepLoop({ setActiveComponent }) {
  const [currentTask, setCurrentTask] = useState({});
  const [steps, setSteps] = useState([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isEditable, setIsEditable] = useState(false);
  const [isReplanning, setIsReplanning] = useState(false);
  const [replannedSteps, setReplannedSteps] = useState([]);

  // Retrieve currentTask and its steps from the background state on mount.
  useEffect(() => {
    chrome.runtime.sendMessage({ action: 'getRecordState' }, (response) => {
      if (response && response.recordState) {
        const task = response.recordState.currentTask;
        setCurrentTask(task);
        setSteps(task.steps || []);
      }
    });
  }, []);

  // Move to the next step.
  const handleNext = () => {
    setActiveStepIndex((prevIndex) =>
      prevIndex < steps.length - 1 ? prevIndex + 1 : prevIndex
    );
  };

  // Enable replanning by truncating future steps.
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

  // Confirm replanning by merging new steps.
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
          setActiveComponent={setActiveComponent}
        />
      )}
    </div>
  );
}

export default StepLoop;
