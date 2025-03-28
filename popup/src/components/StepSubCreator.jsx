import React, { useState } from 'react';
import './styles/StepSubCreator.css'

function StepSubCreator({ steps, setSteps, baseStepNumber = 0, activeStepIndex = 0 }) {
  const [currentInput, setCurrentInput] = useState('');
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editingText, setEditingText] = useState('');

  // Recalculate step ids based on a base step number.
  const recalcIds = (stepsArray) => {
    return stepsArray.map((step, index) => ({
      ...step,
      id: baseStepNumber + index + 1,
    }));
  };

  // Helper to update steps in the background state.
  const updateStepsInBackground = (newSteps) => {
    chrome.runtime.sendMessage(
      { action: 'updateTaskSteps', payload: { steps: newSteps, activeStepIndex } },
      (response) => {
        console.log('Steps updated:', response);
      }
    );
  };

  const handleInputChange = (e) => {
    setCurrentInput(e.target.value);
  };

  const handleAddStep = () => {
    if (currentInput.trim() !== '') {
      const newStep = { name: currentInput };
      const newSteps = recalcIds([...steps, newStep]);
      setSteps(newSteps);
      updateStepsInBackground(newSteps);
      setCurrentInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editingIndex !== -1) {
        handleSaveEdit(editingIndex);
      } else {
        handleAddStep();
      }
    }
  };

  const handleDeleteStep = (index) => {
    const newSteps = steps.filter((_, i) => i !== index);
    const recalcedSteps = recalcIds(newSteps);
    setSteps(recalcedSteps);
    updateStepsInBackground(recalcedSteps);
  };

  const handleEditStep = (index) => {
    setEditingIndex(index);
    setEditingText(steps[index].name);
  };

  const handleEditingChange = (e) => {
    setEditingText(e.target.value);
  };

  const handleSaveEdit = (index) => {
    if (editingText.trim() !== '') {
      const newSteps = steps.map((step, i) =>
        i === index ? { ...step, name: editingText } : step
      );
      const recalcedSteps = recalcIds(newSteps);
      setSteps(recalcedSteps);
      updateStepsInBackground(recalcedSteps);
      setEditingIndex(-1);
      setEditingText('');
    }
  };

  return (
    <div className="stepsubcreator-container">
      <div className="steps-wrapper">
        {steps.map((step, index) => (
          <div key={step.id} className="step-item">
            {editingIndex === index ? (
              <>
                <input
                  type="text"
                  className="step-edit-input"
                  value={editingText}
                  onChange={handleEditingChange}
                  onKeyDown={handleKeyDown}
                />
                  
                <button
                  className="step-button edit-save-button"
                  onClick={() => handleSaveEdit(index)}
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <span className="step-text">{`Step ${step.id}: ${step.name}`}</span>
                <div className="step-buttons">
                <button
                  className="step-button edit-button"
                  onClick={() => handleEditStep(index)}
                >
                  Edit
                </button>
                <button
                    className="step-button delete-button"
                    onClick={() => handleDeleteStep(index)}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}

          </div>
        ))}
      </div>
      <input
        type="text"
        value={currentInput}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Enter step"
      />
      <button onClick={handleAddStep}>Add Step</button>
    </div>
  );
}

export default StepSubCreator;
