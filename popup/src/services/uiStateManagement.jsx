import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

// Define the initial state of the store based on your backend structure.
const initialState = {
  recordState: {
    currentTask: {
      name: '',
      objectives: '',
      url: '',
      steps: [] // Each step can include id, text, actionsTaken, etc.
    }
  },
  activeComponent: 'start', // Default value from backend's globalState
};

// Action types for updating the store.
const actionTypes = {
  SET_ACTIVE_COMPONENT: 'SET_ACTIVE_COMPONENT',
  SET_RECORD_STATE: 'SET_RECORD_STATE'
};

// Synchronous action creators.
const setActiveComponent = (component) => ({
  type: actionTypes.SET_ACTIVE_COMPONENT,
  payload: component,
});

const setRecordState = (recordState) => ({
  type: actionTypes.SET_RECORD_STATE,
  payload: recordState,
});

// The reducer updates the store based on actions.
const reducer = (state = initialState, action) => {
  switch(action.type) {
    case actionTypes.SET_ACTIVE_COMPONENT:
      return { ...state, activeComponent: action.payload };
    case actionTypes.SET_RECORD_STATE:
      return { ...state, recordState: action.payload };
    default:
      return state;
  }
};

// Create the store with redux-thunk for asynchronous actions.
const store = createStore(reducer, applyMiddleware(thunk));

/**
 * Asynchronous action to fetch the current recordState from the backend.
 */
export const fetchRecordState = () => (dispatch) => {
  chrome.runtime.sendMessage({ action: 'getRecordState' }, (response) => {
    if(response && response.recordState) {
      dispatch(setRecordState(response.recordState));
    }
  });
};

/**
 * Asynchronous action to update the recordTask in the backend and update the store.
 * The payload should include properties like name, objectives, startUrl, and steps.
 */
export const updateRecordTask = (payload) => (dispatch, getState) => {
  chrome.runtime.sendMessage({ action: 'recordTask', payload }, (response) => {
    if(response && response.recordedTask) {
      // Optionally, merge with current recordState if needed.
      const currentRecordState = getState().recordState;
      dispatch(setRecordState({
        ...currentRecordState,
        currentTask: response.recordedTask,
      }));
    }
  });
};

/**
 * Action to update the active component in both the backend and store.
 */
export const updateActiveComponent = (component) => (dispatch) => {
  chrome.runtime.sendMessage({ action: 'setActiveComponent', payload: component }, (response) => {
    if(response && response.activeComponent) {
      dispatch(setActiveComponent(response.activeComponent));
    }
  });
};

export default store;
