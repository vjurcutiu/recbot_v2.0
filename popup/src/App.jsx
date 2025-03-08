import React from 'react';
import { useSelector } from 'react-redux';
import Start from './components/Start';
import StepCreator from './components/StepCreator';
import StepLoop from './components/StepLoop';
import End from './components/End';


function App() {
  // Get the active component from the redux store.
  const activeComponent = useSelector((state) => state.activeComponent);

  return (
    <div>
      {activeComponent === 'Start' && <Start />}
      {activeComponent === 'StepCreator' && <StepCreator />}
      {activeComponent === 'StepLoop' && <StepLoop />}
      {activeComponent === 'End' && <End />}
      {/* Add more component conditions as needed */}
    </div>
  );
}

export default App;
