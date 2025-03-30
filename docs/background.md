# Documentation for the Background Script and State Management Module

This document details the inner workings of the extension by covering the background script and the state management module. These components work together to manage recording tasks, state updates, communication between parts of the extension, and integration with browser events.

## 1. Background Script

**Purpose:**
The background script acts as the central controller for this extension. It routes messages between the content scripts, UI components, and the state management module, while also handling browser events such as tab creation, activation, and removal.

**Key Components and Responsibilities:**

**Imports and Dependencies:**

Imports state management functions and objects (e.g. `globalState`, `recordState`, `updateRecordStateWithScreenshot`, `updateRecordStateWithUrl`, and `handleMessage`).

Imports context management functions (`createContext`, `removeContext`, `getContext`) to track the state of different tabs.

Imports exporter functions (`exportRecordState`, `exportScreenshots`) for saving state and screenshots.

**Internal Variables:**

`windowOpened`: Boolean flag to prevent multiple UI windows from opening simultaneously.

`screenshotQueue`: An array that stores screenshot data awaiting export.

`screenshotCounter`: A counter to uniquely label each captured screenshot.

`stateManagementActions`: A set of action names that, when received via messages, are delegated to the state management module.

**Key Functions:**

`ensureFirstStepAndFragment()`
Ensures that the current task in the record state contains at least one step and one fragment. This guarantees that subsequent state updates have a valid target structure.

`openStartWindow(delay, autoCloseAfter)`
Opens a popup window (using `start.html`) as the extension’s user interface. It uses a delay to prevent immediate re-entrance, sets a flag to avoid duplicate windows, and optionally auto-closes the window after a specified duration.

`ensureContentScript(tabId, callback, retries)`
Verifies that the content script is active in the specified tab by sending a “ping” message. If the content script does not respond, the function retries a set number of times before logging an error.

`pauseRecordingForTab(tabId, sendResponse)`
Pauses the recording process for a given tab. It retrieves the current context for the tab, updates the recording status in the local storage, sends a pause message to the content script, and opens the start window to allow the user to resume later.

**Message Routing and Event Handling:**

`chrome.runtime.onMessage` Listener
This listener is the main router for incoming messages. It checks if the message action is part of `stateManagementActions` and delegates to the state management module’s `handleMessage` function if so. Otherwise, it handles actions directly such as:

- Updating active components and file load status

- Recording tasks and capturing screenshots

- Handling UI-triggered actions (e.g. `openWindow`, `start-recording-from-ui`, `stopRecording`, `resumeRecording`)

- Exporting state and screenshots

- `chrome.tabs` and `chrome.webNavigation` Event Listeners

`onRemoved`: Cleans up by removing contexts when tabs are closed.

`onCreated` and `onActivated`: Monitors the lifecycle of tabs to update allowed tab lists and designate the recording tab.

`onCreatedNavigationTarget`: Adds new tabs that originate from allowed tabs, creates context for them, and initiates recording.

**Additional Behaviors:**

**Screenshot Capture:**
When the `takeScreenshot` action is triggered, the background script captures a screenshot of the active tab, queues it with a unique filename, and updates the record state with the new screenshot.

**Export Functionality:**
On receiving the `export` action, it invokes functions to export the current record state and the queued screenshots, clearing the screenshot queue afterward.

## 2. State Management Module

**Purpose:**
The state management module maintains the internal state of this extension, handling updates to task details, fragments, and recording actions. It ensures that state changes are logged and that the data structure remains consistent as the user interacts with the extension.

**Key Components and Data Structures:**

`\globalState`:
A global object storing:

- `activeComponent`: The current active component.

- `filesLoaded`: Boolean flag indicating if required files have loaded.

- `allowedTabIds`: An array of tab IDs permitted for recording.

- `recordingTabId`: The active tab ID designated for recording.

- `recording`: Boolean flag to indicate if recording is in progress.

`\recordState`:
An object representing the current task with properties such as:

- `id`, `name`, `objectives`, `startUrl`

- `activeStepIndex` and `activeFragmentIndex`: Indicators for tracking progress.

- `steps`: An array where each step contains fragments with actions, interactable elements, screenshots, and toggle answers.

`\updateLog`:
An array that records all state changes with a timestamp, which aids in debugging and tracking the evolution of the state.

**Key Functions:**

`logUpdate(action, payload)`
A helper function that creates a log entry (with a timestamp and a deep copy of the payload) whenever a state update occurs. It then appends this entry to `updateLog` and logs it to the console.

`updateRecordStateWithUrl(url)`
Updates the `currentURL` property of the active fragment within the current task. It validates that the active step and fragment exist before updating and logs the change.

`updateRecordStateWithScreenshot(filename)`
Adds a screenshot filename to the active fragment’s `screenshots` array and logs the update.

`handleMessage(message, sender, sendResponse)`
Acts as the central handler for messages related to state changes. This function processes a variety of actions, including:

`setActiveComponent`: Updates the active component and notifies other parts of the extension.

`setFilesLoaded` and `getFilesLoaded`: Manage the flag that indicates if necessary files have been loaded.

`updateTaskInfo`: Updates basic details of the current task such as ID, name, objectives, and start URL.

`updateTaskSteps`: Replaces or modifies the steps of the current task while ensuring that each step has the proper fragment structure.

`updateToggleAnswers`: Modifies toggle answer data for a specific fragment.

`addFragment`: Adds a new fragment to a specific step and logs the addition.

`updateFragment`: Updates an existing fragment with new data.

`setActiveFragmentIndex` and `getActiveIndices`: Manage and retrieve the indices of the active step and fragment.

`updateActionsTaken`: Appends new action events to a fragment’s actions list.

`recordInteractableElements`: Logs and filters interactable elements to prevent duplicates, updating the fragment accordingly.

`getRecordState` and `getActiveComponent`: Retrieve the current state and active component.

**Communication with the Background Script:**
The state management module is tightly integrated with the background script. The background script delegates state-related messages to `handleMessage`, ensuring that updates to `globalState` and `recordState` are processed centrally and consistently across this extension.

## Summary

Together, the background script and the state management module form the core of this extension. The background script coordinates user interactions, browser events, and communication with content scripts, while the state management module maintains a consistent internal state, logs updates, and processes state-related messages. This separation of concerns allows this extension to be both modular and maintainable, ensuring reliable performance as users interact with its features.
