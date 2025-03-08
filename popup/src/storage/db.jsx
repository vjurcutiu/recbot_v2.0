// First, install Dexie via npm or include it via a script tag.
// For npm: npm install dexie

import Dexie from 'dexie';

// Define a new Dexie database
const db = new Dexie('Task Storage');

// Define the database schema for version 1
db.version(1).stores({
  tasks: '++id, name, objectives, startUrl, status' // id is auto-incremented
});

// Function to add a new task
export async function addTask(task) {
  try {
    const id = await db.tasks.add(task);
    console.log('Task added with id:', id);
  } catch (error) {
    console.error('Error adding task:', error);
  }
}

// Function to retrieve all tasks
export async function getTasks() {
  try {
    const tasks = await db.tasks.toArray();
    console.log('Retrieved tasks:', tasks);
    return tasks;
  } catch (error) {
    console.error('Error retrieving tasks:', error);
  }
}

// Function to update a task by id
export async function updateTask(id, updatedData) {
  try {
    const updated = await db.tasks.update(id, updatedData);
    if (updated) {
      console.log(`Task ${id} updated successfully`);
    } else {
      console.log(`No task found with id ${id}`);
    }
  } catch (error) {
    console.error('Error updating task:', error);
  }
}

// Function to delete a task by id
export async function deleteTask(id) {
  try {
    await db.tasks.delete(id);
    console.log(`Task ${id} deleted successfully`);
  } catch (error) {
    console.error('Error deleting task:', error);
  }
}
