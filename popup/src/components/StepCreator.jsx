import React, { useState } from 'react';

function StepCreator() {
  const [steps, setSteps] = useState([]);
  const [currentInput, setCurrentInput] = useState('');

  // Updates the current input value
  const handleInputChange = (e) => {
    setCurrentInput(e.target.value);
  };

  // Adds the current input as a new step if it's not empty
  const handleAddStep = () => {
    if (currentInput.trim() !== '') {
      setSteps([...steps, currentInput]);
      setCurrentInput('');
    }
  };

  // Handle Enter key press to add a step
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddStep();
    }
  };

  // When done, update the global state to "StepLoop"
  const handleDone = () => {
    chrome.runtime.sendMessage(
      { action: 'setActiveComponent', payload: 'StepLoop' },
      (response) => {
        if (response && response.success) {
          console.log('Global state updated to StepLoop');
        } else {
          console.error('Failed to update global state');
        }
      }
    );
  };

  return (
    <div>
      <h1>Step Creator</h1>
      {/* Render each step in its own div */}
      {steps.map((step, index) => (
        <div key={index} style={{ marginBottom: '10px' }}>
          {step}
        </div>
      ))}
      {/* Input for new step */}
      <input
        type="text"
        value={currentInput}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Enter step"
      />
      <button onClick={handleAddStep}>Add Step</button>
      <br />
      {/* Done button to update the global state */}
      <button onClick={handleDone}>Done</button>
    </div>
  );
}

export default StepCreator;
