
import expect, { createSpy, spyOn, isSpy } from 'expect';
//import {createStore} from 'redux'; //reimplemented below
import React from 'react';
import ReactDOM from 'react-dom';
import Counter from './Counter'

//a reducer is function that accepts the current state and an action and returns the new state:
const counter = (state=0, action)=> {
    switch (action.type) {
        case "INCREMENT":
            return ++state;
        case "DECREMENT":
            return --state;
        default:
            return state;
    }
};

expect(
    counter(0, {type: "INCREMENT"})
).toEqual(1);

expect(
    counter(1, {type: "INCREMENT"})
).toEqual(2);

expect(
    counter(2, {type: "DECREMENT"})
).toEqual(1);

expect(
    counter(2, {type: "bla"})
).toEqual(2);

console.log("tests passed");

//the redux store holds the current application's state object and lets you to dispatch actions.
//when you create a store you need to specify the reducer that tells how state is updated with actions, (createStore.js function declares the initial store object inside itself)

//in this example we are calling a function createStore.js with the reducer counter that manages the state updates
//the store object has 3 important methods in it:
//1. getState(); returns the current store,
//2. dispatch(); lets dispatch actions to change the state of your application
//3. subscribe(); registers a function for calling it each time the action is dispatched (sent to the reducer function that is inside the store)

//reimplement the createStore function of redux:
const createStore = (reducer)=>{
    let state; //store holds the current state
    let listeners = []; // holds the array of funcions to run each time the action is dispached to the store
    const getState = ()=> state; //getState returns the current value of the state
    const dispatch = (action)=>{
        state = reducer(state, action); //to change the state we call the reducer with the current state and the action
        listeners.forEach(listener=>listener()); //after the action been dispatch the dispatch function calls all the listeners that are subscribed
    }; //dispatching an action to the store is the only way to change the state object

    const subscribe = (listener)=>{
        listeners.push(listener);
        return ()=>{
            listeners = listeners.filter(l=>l!==listener); //subscribe function returns a function that is unsubscribing (removing the provided listener from the list)
        };
    };
    //returns the Redux store that is an object with 3 methods on it, that have access to the state object of the createStore function

    //finally by the time the store is returned, we want to have its initial state populated by the reducers- so we dispatch an empty action object so that reducer will return the initial value of the state:
    dispatch({});

    return {
        getState,
        dispatch,
        subscribe
    };
};


const store = createStore(counter); //takes a reducer as an argument
console.log("getState returned: "+ store.getState());
store.dispatch({type: "INCREMENT"}); //change the state object with the help of dispatch function that takes an action object that is an object with a type field, it mainly calls the reducer function inside it that takes the current state object and the action object and it  manipulates the state object according to the reducer's logic. After that the dispatch function also calls all the listener functions that are subscribed to the state changes.
console.log("getstate returned after calling dispatch increment action: " + store.getState());

const render=()=>{
    ReactDOM.render(
        <Counter
            value={store.getState()}
            onIncrement={()=>{store.dispatch({type: "INCREMENT"})}}
            onDecrement={()=>{store.dispatch({type: "DECREMENT"})}}
        />, //the current state of the store is sent as a prop to the root component as a property named value on the props object
        document.getElementById('root')
    );
}; //the render function is called by the subscribe method of the store

store.subscribe(render); //the store calls render funcion each time the store state changes, you can subscribe as many functions to the store as you like - they all are put in an array and called by the store one after another
render(); //we render the app for the firs time by calling render function here

//document.addEventListener('click', ()=>{store.dispatch({type: "INCREMENT"})}); //don't need it anymore after adding + and - buttons

