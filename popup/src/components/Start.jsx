import React, { useState, useEffect } from 'react';
import { addTask, getTasks } from '../storage/db';
import './styles/Start.css'

function Start({ setActiveComponent }) {
  const [tasks, setTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [error, setError] = useState('');
  const [filesLoaded, setFilesLoaded] = useState(false);

  // On mount, get the global filesLoaded state from the background script.
  useEffect(() => {
    chrome.runtime.sendMessage({ action: 'getFilesLoaded' }, (response) => {
      if (response && typeof response.filesLoaded === 'boolean') {
        setFilesLoaded(response.filesLoaded);
      }
    });
  }, []);

  // When files are loaded, fetch tasks from IndexedDB.
  useEffect(() => {
    if (filesLoaded) {
      fetchTasksFromDB();
    }
  }, [filesLoaded]);

  const fetchTasksFromDB = async () => {
    try {
      const dbTasks = await getTasks();
      setTasks(dbTasks);

      // Find tasks that are not marked as done.
      const notDone = dbTasks.filter(
        (t) => !t.status || t.status.toLowerCase() !== 'done'
      );

      if (notDone.length === 0) {
        setActiveTask(null);
        setError(
          'This task list has been completed. Please load a different task list.'
        );
      } else {
        // Pick a random active task.
        const randomIndex = Math.floor(Math.random() * notDone.length);
        setActiveTask(notDone[randomIndex]);
        setError('');
      }
    } catch (err) {
      setError(`Error retrieving tasks from DB: ${err.message}`);
      setTasks([]);
      setActiveTask(null);
    }
  };

  // Handle file upload.
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (!Array.isArray(json)) {
          throw new Error('Invalid structure: Expected an array of tasks.');
        }

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

        // Save tasks locally and add new ones to the DB.
        setTasks(json);
        const dbTasks = await getTasks();

        for (let task of json) {
          const exists = dbTasks.some(
            (t) =>
              t.name === task.name &&
              t.startUrl === task.startUrl &&
              JSON.stringify(t.objectives) === JSON.stringify(task.objectives)
          );
          if (!exists) {
            await addTask(task);
          }
        }

        // Refresh tasks from the DB.
        const updatedDbTasks = await getTasks();
        const fileTaskNames = json.map((task) => task.name);
        const tasksInDb = updatedDbTasks.filter((t) =>
          fileTaskNames.includes(t.name)
        );

        // Check if all tasks are done.
        const allDone = tasksInDb.every(
          (t) => t.status && t.status.toLowerCase() === 'done'
        );

        if (allDone) {
          setActiveTask(null);
          updateFilesLoaded(true);
          setError(
            'This task list has been completed. Please load a different task list.'
          );
        } else {
          const notDone = tasksInDb.filter(
            (t) => !t.status || t.status.toLowerCase() !== 'done'
          );
          const randomIndex = Math.floor(Math.random() * notDone.length);
          setActiveTask(notDone[randomIndex]);
          updateFilesLoaded(true);
          setError('');
        }
      } catch (err) {
        setError(err.message);
        setTasks([]);
        setActiveTask(null);
        updateFilesLoaded(false);
      }
    };

    reader.onerror = () => {
      setError('Error reading file.');
      updateFilesLoaded(false);
    };

    reader.readAsText(file);
  };

  // Helper to update the global filesLoaded state.
  const updateFilesLoaded = (value) => {
    chrome.runtime.sendMessage(
      { action: 'setFilesLoaded', payload: value },
      (response) => {
        if (response && response.success) {
          setFilesLoaded(response.filesLoaded);
        }
      }
    );
  };

  // Opens the file prompt.
  const openFilePrompt = () => {
    document.getElementById('taskFileInput').click();
  };

  // Start a task by updating the active component and recording the task in the background state.
  const startTask = () => {
    if (activeTask) {
      // Change active component in the UI.
      setActiveComponent('StepCreator');
      chrome.runtime.sendMessage(
        { action: 'setActiveComponent', payload: 'StepCreator' },
        (response) => {
          console.log('Active component changed:', response);
        }
      );

      // Update basic task info.
      chrome.runtime.sendMessage(
        {
          action: 'updateTaskInfo',
          payload: {
            id: activeTask.id, // pass the id along!
            name: activeTask.name,
            objectives: activeTask.objectives,
            startUrl: activeTask.startUrl,
          },
        },
        (response) => {
          console.log('Task info updated:', response);
        }
      );

      // Initialize steps and active step index.
      chrome.runtime.sendMessage(
        {
          action: 'updateTaskSteps',
          payload: {
            steps: [], // Start with an empty steps array.
            activeStepIndex: 0,
          },
        },
        (response) => {
          console.log('Task steps updated:', response);
        }
      );
    }
  };

  return (
    <div className="start-container">
      <h1>Start Component</h1>

      {/* Only offer file upload if tasks haven't been loaded yet */}
      {!filesLoaded && (
        <button onClick={openFilePrompt}>Add Task List</button>
      )}

      <input
        id="taskFileInput"
        type="file"
        accept="application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Display any errors */}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Render active task UI */}
      {filesLoaded && activeTask && (
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
