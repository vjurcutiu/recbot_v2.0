import React, { useState, useEffect } from 'react';
import StepSubLoop from './StepSubLoop';
import StepSubCreator from './StepSubCreator';

function StepLoop() {
  const [steps, setSteps] = useState([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isEditable, setIsEditable] = useState(false);
  const [isReplanning, setIsReplanning] = useState(false);
  const [replannedSteps, setReplannedSteps] = useState([]);

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

  // Callback to enable replanning.
  const handleEnableReplan = () => {
    const confirmed = window.confirm(
      "This will delete all future steps. Do you wish to continue?"
    );
    if (confirmed) {
      // Remove all steps after the current active step.
      setSteps((prevSteps) => prevSteps.slice(0, activeStepIndex + 1));
      setReplannedSteps([]); // Initialize replanning steps as empty.
      setIsReplanning(true);
    }
  };

  // In a real implementation you might merge the replanned steps into your global state.
  // For now, we simply append them to the locked steps when the user confirms the replan.
  const confirmReplan = () => {
    setSteps([...steps, ...replannedSteps]);
    setIsReplanning(false);
  };

  // Determine the current step. Default to "Step 1" if no steps are loaded.
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
        // Display the replanning interface using StepSubCreator.
        <div>
          <StepSubCreator
            steps={replannedSteps}
            setSteps={setReplannedSteps}
            baseStepNumber={currentStep.id}
          />
          <button onClick={confirmReplan}>Confirm Replan</button>
        </div>
      ) : (
        // If not replanning, show the normal subloop controls.
        <StepSubLoop onNext={handleNext} onEnableReplan={handleEnableReplan} />
      )}
    </div>
  );
}

export default StepLoop;
