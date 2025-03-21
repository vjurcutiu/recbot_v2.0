export function updateAndAddFragment({ stepIndex, currentFragmentIndex, updateData, newFragmentData }, callback) {
    // First, update the current fragment.
    chrome.runtime.sendMessage(
      {
        action: 'updateFragment',
        payload: {
          stepIndex,
          fragmentIndex: currentFragmentIndex,
          fragmentData: updateData,
        },
      },
      (updateResponse) => {
        if (updateResponse && updateResponse.success) {
          // Then, add a new fragment.
          chrome.runtime.sendMessage(
            {
              action: 'addFragment',
              payload: {
                stepIndex,
                fragment: newFragmentData,
              },
            },
            (addResponse) => {
              if (addResponse && addResponse.success) {
                callback(null, addResponse.addedFragment);
              } else {
                callback(addResponse && addResponse.error ? addResponse.error : 'Error adding fragment');
              }
            }
          );
        } else {
          callback(updateResponse && updateResponse.error ? updateResponse.error : 'Error updating fragment');
        }
      }
    );
  }