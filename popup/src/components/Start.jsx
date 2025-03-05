import React, { useState } from 'react';

function Start() {
  const [tasks, setTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [error, setError] = useState('');
  const [fileLoaded, setFileLoaded] = useState(false);

  // Triggered when the file input changes.
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        // Validate that the file is an array.
        if (!Array.isArray(json)) {
          throw new Error('Invalid structure: Expected an array of tasks.');
        }
        // Validate each task object.
        json.forEach((task) => {
          if (
            typeof task.name !== 'string' ||
            !Array.isArray(task.objectives) ||
            typeof task.startUrl !== 'string'
          ) {
            throw new Error(
              'Invalid structure: Each task must have a name (string), objectives (array), and startUrl (string).'
            );
          }
        });
        // Set tasks and automatically pick a random task.
        setTasks(json);
        const randomIndex = Math.floor(Math.random() * json.length);
        setActiveTask(json[randomIndex]);
        setFileLoaded(true);
        setError('');
      } catch (err) {
        setError(err.message);
        setTasks([]);
        setActiveTask(null);
        setFileLoaded(false);
      }
    };

    reader.onerror = () => {
      setError('Error reading file.');
    };

    reader.readAsText(file);
  };

  // Opens the file selection dialog.
  const openFilePrompt = () => {
    document.getElementById('taskFileInput').click();
  };

  // Start the task:
  // Instead of opening a new tab or window, send a message to the background script to change the active component to 'StepCreator'
  const startTask = () => {
    if (activeTask) {
      chrome.runtime.sendMessage(
        { action: 'setActiveComponent', payload: 'StepCreator' },
        (response) => {
          if (response && response.success) {
            console.log('Global state updated to StepCreator');
          } else {
            console.error('Failed to update global state');
          }
        }
      );
    }
  };

  return (
    <div>
      <h1>Start Component</h1>
      {!fileLoaded && (
        <button onClick={openFilePrompt}>Add Task List</button>
      )}

      {/* Hidden file input for selecting a JSON file */}
      <input
        id="taskFileInput"
        type="file"
        accept="application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {fileLoaded && activeTask && (
        <div style={{ marginTop: '20px' }}>
          <h2>{activeTask.name}</h2>
          <p>
            <strong>Start URL: </strong>
            <a
              href={activeTask.startUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {activeTask.startUrl}
            </a>
          </p>
          <h3>Objectives:</h3>
          <ul>
            {activeTask.objectives.map((objective, index) => (
              <li key={index}>{objective}</li>
            ))}
          </ul>
          <button onClick={startTask}>Start Task</button>
        </div>
      )}
    </div>
  );
}

export default Start;
