import React, { useState } from 'react';

function StepSubLoop({ onNext, onEnableReplan }) {
  // State for the initial reason input.
  const [reason, setReason] = useState('');
  const [submittedReason, setSubmittedReason] = useState(null);
  
  // State for toggles.
  const [completed, setCompleted] = useState(null); // "yes" or "no"
  const [closer, setCloser] = useState(null); // "yes", "no", or "not sure"
  const [needsReplan, setNeedsReplan] = useState(null); // "yes" or "no"

  // Additional state variables to track if a toggle has been shown.
  const [showCompleted, setShowCompleted] = useState(false);
  const [showCloser, setShowCloser] = useState(false);
  const [showNeedsReplan, setShowNeedsReplan] = useState(false);

  // Handles submitting the reason.
  const handleReasonSubmit = (e) => {
    e.preventDefault();
    if (reason.trim() !== '') {
      setSubmittedReason(reason);
      // Reveal the completed toggle once a reason is submitted.
      setShowCompleted(true);
    }
  };

  // Handles the toggle for whether the current step is completed.
  const handleCompletedChange = (answer) => {
    setCompleted(answer);
    if (answer === 'yes') {
      // If completed, we can immediately move on.
      if (onNext) onNext();
    } else if (answer === 'no') {
      // Reveal the next toggle.
      setShowCloser(true);
    }
  };

  // Handles the toggle for feeling closer to completion.
  const handleCloserChange = (answer) => {
    setCloser(answer);
    // Reveal the next toggle once an answer is provided.
    setShowNeedsReplan(true);
    if (answer === 'yes') {
      // If answered yes, close the window.
      window.close();
    }
  };

  // Handles the toggle for replanning.
  const handleNeedsReplanChange = (answer) => {
    setNeedsReplan(answer);
    if (answer === 'yes') {
      if (onEnableReplan) onEnableReplan();
    } else {
      window.close();
    }
  };

  return (
    <div>
      {/* Reason Input */}
      <div>
        <p>What’s the reason you chose that action among all the possible actions?</p>
        {submittedReason ? (
          <p>{submittedReason}</p>
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
            <p>Your answer: {completed}</p>
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
            <p>Your answer: {closer}</p>
          ) : (
            <>
              <button onClick={() => handleCloserChange('yes')}>Yes</button>
              <button onClick={() => handleCloserChange('no')}>No</button>
              <button onClick={() => handleCloserChange('not sure')}>Not Sure</button>
            </>
          )}
        </div>
      )}

      {/* Replanning Toggle */}
      {showNeedsReplan && (
        <div>
          <p>Do you need replanning?</p>
          {needsReplan ? (
            <p>Your answer: {needsReplan}</p>
          ) : (
            <>
              <button onClick={() => handleNeedsReplanChange('yes')}>Yes</button>
              <button onClick={() => handleNeedsReplanChange('no')}>No</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default StepSubLoop;
