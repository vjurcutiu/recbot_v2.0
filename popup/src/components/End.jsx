import React from 'react';
import { useDispatch } from 'react-redux';
import { updateActiveComponent } from '../services/uiStateManagement';

function End() {
  const dispatch = useDispatch();

  const handleNextTask = () => {
    // Navigate back to the Start component for a new task.
    dispatch(updateActiveComponent('Start'));
  };

  const handleDone = () => {
    // Finalize the process. Here, we'll close the window.
    window.close();
  };

  return (
    <div>
      <h1>End Component</h1>
      <p>Task completed!</p>
      <div style={{ marginTop: '20px' }}>
        <button onClick={handleNextTask}>Next Task</button>
        <button onClick={handleDone}>Done</button>
      </div>
    </div>
  );
}

export default End;
