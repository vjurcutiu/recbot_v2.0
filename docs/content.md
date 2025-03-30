# Content Script Documentation

This document describes the content script for the extension. The content script is comprised of several modules that work together to capture user interactions, track dynamic changes in the page, and communicate with the background script.

## Overview

The content script initializes itself through the main module and then sets up communication with the background script. It attaches event listeners, observes DOM mutations, and captures various events and element details. These components ensure that user interactions and dynamic content are logged and processed efficiently.

## Modules

### main.js

**Purpose:**  
The main module is the entry point for the content script. It checks that the script is running in the top frame before initializing communication and event tracking.

**Key Functions:**
- `setupCommunication`: Configures the messaging interface with the background script.
- DOM stability: Waits for the DOM to stabilize before logging the page load event.
- Initialization: Notifies the background script that the content script is ready.

**Workflow:**  
When the page loads, the module waits for a stable DOM state and logs a `pageLoad` event. It also sends a `contentScriptReady` message to confirm initialization.

### communication.js

**Purpose:**  
This module handles message exchanges between the content script and the background script. It listens for commands like `start`, `stop`, `pause`, and `resume` and triggers the appropriate tracking actions.

**Key Functions:**
- Responds to a `ping` request.
- On receiving `start`, it calls functions to initialize tracking, capture interactable elements, record the current URL, and trigger a screenshot.
- For `stop`, `pause`, and `resume` commands, it adjusts the event tracking state and manages the event buffer accordingly.

**Integration:**  
This module ties the background messaging with the event tracking logic provided by the other modules.

### domUtils.js

**Purpose:**  
Provides utility functions for working with the DOM. It helps generate unique selectors and XPaths, and captures details of interactable elements.

**Key Functions:**
- `getXPath` and `getElementTreeXPath`: Compute unique XPath for a given element.
- `getElementSelector` and `getElementDetails`: Extract CSS selectors and detailed element properties (tag name, id, classes).
- `captureInteractableElements`: Gathers data on interactive elements (e.g., links, buttons, inputs) and sends the information to the background script.

**Usage:**  
The `captureInteractableElements` function is invoked to log elements that users might interact with, ensuring that their details are recorded and sent for further processing.

### eventHandlers.js

**Purpose:**  
Defines the functions that handle various user and system events, such as clicks, mouse movements, scrolls, and key presses.

**Key Event Handlers:**
- `handleClick`: Captures click events, logs element details, and triggers a pause command when appropriate.
- `handleContextMenu`: Processes right-click events.
- `handleMouseMove`: Buffers mouse movement events and logs the start and end positions.
- `handleScroll` and `handleResize`: Log changes in scroll position and window dimensions.
- `handleInput` and `handleKeydown`: Capture user input and key press events.
- `handleUrlChange` and `handleFormSubmit`: Track URL changes and form submissions, respectively.

**Integration:**  
Each handler logs an event with details about the interaction and, in some cases, triggers a screenshot capture. They rely on helper functions from `domUtils.js` to extract element information.

### eventManagement.js

**Purpose:**  
Manages the collection, buffering, and dispatching of events captured by the event handlers. It also controls the state of tracking (active, paused, or stopped).

**Key Functions:**
- `addEvent`: Adds event records to an internal buffer.
- `flushEventBuffer`: Sends buffered events to the background script for logging.
- `timedBuffer`: Schedules a flush of the event buffer after a set delay.
- `pauseTracking`, `resumeTracking`, `startTracking): Adjust the tracking state and flush buffered events when necessary.
- `attachEventListeners` and `removeEventListeners`: Add or remove event listeners for capturing user interactions.

**Workflow:**  
When tracking is active, events are buffered and later flushed (either immediately or after a delay) to ensure that the event order is preserved and communicated properly.

### observers.js

**Purpose:**  
Observes changes in the DOM, such as dynamic content loading or mutations. This ensures that any new interactable elements or significant page changes are captured.

**Key Functions:**
- `observeDynamicContent`: Monitors the DOM for new elements that are visible and interactable, then logs a `dynamicContentLoad` event.
- `observeDomMutations`: Watches for changes in the DOM structure and logs `domMutation` events when relevant mutations occur.
- `waitForStableDOM`: Waits for the DOM to settle before executing a callback, ensuring that initial events (like page load) are logged accurately.

**Usage:**  
The observer functions are triggered on initialization to continuously monitor the DOM for changes, ensuring that dynamic interactions are not missed.

## How It All Works Together

- The `main.js` module serves as the starting point. It sets up communication with the background script and initializes tracking only in the top frame.
- The `communication.js` module listens for commands from the background script and routes them to appropriate functions in the event management and handlers.
- Event listeners defined in `eventHandlers.js` capture various user interactions. These events are added to a buffer managed by `eventManagement.js`, ensuring they are sent in the correct order.
- The `domUtils.js` module provides helper functions to extract detailed information about DOM elements, which is crucial for logging user interactions.
- Observers in `observers.js` continuously monitor the DOM for mutations and dynamic content, triggering additional events when significant changes occur.

This modular design ensures that the content script is efficient, responsive, and capable of capturing a comprehensive log of user interactions and page changes. The clear separation of concerns makes the system maintainable and scalable for future enhancements.