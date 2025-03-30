# Overview of the Extension Architecture

The extension is composed of three main components that work together seamlessly to provide its functionality: the background script, the content script, and the popup interface.

## Background Script

The background script serves as the central hub for the extension. It listens for messages from both the content and popup components, manages long-running tasks, and handles browser events. Its responsibilities include:

- Routing messages and delegating actions to appropriate modules (such as state management and context tracking).
- Coordinating tasks like recording screenshots, updating task state, and exporting data.
- Monitoring browser tab events (creation, activation, removal) to maintain context and manage recording sessions.

## Content Script

Injected into web pages, the content script operates directly in the context of the loaded page. Its primary functions include:

- Capturing user interactions such as clicks, scrolls, mouse movements, and input events.
- Observing dynamic content and DOM mutations to ensure no interaction is missed.
- Utilizing utility functions to extract detailed information about page elements and forwarding this data to the background script.
- Establishing communication with the background script to synchronize tracking states and initiate actions like starting or pausing recording.

## Popup Interface

The popup interface provides a user-friendly front end for interacting with the extension. It allows users to:

- Initiate and manage tasks by loading task lists, selecting active tasks, and transitioning through different stages of a task.
- Edit and update task details using components for step creation, review, and replanning.
- Trigger actions (like opening a new window or exporting task data) via clearly defined buttons and controls.
- Monitor and adjust UI state using services that interact with both the background state and local storage.

Together, these components create a robust system where the background script handles persistent processing and coordination, the content script captures and relays live user interactions, and the popup interface offers an intuitive control panel. This architecture ensures that the extension remains maintainable, scalable, and responsive to both user actions and dynamic web content.