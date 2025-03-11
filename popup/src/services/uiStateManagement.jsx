// uiStateManagement.jsx
import { createStore, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';

// Define the initial state of the store without the activeComponent property.
const initialState = {
  recordState: {
    currentTask: {
      name: '',
      objectives: '',
      url: '',
      steps: [],
    },
  },
  areFilesLoaded: false, // Maintained for file load status.
};

// Define action types.
const actionTypes = {
  SET_RECORD_STATE: 'SET_RECORD_STATE',
  SET_FILES_LOADED: 'SET_FILES_LOADED',
};

// Action creator for updating file load status.
export const setFilesLoaded = (areFilesLoaded) => ({
  type: actionTypes.SET_FILES_LOADED,
  payload: areFilesLoaded,
});

// Synchronous action creator for recordState.
const setRecordState = (recordState) => ({
  type: actionTypes.SET_RECORD_STATE,
  payload: recordState,
});

// The reducer updates the store based on actions.
const reducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.SET_RECORD_STATE:
      return { ...state, recordState: action.payload };
    case actionTypes.SET_FILES_LOADED:
      return { ...state, areFilesLoaded: action.payload };
    default:
      return state;
  }
};

// Create the store with redux-thunk for asynchronous actions.
const store = createStore(reducer, applyMiddleware(thunk));

/**
 * Action to fetch the current recordState.
 * Now it directly dispatches the default state without communicating with the background.
 */
export const fetchRecordState = () => (dispatch) => {
  dispatch(setRecordState(initialState.recordState));
};

/**
 * Action to update the recordTask.
 * It directly updates the local state with the new task payload.
 */
export const updateRecordTask = (payload) => (dispatch, getState) => {
  const currentRecordState = getState().recordState;
  dispatch(
    setRecordState({
      ...currentRecordState,
      currentTask: {
        ...currentRecordState.currentTask,
        ...payload,
      },
    })
  );
};

// Removed updateActiveComponent since active component is now managed by the background script.

store.subscribe(() => {
  console.log('Store updated:', store.getState());
});

export default store;
