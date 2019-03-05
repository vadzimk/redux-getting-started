// import expect, { createSpy, spyOn, isSpy } from 'expect';


import React from 'react';
import ReactDOM from 'react-dom';
import {createStore} from "redux";


//here we extract some code  from the reducer function into a separate reducer - it will deal with a separate item of the todos array
//this pattern is called reducer composition: different reducers specify how different parts of state tree are updated in response to actions
//reducers are normal functions and they can call other reducers to abstract away handling some parts of the state object. this pattern can be applied many times, and while there is still a single top-level reducer managing the state of the app, many reducers can call each other each contributing to a part of thr application state tree
const todo = (state, action)=>{
    switch (action.type) {
        case "ADD_TODO":
            return {
                id: action.id,
                text: action.text,
                completed: false
            };
        case "TOGGLE_TODO":
            if (state.id !== action.id){ //in this case state represents an individual todo item
                return state;
            }
            return {
                ...state,
                completed: !state.completed
            };
        default:
            return state;
    }
};

//reducer for todoList application whos state is represented as an array of todos:
//reducer implements the update logic of your application, that is how the next state is calculated given the current state and the action been dispatched


const todos = (state=[], action)=>{
    switch (action.type) {
        case "ADD_TODO":
            return [
                ...state, //spreads the current state array and adds a new item that is given in the action argument
                todo(undefined, action) // put a new array item here that is an object returned by the reducer todo()
            ];
        case "TOGGLE_TODO":
            return state.map(t=>todo(t, action)); //here t represents an individual todo object and insidd todo reducer it is declared as state object
        default:
            return state; //returns the current state if the action is not recognized
    }
};

// const testAddTodo =()=>{
//     const stateBefore = [];
//     const action = {
//         type: "ADD_TODO",
//         id: 0,
//         text: "Learn Redux"
//     };
//
//     const stateAfter = [
//         {
//             id: 0,
//             text: "Learn Redux",
//             completed: false
//         }
//     ];
//
//     expect(todos(stateBefore, action)).toEqual(stateAfter);
// };
//
// //testing a different action we have a different initial state
// const testToggleTodo = ()=>{
//     const stateBefore = [
//         {
//             id: 0,
//             text: "Learn Redux",
//             completed: false
//         },
//         {
//             id: 1,
//             text: "Go shopping",
//             completed: false
//         }
//     ];
//     const action = {
//         type: "TOGGLE_TODO",
//         id: 1
//     };
//     const stateAfter = [
//         {
//             id: 0,
//             text: "Learn Redux",
//             completed: false
//         },
//         {
//             id: 1,
//             text: "Go shopping",
//             completed: true
//         }
//     ];
//
//     expect(todos(stateBefore, action)).toEqual(stateAfter);
//
// };
//
// testAddTodo();
// testToggleTodo();
// console.log("tests passed");

//a new low level reducer that manages its state as a string defaulted to "SHOW_ALL"
const visibilityFilter =(state="SHOW_ALL", action)=>{
    switch(action.type){
        case "SET_VISIBILITY_FILTER":
            return action.filter;
        default:
            return state;
    }
};

//to store this new visibilityFilter reducer we don't need to change the existing reducers
//we will create a new reducer named todoApp that will call the existing reducers to manage the parts of its state and combine their results in a single state object
//the initial state of the combined reducer is now the combination of states of separate reducers
//any time an action comes in the separate reducers handle it independently

// const todoApp =(state={}, action)=>{
//     return {
//         todos: todos(state.todos, action),
//         visibilityFilter: visibilityFilter(state.visibilityFilter, action)
//     } //the result of calling separate reducers is combined into the new state object
// };

//here we reimplement combineReducers function that comes with Redux library:
//it's only argument is an object mapping the key to reducer functions, we'll call it reducers
const combineReducers = (reducers)=>{ //this is a function that returns another function
    return (state={},action)=>{ //it has a reducer signature
        return Object.keys(reducers).reduce(
            (nextState, key)=>{
                nextState[key] = reducers[key](state[key], action);
                return nextState;
            },
            {} //empty object as an initial value
        ) //Object.keys gives an array of own property names of an object containing names of reducers and corresponding methods. Reduce method creates a new empty object nextState (as an initial value)  and uses it as an accumulator, puts properties of the reducer's argument on the nextState and the corresponding values as return values of calling those reducer-functions with current corresponding state properties and the action, that will be uniform for all reducers.
        //it calculates the nextState for a given key by calling a corresponding reducer function such as todos of visibilityFilter. the generator reducer will pass to the child reducer only a part of it's state by the key and save the result in the nextState by the key
    };
};

