## Database Service (db.jsx)

**Purpose:**
This service leverages Dexie.js to create and manage an IndexedDB database for task storage. It provides asynchronous functions to add, retrieve, update, and delete tasks. Tasks are stored with properties such as name, objectives, start URL, and status.

**Key Functions:**

`addTask(task)`: Adds a new task to the database and logs its assigned ID.

`getTasks()`: Retrieves all tasks as an array.

`updateTask(id, updatedData)`: Updates a task based on its unique ID.

`deleteTask(id)`: Deletes a task from the database.

This service ensures that task data persists between sessions and supports the popup's task management workflows.