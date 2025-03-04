
/**
 * Opens a new window with the specified URL and options.
 * @param {string} url - The URL to load in the new window.
 * @param {Object} options - Optional custom settings for the window.
 * @returns {Promise} - Resolves with the created window object.
 */
export function openWindow(url, options = {}) {
    // Define default options
    const defaultOptions = {
      url, // The URL to load (usually a local HTML file that bootstraps your React app)
      type: 'popup',
      width: 800,
      height: 600,
      left: (screen.availWidth - 800) / 2,
      top: (screen.availHeight - 600) / 2,
    };
  
    // Merge default options with any custom options provided
    const finalOptions = { ...defaultOptions, ...options };
  
    return new Promise((resolve, reject) => {
      // chrome.windows.create is asynchronous and provides a callback with the window object
      chrome.windows.create(finalOptions, (newWindow) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(newWindow);
        }
      });
    });
  }