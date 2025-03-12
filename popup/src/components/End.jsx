import React, { useState, useEffect } from 'react';
import { updateTask } from '../storage/db';

function End({ setActiveComponent }) {
  const [activeTask, setActiveTask] = useState(null);

  // On mount, retrieve the current task from the background state.
  useEffect(() => {
    chrome.runtime.sendMessage({ action: 'getRecordState' }, (response) => {
      console.log(response)
      if (response && response.recordState && response.recordState.currentTask) {
        setActiveTask(response.recordState.currentTask);
        console.log('active task in end', response.recordState.currentTask)
      }
    });
  }, []);

  // Complete the task in the DB using the stored unique id.
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
    setActiveComponent('Start');
  };

  const handleDone = async () => {
    await completeTask();
    console.log('task done');
    window.close();
  };

  // New handler for exporting
  const handleExport = () => {
    chrome.runtime.sendMessage({ action: 'export' }, (response) => {
      console.log('Export response:', response);
    });
  };

  return (
    <div>
      <h1>End Component</h1>
      <p>Task completed!</p>
      <div style={{ marginTop: '20px' }}>
        <button onClick={handleNextTask}>Next Task</button>
        <button onClick={handleDone}>Done</button>
        <button onClick={handleExport}>Export</button>
      </div>
    </div>
  );
}

export default End;
