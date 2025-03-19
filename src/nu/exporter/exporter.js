import JSZip from 'jszip';
import { blobToDataUrl } from './exportUtils.js';
import { recordState } from '../stateManagement/stateManagement.js';

// Helper function to safely encode a Unicode string to base64
function b64EncodeUnicode(str) {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
      return String.fromCharCode('0x' + p1);
    })
  );
}

export function exportRecordState() {
  try {
    // Convert recordState object to a JSON string with formatting
    const json = JSON.stringify(recordState, null, 2);
    // Encode the JSON string in base64 using the Unicode-safe encoding function
    const base64 = b64EncodeUnicode(json);
    // Create a data URL for the JSON blob
    const dataUrl = `data:application/json;base64,${base64}`;
    // Create a filename using a timestamp
    const filename = `recordState-${Date.now()}.json`;
    // Use Chrome's downloads API to trigger the download
    chrome.downloads.download({
      url: dataUrl,
      filename,
      saveAs: false,
      conflictAction: 'uniquify'
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error("Error downloading recordState:", chrome.runtime.lastError.message);
      } else {
        console.log("Record state export complete. Download ID:", downloadId);
      }
    });
  } catch (err) {
    console.error("Failed to export record state:", err);
  }
}

/**
 * Exports the screenshots contained in the screenshotQueue by creating a ZIP archive.
 *
 * @param {Array} screenshotQueue - An array of screenshot objects.
 * Each object should have a `filename` and a `dataUrl` property.
 * @param {Function} [onComplete] - Optional callback invoked after download completes.
 */
export function exportScreenshots(screenshotQueue, onComplete) {
  try {
    const zip = new JSZip();
    screenshotQueue.forEach(item => {
      // Extract the base64 data (after the comma)
      const base64Data = item.dataUrl.split(',')[1];
      zip.file(item.filename, base64Data, { base64: true });
    });
    zip.generateAsync({ type: "blob" })
      .then((blob) => blobToDataUrl(blob))
      .then((dataUrl) => {
        chrome.downloads.download({
          url: dataUrl,
          filename: "screenshots.zip",
          saveAs: true,
          conflictAction: 'uniquify'
        }, (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error("Error downloading screenshot archive:", chrome.runtime.lastError.message);
          } else {
            console.log("Screenshot archive downloaded successfully. Download ID:", downloadId);
            // Optionally, you can clear the screenshot queue here if desired.
            if (onComplete) {
              onComplete();
            }
          }
        });
      })
      .catch((err) => {
        console.error("Error creating archive:", err);
      });
  } catch (err) {
    console.error("Error in exportScreenshots:", err);
  }
}
