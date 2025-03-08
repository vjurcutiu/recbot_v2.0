import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateActiveComponent, updateRecordTask } from '../services/uiStateManagement';
import { addTask, getTasks } from '../storage/db';

function Start() {
  const dispatch = useDispatch();
  const [tasks, setTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [error, setError] = useState('');
  const [fileLoaded, setFileLoaded] = useState(false);

  // Relay that Start is the active component on mount.
  useEffect(() => {
    dispatch(updateActiveComponent('Start'));
  }, [dispatch]);

  // Triggered when the file input changes.
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        // Parse and validate JSON structure.
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
        setTasks(json);
        
        // Get current tasks from the DB.
        const dbTasks = await getTasks();
        
        // For each task in the file, check if a similar task exists; if not, add it.
        for (let task of json) {
          const exists = dbTasks.some((t) =>
            t.name === task.name &&
            t.startUrl === task.startUrl &&
            JSON.stringify(t.objectives) === JSON.stringify(task.objectives)
          );
          if (!exists) {
            await addTask(task);
          }
        }
        
        // Refresh tasks from the DB after adding new ones.
        const updatedDbTasks = await getTasks();
        const fileTaskNames = json.map((task) => task.name);
        const tasksInDb = updatedDbTasks.filter((t) => fileTaskNames.includes(t.name));
        
        // Check if all tasks are marked as 'Done'
        const allDone = tasksInDb.every(
          (t) => t.status && t.status.toLowerCase() === 'done'
        );
        
        if (allDone) {
          setActiveTask(null);
          setFileLoaded(true);
          setError('This task list has been completed. Please load a different task list.');
        } else {
          // Choose one random task that is not marked as done.
          const notDone = tasksInDb.filter(
            (t) => !t.status || t.status.toLowerCase() !== 'done'
          );
          const randomIndex = Math.floor(Math.random() * notDone.length);
          setActiveTask(notDone[randomIndex]);
          setFileLoaded(true);
          setError('');
        }
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

  // Start the task by updating the Redux store.
  const startTask = () => {
    if (activeTask) {
      dispatch(updateActiveComponent('StepCreator'));
      dispatch(
        updateRecordTask({
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
      {!fileLoaded && (
        <button onClick={openFilePrompt}>Add Task List</button>
      )}

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
