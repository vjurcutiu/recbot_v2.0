import React, { useState } from 'react';

function StepSubLoop({ onNext, onEnableReplan, isLastStep, setActiveComponent }) {
  // Removed useDispatch and updateActiveComponent action

  // State for the initial reason input.
  const [reason, setReason] = useState('');
  const [submittedReason, setSubmittedReason] = useState(null);

  // State for toggle answers.
  const [completed, setCompleted] = useState(null); // "yes" or "no"
  const [closer, setCloser] = useState(null); // "yes", "no", or "not sure"
  const [needsReplan, setNeedsReplan] = useState(null); // "yes" or "no"

  // State to control which toggle sections have been revealed.
  const [showCompleted, setShowCompleted] = useState(false);
  const [showCloser, setShowCloser] = useState(false);
  const [showNeedsReplan, setShowNeedsReplan] = useState(false);

  // Track the current active toggle.
  // Valid values: "completed", "closer", "needsReplan", or null.
  const [currentStep, setCurrentStep] = useState(null);

  // Handles submitting the reason.
  const handleReasonSubmit = (e) => {
    e.preventDefault();
    if (reason.trim() !== '') {
      setSubmittedReason(reason);
      // Reveal the first toggle and mark it as active.
      setShowCompleted(true);
      setCurrentStep('completed');
    }
  };

  // Handles the Completed toggle.
  const handleCompletedChange = (answer) => {
    setCompleted(answer);
    if (answer === 'yes') {
      // Only move to End if this is the last step.
      if (isLastStep) {
        setActiveComponent('End');
      } else {
        if (onNext) onNext();
      }
    } else if (answer === 'no') {
      // Reveal the Closer toggle and set it as active.
      setShowCloser(true);
      setCurrentStep('closer');
    }
  };

  // Handles the Closer toggle.
  const handleCloserChange = (answer) => {
    setCloser(answer);
    if (answer === 'yes') {
      chrome.runtime.sendMessage({ action: 'resumeRecording' }, () => {
        window.close();
      });
    } else {
      // Reveal the Replanning toggle and set it as active.
      setShowNeedsReplan(true);
      setCurrentStep('needsReplan');
    }
  };

  // Handles the Replanning toggle.
  const handleNeedsReplanChange = (answer) => {
    setNeedsReplan(answer);
    if (answer === 'yes') {
      if (onEnableReplan) onEnableReplan();
    } else {
      chrome.runtime.sendMessage({ action: 'resumeRecording' }, () => {
        window.close();
      });
    }
  };

  // Back navigation functions.
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
    <div>
      {/* Reason Input */}
      <div>
        <p>What’s the reason you chose that action among all the possible actions?</p>
        {submittedReason ? (
          <div>
            <p>{submittedReason}</p>
            <button
              onClick={() => {
                setSubmittedReason(null);
                // Reset all toggle states
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
        <div>
          <p>Did you complete the current planning step?</p>
          {completed ? (
            <div>
              <p>Your answer: {completed}</p>
              {/* No back button for the first toggle */}
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
        <div>
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
        <div>
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
