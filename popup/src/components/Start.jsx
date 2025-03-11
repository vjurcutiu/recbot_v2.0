// Start.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateRecordTask,
  setFilesLoaded,
} from '../services/uiStateManagement';
import { addTask, getTasks } from '../storage/db';

function Start() {
  const dispatch = useDispatch();

  // Local states for tasks, the currently active task, and any error message.
  const [tasks, setTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [error, setError] = useState('');

  // Redux state indicating whether tasks have been loaded.
  const areFilesLoaded = useSelector((state) => state.areFilesLoaded);

  // Set "Start" as the active component via background script once mounted
  useEffect(() => {
    chrome.runtime.sendMessage(
      { action: 'setActiveComponent', payload: 'Start' },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error setting active component:', chrome.runtime.lastError);
        } else {
          console.log('Active component set to:', response.activeComponent);
        }
      }
    );
  }, []);

  // Once files are loaded, fetch tasks directly from IndexedDB (Dexie)
  useEffect(() => {
    if (areFilesLoaded) {
      fetchTasksFromDB();
    }
    // eslint-disable-next-line
  }, [areFilesLoaded]);

  const fetchTasksFromDB = async () => {
    try {
      const dbTasks = await getTasks();
      setTasks(dbTasks);

      // Find tasks that are not marked as done
      const notDone = dbTasks.filter(
        (t) => !t.status || t.status.toLowerCase() !== 'done'
      );

      if (notDone.length === 0) {
        setActiveTask(null);
        setError(
          'This task list has been completed. Please load a different task list.'
        );
      } else {
        // Pick a random active task from those not done
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

  // Handle file selection when tasks haven't been loaded yet
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        // Parse the JSON contents
        const json = JSON.parse(event.target.result);

        // Validate top-level format
        if (!Array.isArray(json)) {
          throw new Error('Invalid structure: Expected an array of tasks.');
        }
        // Validate each task's structure
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

        // If validation passes, store tasks in local state
        setTasks(json);

        // Pull any existing tasks from IndexedDB
        const dbTasks = await getTasks();

        // For each new task, check if an identical one exists. If not, add it.
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

        // Refresh tasks from DB so we can pick the next active task
        const updatedDbTasks = await getTasks();
        const fileTaskNames = json.map((task) => task.name);
        const tasksInDb = updatedDbTasks.filter((t) =>
          fileTaskNames.includes(t.name)
        );

        // Check if *all* tasks in the JSON are already marked as 'done'
        const allDone = tasksInDb.every(
          (t) => t.status && t.status.toLowerCase() === 'done'
        );

        if (allDone) {
          setActiveTask(null);
          dispatch(setFilesLoaded(true));
          setError(
            'This task list has been completed. Please load a different task list.'
          );
        } else {
          // Pick a random task among those not done for the activeTask
          const notDone = tasksInDb.filter(
            (t) => !t.status || t.status.toLowerCase() !== 'done'
          );
          const randomIndex = Math.floor(Math.random() * notDone.length);
          setActiveTask(notDone[randomIndex]);
          dispatch(setFilesLoaded(true));
          setError('');
        }
      } catch (err) {
        setError(err.message);
        setTasks([]);
        setActiveTask(null);
        dispatch(setFilesLoaded(false));
      }
    };

    reader.onerror = () => {
      setError('Error reading file.');
      dispatch(setFilesLoaded(false));
    };

    // Read the user-provided JSON file
    reader.readAsText(file);
  };

  // Opens the file prompt
  const openFilePrompt = () => {
    document.getElementById('taskFileInput').click();
  };

  // Start an individual task by sending a message to update the background's global state for the active component,
  // then using Redux to record the task.
  const startTask = () => {
    if (activeTask) {
      // Set the active component to "StepCreator" via background script
      chrome.runtime.sendMessage(
        { action: 'setActiveComponent', payload: 'StepCreator' },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error setting active component:', chrome.runtime.lastError);
          } else {
            console.log('Active component updated to:', response.activeComponent);
          }
        }
      );

      // Record the task in Redux (and potentially, in the background's global state via the redux action if needed)
      dispatch(
        updateRecordTask({
          id: activeTask.id, // The DB's unique ID, if available
          name: activeTask.name,
          objectives: activeTask.objectives,
          startUrl: activeTask.startUrl,
        })
      );
    }
  };

  return (
    <div>
      <h1>Start Component</h1>

      {/* Only offer file upload if tasks aren't loaded yet */}
      {!areFilesLoaded && (
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

      {/* Render the active task UI if tasks are loaded and an active task exists */}
      {areFilesLoaded && activeTask && (
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
