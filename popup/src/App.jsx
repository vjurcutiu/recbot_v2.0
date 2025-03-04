import React, { useState } from 'react';
import NotificationModal from './components/NotificationModal';

function App() {
  const [showModal, setShowModal] = useState(false);

  const handleStart = () => {
    setShowModal(true);
  };

  return (
    <div>
      <button onClick={handleStart}>Start</button>
      {showModal && <NotificationModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

export default App;
