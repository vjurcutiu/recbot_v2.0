import React, { useState, useEffect } from 'react';
import StepSubLoop from './StepSubLoop';

function StepLoop() {
  const [steps, setSteps] = useState([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isEditable, setIsEditable] = useState(false);

  useEffect(() => {
    // Fetch the current record state from the background script.
    chrome.runtime.sendMessage({ action: 'getRecordState' }, (response) => {
      if (response && response.recordState && response.recordState.currentTask) {
        const fetchedSteps = response.recordState.currentTask.steps || [];
        setSteps(fetchedSteps);
        setActiveStepIndex(0);
      }
    });
  }, []);

  // Callback to move to the next step.
  const handleNext = () => {
    setActiveStepIndex((prevIndex) => {
      if (prevIndex < steps.length - 1) {
        return prevIndex + 1;
      }
      return prevIndex;
    });
  };

  // Callback to enable task list editing for replanning.
  const handleEnableReplan = () => {
    setIsEditable(true);
  };

  // Determine the current step and its title. Default to "Step 1" if no steps are loaded.
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
      {/* Pass callbacks to the subcomponent */}
      <StepSubLoop onNext={handleNext} onEnableReplan={handleEnableReplan} />
      </div>
  );
}

export default StepLoop;
