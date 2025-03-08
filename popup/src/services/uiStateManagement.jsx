import { createStore, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';

// Define the initial state of the store.
const initialState = {
  recordState: {
    currentTask: {
      name: '',
      objectives: '',
      url: '',
      steps: [],
    },
  },
  activeComponent: 'Start',
  areFilesLoaded: false, // <-- New
};

// Action types for updating the store.
const actionTypes = {
  SET_ACTIVE_COMPONENT: 'SET_ACTIVE_COMPONENT',
  SET_RECORD_STATE: 'SET_RECORD_STATE',
  SET_FILES_LOADED: 'SET_FILES_LOADED', // <-- New
};


export const setFilesLoaded = (areFilesLoaded) => ({
  type: actionTypes.SET_FILES_LOADED,
  payload: areFilesLoaded,
});


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
  switch (action.type) {
    case actionTypes.SET_ACTIVE_COMPONENT:
      return { ...state, activeComponent: action.payload };
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
  // Directly use the initial state's recordState or any local source.
  dispatch(setRecordState(initialState.recordState));
};

/**
 * Action to update the recordTask.
 * It directly updates the local state with the new task payload.
 */
export const updateRecordTask = (payload) => (dispatch, getState) => {
  const currentRecordState = getState().recordState;
  dispatch(setRecordState({
    ...currentRecordState,
    currentTask: {
      ...currentRecordState.currentTask,
      ...payload,
    },
  }));
};

/**
 * Action to update the active component.
 * It directly dispatches the new active component to the store.
 */
export const updateActiveComponent = (component) => (dispatch) => {
  dispatch(setActiveComponent(component));
};

store.subscribe(() => {
  console.log('Store updated:', store.getState());
});

export default store;
