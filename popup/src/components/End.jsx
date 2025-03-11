// End.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTask } from '../storage/db';

function End() {
  const dispatch = useDispatch();
  // Get the active task from the Redux store, now including the unique id.
  const activeTask = useSelector((state) => state.recordState.currentTask);

  // This function updates the task in the DB using the stored unique id.
  const completeTask = async () => {
    try {
      if (activeTask && activeTask.id) {
        await updateTask(activeTask.id, { status: 'done' });
        console.log(`Task ${activeTask.id} marked as done.`);
      } else {
        console.log('No active task id found.');
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleNextTask = async () => {
    await completeTask();
    // Set active component to "Start" via background script
    chrome.runtime.sendMessage(
      { action: 'setActiveComponent', payload: 'Start' },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error setting active component:', chrome.runtime.lastError);
        } else {
          console.log('Active component updated to:', response.activeComponent);
        }
      }
    );
  };

  const handleDone = async () => {
    await completeTask();
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
