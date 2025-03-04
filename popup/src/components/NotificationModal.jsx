import React from 'react';

function NotificationModal({ onClose }) {
  // Basic styling for the modal and its overlay
  const modalStyle = {
    position: 'fixed',
    top: '20%',
    left: '50%',
    transform: 'translate(-50%, 0)',
    backgroundColor: '#fff',
    padding: '20px',
    border: '1px solid #ccc',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.26)',
    zIndex: 1000,
    borderRadius: '8px',
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  };

  return (
    <>
      <div style={overlayStyle} onClick={onClose}></div>
      <div style={modalStyle}>
        <h2>Notification</h2>
        <p>This is your notification message!</p>
        <button onClick={onClose}>Dismiss</button>
      </div>
    </>
  );
}

export default NotificationModal;
