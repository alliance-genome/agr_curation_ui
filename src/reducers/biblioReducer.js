
const initialState = {
  referenceCurie: '',
  referenceJson: {},
  loadingQuery: true,
  queryFailure: false,
  alreadyGotJson: false
};

// to ignore a warning about Unexpected default export of anonymous function
// eslint-disable-next-line
export default function(state = initialState, action) {
  // action will have a type.  common to evaluate with a switch
  switch (action.type) {
//     case 'CHANGE_FIELD':
//       // console.log(action.payload);
//       return {
//         ...state,
//         queryField: action.payload
//       }
    case 'SET_REFERENCE_CURIE':
      console.log("reducer set reference curie");
      return {
        ...state,
        referenceCurie: action.payload
      }
//     case 'SET_LOADING_QUERY':
//       console.log("reducer set loading query");
//       return {
//         ...state,
//         loadingQuery: action.payload
//       }
    case 'RESET_QUERY_STATE':
      console.log("reducer reset reference curie");
      return {
        ...state,
        referenceCurie: '',
        loadingQuery: true,
        alreadyGotJson: false
      }
    case 'BIBLIO_GET_REFERENCE_CURIE':
      console.log("reducer biblio get reference curie");
      if (action.payload.detail === "Reference with the id AGR:AGR-Reference is not available") {
        return {
          ...state,
          referenceCurie: action.payload.detail,
          queryFailure: true,
          loadingQuery: false,
          alreadyGotJson: true
        }
      } else {  
        return {
          ...state,
          referenceCurie: action.payload.curie,
          referenceJson: action.payload,
          loadingQuery: false,
          alreadyGotJson: true
        }
      }

//     case 'QUERY_BUTTON':
//       console.log("query button reducer set " + action.payload);
//       let responseField = action.payload;
//       let responseColor = 'blue';
//       let redirectToBiblio = false;
//       let querySuccess = false;
//       if (responseField === 'not found') { responseColor = 'red'; }
//         else { redirectToBiblio = true; querySuccess = true; }
//       return {
//         ...state,
//         responseColor: responseColor,
//         responseField: responseField,
//         redirectToBiblio: redirectToBiblio,
//         querySuccess: querySuccess
//       }

//     case 'FETCH_POSTS':
//       console.log('in postReducer case FETCH_POSTS');
//       return {
//         ...state,
//         items: action.payload   // from postActions.js
//       }
//     case 'NEW_POSTS':
//       console.log('in postReducer case NEW_POSTS');
//       return {
//         ...state,
//         items: [action.payload, ...state.items],        // from postActions.js
//         item: action.payload    // from postActions.js
//       }
    default:
      return state;
  }
}
  

// const crossRefCurieQueryFieldReducer = (state = 'ab', action) => {
//   switch (action.type) {
//     case 'CHANGE_FIELD':
//       // console.log(action.payload);
//       return action.payload;
//     case 'QUERY_BUTTON':
//       console.log("query button reducer set " + action.payload);
//       return action.payload;
//     default:
//       return state;
//   }
// }
// export default crossRefCurieQueryFieldReducer;
