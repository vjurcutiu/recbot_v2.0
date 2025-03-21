import React, { useState, useEffect } from 'react';
import './styles/StepSubLoop.css'


function StepSubLoop({ activeStepIndex, onNext, onEnableReplan, isLastStep, setActiveComponent }) {
  // Consolidated state for toggle answers and reason.
  const [toggleAnswers, setToggleAnswers] = useState({
    reason: '',
    completed: null,
    closer: null,
    needsReplan: null,
  });
  
  const [reason, setReason] = useState('');
  const [submittedReason, setSubmittedReason] = useState(null);
  
  const [completed, setCompleted] = useState(null);
  const [closer, setCloser] = useState(null);
  const [needsReplan, setNeedsReplan] = useState(null);
  
  const [showCompleted, setShowCompleted] = useState(false);
  const [showCloser, setShowCloser] = useState(false);
  const [showNeedsReplan, setShowNeedsReplan] = useState(false);
  
  const [currentStep, setCurrentStep] = useState(null);
  // New state to track the active fragment index (defaulting to 0).
  const [activeFragmentIndex, setActiveFragmentIndex] = useState(0);

  useEffect(() => {
    chrome.runtime.sendMessage({ action: 'getActiveIndices' }, (response) => {
      if (response) {
        // Assuming response returns { activeStepIndex, activeFragmentIndex }
        setActiveFragmentIndex(response.activeFragmentIndex);
        // You can also check if response.activeStepIndex matches the prop activeStepIndex if needed.
      }
    });
  }, []);

  // Update toggle answers in background using the action "updateToggleAnswers".
  const updateToggleAnswer = (key, value) => {
    const newToggleAnswers = { ...toggleAnswers, [key]: value };
    setToggleAnswers(newToggleAnswers);
    chrome.runtime.sendMessage(
      { 
        action: 'updateToggleAnswers', 
        payload: { 
          toggleAnswers: newToggleAnswers, 
          activeStepIndex,
          fragmentIndex: activeFragmentIndex
        } 
      },
      (response) => {
        console.log(`${key} answer recorded:`, response);
      }
    );
  };

  // Handles submitting the reason.
  const handleReasonSubmit = (e) => {
    e.preventDefault();
    if (reason.trim() !== '') {
      setSubmittedReason(reason);
      updateToggleAnswer('reason', reason);
      setShowCompleted(true);
      setCurrentStep('completed');
    }
  };

  // Handles the Completed toggle.
  const handleCompletedChange = (answer) => {
    setCompleted(answer);
    updateToggleAnswer('completed', answer);
    if (answer === 'yes') {
      if (isLastStep) {
        setActiveComponent('End');
      } else {
        if (onNext) onNext();
      }
    } else if (answer === 'no') {
      setShowCloser(true);
      setCurrentStep('closer');
    }
  };

  const updateActiveFragmentIndex = (newIndex) => {
    chrome.runtime.sendMessage(
      { action: 'setActiveFragmentIndex', payload: { activeFragmentIndex: newIndex } },
      (response) => {
        console.log('Active fragment index updated:', response);
      }
    );
  };

  // Handles the Closer toggle.
  const handleCloserChange = (answer) => {
    setCloser(answer);
    updateToggleAnswer('closer', answer);
    if (answer === 'yes') {
      // Create a new fragment, update the active fragment index, resume recording, and close window.
      chrome.runtime.sendMessage(
        { 
          action: 'addFragment', 
          payload: { 
            stepIndex: activeStepIndex, 
            fragment: {
              // Snapshot the toggleAnswers for the fragment.
              toggleAnswers: { ...toggleAnswers, closer: answer },
              actionsTaken: [],
              interactableElements: [],
              screenshots: []
            }
          } 
        },
        (response) => {
          if (response && response.success) {
            updateActiveFragmentIndex(response.addedFragment.fragmentIndex);
            chrome.runtime.sendMessage({ action: 'resumeRecording' }, () => {
              window.close();
            });
          } else {
            console.error('Error adding fragment:', response && response.error);
          }
        }
      );
    } else {
      setShowNeedsReplan(true);
      setCurrentStep('closer');
    }
  };

// Handles the Replanning toggle.
const handleNeedsReplanChange = (answer) => {
  setNeedsReplan(answer);
  updateToggleAnswer('needsReplan', answer);
  if (answer === 'yes') {
    // For replanning "yes", do not create a new fragment.
    // Instead, reset the activeFragmentIndex to 0.
    chrome.runtime.sendMessage(
      { 
        action: 'setActiveFragmentIndex', 
        payload: { activeFragmentIndex: 0 }
      },
      (response) => {
        if (response && response.success) {
          if (onEnableReplan) onEnableReplan();
        } else {
          console.error('Error resetting fragment index:', response && response.error);
        }
      }
    );
  } else {
    // For "no" or "not sure", create a new fragment and update the index.
    chrome.runtime.sendMessage(
      { 
        action: 'addFragment', 
        payload: { 
          stepIndex: activeStepIndex, 
          fragment: {
            toggleAnswers: { ...toggleAnswers, needsReplan: answer },
            actionsTaken: [],
            interactableElements: [],
            screenshots: []
          }
        } 
      },
      (response) => {
        if (response && response.success) {
          updateActiveFragmentIndex(response.addedFragment.fragmentIndex);
          chrome.runtime.sendMessage({ action: 'resumeRecording' }, () => {
            window.close();
          });
        } else {
          console.error('Error adding fragment:', response && response.error);
        }
      }
    );
  }
};


  // Back navigation functions remain unchanged.
  const goBackFromCloser = () => {
    setShowCloser(false);
    setCloser(null);
    setCompleted(null);
    setCurrentStep('completed');
  };

  const goBackFromNeedsReplan = () => {
    setShowNeedsReplan(false);
    setNeedsReplan(null);
    setCloser(null);
    setCurrentStep('closer');
  };

  return (
    <div className="stepsubloop-container">
      {/* Reason Input */}
      <div className='stepsubloop-reason'>
        <p>What’s the reason you chose that action among all the possible actions?</p>
        {submittedReason ? (
          <div>
            <p>{submittedReason}</p>
            <button
              onClick={() => {
                setSubmittedReason(null);
                // Reset reason in toggleAnswers as well.
                updateToggleAnswer('reason', '');
                setShowCompleted(false);
                setShowCloser(false);
                setShowNeedsReplan(false);
                setCompleted(null);
                setCloser(null);
                setNeedsReplan(null);
                setCurrentStep(null);
              }}
            >
              Edit
            </button>
          </div>
        ) : (
          <form onSubmit={handleReasonSubmit}>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter your reason..."
            />
            <button type="submit">Submit</button>
          </form>
        )}
      </div>

      {/* Completed Toggle */}
      {showCompleted && (
        <div className='stepsubloop-completed'>
          <p>Did you complete the current planning step?</p>
          {completed ? (
            <div>
              <p>Your answer: {completed}</p>
            </div>
          ) : (
            <>
              <button onClick={() => handleCompletedChange('yes')}>Yes</button>
              <button onClick={() => handleCompletedChange('no')}>No</button>
            </>
          )}
        </div>
      )}

      {/* Closer Toggle */}
      {showCloser && (
        <div className='stepsubloop-closer'>
          <p>Do you think you're closer to completing the current planning step?</p>
          {closer ? (
            <div>
              <p>Your answer: {closer}</p>
              {currentStep === 'closer' && (
                <button onClick={goBackFromCloser}>Back</button>
              )}
            </div>
          ) : (
            <>
              <button onClick={() => handleCloserChange('yes')}>Yes</button>
              <button onClick={() => handleCloserChange('no')}>No</button>
              <button onClick={() => handleCloserChange('not sure')}>Not Sure</button>
              {currentStep === 'closer' && (
                <button onClick={goBackFromCloser}>Back</button>
              )}
            </>
          )}
        </div>
      )}

      {/* Replanning Toggle */}
      {showNeedsReplan && (
        <div className='stepsubloop-replan'>
          <p>Do you need replanning?</p>
          {needsReplan ? (
            <div>
              <p>Your answer: {needsReplan}</p>
              {currentStep === 'needsReplan' && (
                <button onClick={goBackFromNeedsReplan}>Back</button>
              )}
            </div>
          ) : (
            <>
              <button onClick={() => handleNeedsReplanChange('yes')}>Yes</button>
              <button onClick={() => handleNeedsReplanChange('no')}>No</button>
              {currentStep === 'needsReplan' && (
                <button onClick={goBackFromNeedsReplan}>Back</button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default StepSubLoop;
