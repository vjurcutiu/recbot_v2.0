import React, { useState } from 'react';

function StepCreator() {
  // steps now stores objects: { id, name }
  const [steps, setSteps] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editingText, setEditingText] = useState('');

  // Helper function to recalculate step ids based on array position (1-based)
  const recalcIds = (stepsArray) => {
    return stepsArray.map((step, index) => ({
      ...step,
      id: index + 1,
    }));
  };

  // Updates the current input value
  const handleInputChange = (e) => {
    setCurrentInput(e.target.value);
  };

  // Adds a new step if the input is not empty and recalculates ids
  const handleAddStep = () => {
    if (currentInput.trim() !== '') {
      const newStep = { name: currentInput };
      const newSteps = recalcIds([...steps, newStep]);
      setSteps(newSteps);
      setCurrentInput('');
    }
  };

  // Handle Enter key press to add a step or save an edit
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

  // Delete a step at the given index and recalculate ids
  const handleDeleteStep = (index) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(recalcIds(newSteps));
  };

  // Initiate editing for a step at the given index
  const handleEditStep = (index) => {
    setEditingIndex(index);
    setEditingText(steps[index].name);
  };

  // Update the editing input as the user types
  const handleEditingChange = (e) => {
    setEditingText(e.target.value);
  };

  // Save the edited text for the step and recalculate ids
  const handleSaveEdit = (index) => {
    if (editingText.trim() !== '') {
      const newSteps = steps.map((step, i) =>
        i === index ? { ...step, name: editingText } : step
      );
      setSteps(recalcIds(newSteps));
      setEditingIndex(-1);
      setEditingText('');
    }
  };

  // When done, record the steps array (each with an id and name) in recordState
  const handleDone = () => {
    const taskPayload = {
      steps: steps, // Sending the array of step objects (with id and name)
    };

    chrome.runtime.sendMessage(
      { action: 'recordTask', payload: taskPayload },
      (response) => {
        if (response && response.success) {
          console.log('Task recorded:', response.recordedTask);

          // Request the full global state from the background script
          chrome.runtime.sendMessage({ action: 'getRecordState' }, (resp) => {
            if (chrome.runtime.lastError) {
              console.error('Error getting record state:', chrome.runtime.lastError);
            } else {
              console.log('Full global state:', resp.recordState);
            }
          });

          // Update active component after recording if needed
          chrome.runtime.sendMessage(
            { action: 'setActiveComponent', payload: 'StepLoop' },
            (resp) => {
              if (resp && resp.success) {
                console.log('Global state updated to StepLoop');
              } else {
                console.error('Failed to update global state');
              }
            }
          );
        } else {
          console.error('Failed to record task');
        }
      }
    );
  };

  return (
    <div>
      <h1>Step Creator</h1>
      {steps.map((step, index) => (
        <div key={step.id} style={{ marginBottom: '10px' }}>
          {editingIndex === index ? (
            <>
              <input
                type="text"
                value={editingText}
                onChange={handleEditingChange}
                onKeyDown={handleKeyDown}
              />
              <button onClick={() => handleSaveEdit(index)}>Save</button>
            </>
          ) : (
            <>
              <span>{`Step ${step.id}: ${step.name}`}</span>
              <button onClick={() => handleEditStep(index)}>Edit</button>
            </>
          )}
          <button onClick={() => handleDeleteStep(index)}>Delete</button>
        </div>
      ))}
      <input
        type="text"
        value={currentInput}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Enter step"
      />
      <button onClick={handleAddStep}>Add Step</button>
      <br />
      <button onClick={handleDone}>Done</button>
    </div>
  );
}

export default StepCreator;