//Redux provides a function combineReducers to wor9k with reducer composition
//it generates the top level reducer, it takes an argument which is an object with a mapping between the state field names and the reducers managing them
//the return value of the combinereducers call is a top level reducer function like the one before
const todoApp = combineReducers({
    todos: todos, //the todos property of the state object will be updated by the todos reducer
    visibilityFilter: visibilityFilter
});

//here we create a store with the top level reducer
const store = createStore(todoApp);

//FilterLink component switches the current visible todos. It accepts the filter which is a string and children which is the contents of a link
const FilterLink=({filter, currentFilter, children})=>{
    if(filter===currentFilter){
        return <span>{children}</span>
    }
    return (
        <a href="#"
            onClick={e=>{
                e.preventDefault();
                store.dispatch({
                    type: "SET_VISIBILITY_FILTER",
                    filter: filter
                });
            }}
        >{children}</a>
    );
};

//filters the todos according to the filter value:
const getVisibleTodos =(todos, filter)=>{
    switch (filter) {
        case "SHOW_ALL":
            return todos;
        case "SHOW_COMPLETED":
            return todos.filter(t=>t.completed); //returns only the objects with completed property true
        case "SHOW_ACTIVE":
            return todos.filter(t=>!t.completed);
    }


};

//here would go the TodoApp component
let nextTodoId = 0;

//we are passing todos property in the props object in the ReactDOM.render
class TodoApp extends React.Component{
    render(){
        const {todos, visibilityFilter}=this.props; //destructure the props object
        //we need to filter visible todos before rendering them
        const visibleTodos = getVisibleTodos(todos, visibilityFilter);

        return (
            //we are using the callback ref api - the functioin receives the React component instance of or the html dom element in this case as its argument, which can be accessed elsewhere.
            //this.input gets the reference to the input element and it's value property will contain whatever is typed inside the input field
            <div>
                <input ref={node=>{this.input=node}} />
                <button
                    onClick={()=>{
                        store.dispatch({
                            type: "ADD_TODO",
                            text: this.input.value,
                            id: nextTodoId++
                        });
                        this.input.value = ""; //clear the input field after dispatching an action
                    }}
                >Add todo</button>
                <ul>
                    {visibleTodos.map(todo=>
                        <li key={todo.id}
                            onClick={()=>{
                                store.dispatch({
                                    type: "TOGGLE_TODO",
                                    id: todo.id
                                });
                            }}
                            style={{textDecoration: todo.completed ? "line-through" : "none"}}
                        >
                            {todo.text}
                        </li>
                    )}
                </ul>
                <p>
                    Show:{" "}
                    <FilterLink filter='SHOW_ALL' currentFilter={visibilityFilter}>All</FilterLink>
                    {" "}
                    <FilterLink filter='SHOW_ACTIVE' currentFilter={visibilityFilter}>Active</FilterLink>
                    {" "}
                    <FilterLink filter='SHOW_COMPLETED' currentFilter={visibilityFilter}>Completed</FilterLink>
                </p>
            </div>
        );
    }
}

const render =()=>{
    ReactDOM.render(
        //here we spread all the fields of the state object into props object  of the TodoApp component
        <TodoApp {...store.getState()}/>, document.querySelector("#root")
    );
};

store.subscribe(render); //subscribe render method to the store
render();//render the initial state

// //log the state object:
// console.log("initial state");
// console.log(store.getState());
// console.log("dispatching add_todo");
// store.dispatch({
//     type: "ADD_TODO",
//     id: 0,
//     text: "learn redux"
// }); //dispatching an action object
// console.log("next state:");
// console.log(store.getState());
// console.log("dispatching toggle_todo");
// store.dispatch({
//     type: "TOGGLE_TODO",
//     id: 0
// });
// console.log("next state");
// console.log(store.getState());
//
// console.log("dispatching set_visibility_filter");
// store.dispatch({
//     type: "SET_VISIBILITY_FILTER",
//     filter: "SHOW_COMPLETED"
// });
// console.log("next state:");
// console.log(store.getState());
