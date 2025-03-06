import React, { useState } from 'react';

function StepSubCreator({ steps, setSteps, baseStepNumber = 0 }) {
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

  const handleInputChange = (e) => {
    setCurrentInput(e.target.value);
  };

  const handleAddStep = () => {
    if (currentInput.trim() !== '') {
      const newStep = { name: currentInput };
      const newSteps = recalcIds([...steps, newStep]);
      setSteps(newSteps);
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
    setSteps(recalcIds(newSteps));
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
      setSteps(recalcIds(newSteps));
      setEditingIndex(-1);
      setEditingText('');
    }
  };

  return (
    <div>
      <h2>Replan Steps</h2>
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
    </div>
  );
}

export default StepSubCreator;
