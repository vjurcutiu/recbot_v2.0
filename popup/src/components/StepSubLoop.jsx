import React, { useState } from 'react';

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

  // Update toggle answers in background using the action "updateToggleAnswers".
  const updateToggleAnswer = (key, value) => {
    const newToggleAnswers = { ...toggleAnswers, [key]: value };
    setToggleAnswers(newToggleAnswers);
    chrome.runtime.sendMessage(
      { 
        action: 'updateToggleAnswers', 
        payload: { 
          toggleAnswers: newToggleAnswers, 
          activeStepIndex
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

  // Handles the Closer toggle.
  const handleCloserChange = (answer) => {
    setCloser(answer);
    updateToggleAnswer('closer', answer);
    if (answer === 'yes') {
      chrome.runtime.sendMessage({ action: 'resumeRecording' }, () => {
        window.close();
      });
    } else {
      setShowNeedsReplan(true);
      setCurrentStep('needsReplan');
    }
  };

  // Handles the Replanning toggle.
  const handleNeedsReplanChange = (answer) => {
    setNeedsReplan(answer);
    updateToggleAnswer('needsReplan', answer);
    if (answer === 'yes') {
      if (onEnableReplan) onEnableReplan();
    } else {
      chrome.runtime.sendMessage({ action: 'resumeRecording' }, () => {
        window.close();
      });
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
        <div>
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
