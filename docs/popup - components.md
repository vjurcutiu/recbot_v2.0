# Popup Components Documentation

This document details the various popup components and their roles in guiding users through the task process.

## End Component (End.jsx)

**Purpose:**  
The End component finalizes a task. It retrieves the current task from background state, exports collected data, and marks the task as completed.

**Key Behaviors:**
- On mounting, it requests the record state to display task details.
- Automatically triggers an export action to save state and screenshots.
- Provides buttons to either move on to the next task or finish the current one.  
- Uses a helper function (from storage) to mark the task as done.

## Start Component (Start.jsx)

**Purpose:**  
The Start component handles task selection and file upload. It retrieves tasks from storage and allows users to load a new task list if none are available.

**Key Behaviors:**
- Queries the global `filesLoaded` state from the background.
- If tasks are loaded, fetches them from IndexedDB and selects an active task at random.
- Offers a file upload prompt to add new task lists if none are loaded.
- Initiates a task by sending messages to update task info and transition to the Step Creator.


## Step Creator (StepCreator.jsx)

**Purpose:**  
The Step Creator component allows users to define the steps for a task. It integrates the StepSubCreator to handle the addition, editing, and deletion of steps.

**Key Behaviors:**
- Retrieves the current task from background state on mounting.
- Utilizes StepSubCreator to dynamically add steps to the task.
- Validates that at least one step exists before transitioning to the next phase.
- On completion, it sends messages to update task steps, switches the active view to the Step Loop, and opens a new tab for recording.


## Step Loop (StepLoop.jsx)

**Purpose:**  
The Step Loop component manages the progression through task steps. It displays a list of steps, allows in-line editing, and provides options for advancing or replanning steps.

**Key Behaviors:**
- Retrieves current task data, including active step and step list.
- Offers a "Next" function to move to the subsequent step, updating both local and background state.
- Implements a replanning mechanism by truncating future steps and enabling new step input via the StepSubCreator.
- Integrates StepSubLoop for detailed interactions on each step.


## Step Sub-Creator (StepSubCreator.jsx)

**Purpose:**  
This sub-component provides a user interface for adding and editing individual steps within a task.

**Key Behaviors:**
- Allows users to input a new step name and add it to the list.
- Supports in-line editing with controls to save or delete steps.
- Recalculates step IDs based on a base number to ensure consistency.
- Sends updates to the background state so that changes are persisted.

## Step Sub-Loop (StepSubLoop.jsx)

**Purpose:**  
The Step Sub-Loop handles detailed interactions for a specific step. It gathers user feedback through toggle options and a reason input to determine the next course of action.

**Key Behaviors:**
- Captures a textual reason for the user's decision, updating background state accordingly.
- Provides toggle options to indicate if the current step was completed, if the user feels closer to a solution, or if replanning is needed.
- Depending on the toggles:
  - Moves to the next step.
  - Adds a new fragment if the user indicates progress.
  - Initiates replanning if required, by resetting the fragment index or invoking the replanning workflow.
- Offers "Back" buttons to allow users to revise their responses before finalizing decisions.

---

Each component interacts with the background state via Chrome messaging, ensuring that changes in the UI are consistently reflected in the underlying task state. This modular design provides a clear workflow from task initiation (Start) through step definition (Step Creator) and review (Step Loop with Step Sub-Loop), culminating in task completion (End).