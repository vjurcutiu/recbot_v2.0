// StepLoop.jsx
import React, { useState, useEffect } from 'react';
import StepSubLoop from './StepSubLoop';
import StepSubCreator from './StepSubCreator';
import './styles/StepLoop.css'

function StepLoop({ setActiveComponent }) {
  const [currentTask, setCurrentTask] = useState({});
  const [steps, setSteps] = useState([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isEditable, setIsEditable] = useState(false);
  const [isReplanning, setIsReplanning] = useState(false);
  const [replannedSteps, setReplannedSteps] = useState([]);

  // Retrieve currentTask (including activeStepIndex) from the background state on mount.
  useEffect(() => {
    chrome.runtime.sendMessage({ action: 'getRecordState' }, (response) => {
      if (response && response.recordState) {
        const task = response.recordState.currentTask;
        setCurrentTask(task);
        setSteps(task.steps || []);
        setActiveStepIndex(task.activeStepIndex || 0);
        console.log(response);
      }
    });
  }, []);

  // Move to the next step by updating the background state.
  const handleNext = () => {
    if (activeStepIndex < steps.length - 1) {
      const newIndex = activeStepIndex + 1;
      // Update local state immediately for responsiveness.
      setActiveStepIndex(newIndex);
      // Also update the background state with the new activeStepIndex.
      chrome.runtime.sendMessage(
        { action: 'updateTaskSteps', payload: { activeStepIndex: newIndex } },
        (response) => {
          console.log('Active step index updated:', response);
          chrome.runtime.sendMessage({ action: 'resumeRecording' }, () => {
            window.close();
          });
        }
      );
    }
  };

  // Enable replanning by truncating future steps.
  const handleEnableReplan = () => {
    const confirmed = window.confirm(
      "This will delete all future steps. Do you wish to continue?"
    );
    if (confirmed) {
      const truncatedSteps = steps.slice(0, activeStepIndex + 1);
      setSteps(truncatedSteps);
      setReplannedSteps([]);
      setIsReplanning(true);
      // Update background state with the truncated steps.
      chrome.runtime.sendMessage(
        { action: 'updateTaskSteps', payload: { steps: truncatedSteps } },
        (response) => {
          console.log('Steps truncated for replanning:', response);
        }
      );
    }
  };

  const confirmReplan = () => {
    const newSteps = [...steps, ...replannedSteps];
    const newActiveStepIndex = activeStepIndex + 1; // Move to the next step after the current one.
    setSteps(newSteps);
    setActiveStepIndex(newActiveStepIndex);
    chrome.runtime.sendMessage(
      {
        action: 'updateTaskSteps',
        payload: { steps: newSteps, activeStepIndex: newActiveStepIndex },
      },
      (response) => {
        console.log('Task re-recorded with new steps and updated active step index:', response);
        chrome.runtime.sendMessage({ action: 'resumeRecording' }, () => {
          window.close();
        });
      }
    );
    setIsReplanning(false);
  };

  const currentStep = steps[activeStepIndex] || { id: 1, name: '' };
  const title = `Step ${currentStep.id}`;

  return (
    <div className="steploop-container">
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
                  // Persist the updated step names to the background.
                  chrome.runtime.sendMessage(
                    { action: 'updateTaskSteps', payload: { steps: updatedSteps } },
                    (response) => {
                      console.log('Step name updated:', response);
                    }
                  );
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
          activeStepIndex={activeStepIndex}
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
