// import expect, { createSpy, spyOn, isSpy } from 'expect';


import React from 'react';
import ReactDOM from 'react-dom';
import {createStore} from "redux";
import PropTypes from 'prop-types';

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



//FilterLink component switches the current visible todos. It accepts the filter which is a string and children which is the contents of a link
//the Link component only specifies only the appearance of the link when it is active or inactive
const Link=({active, children, onClick})=>{
    if(active){
        return <span>{children}</span>
    }
    return (
        <a href="#"
            onClick={e=>{
                e.preventDefault();
                onClick();
            }}
        >{children}</a>
    );
};

//FilterLink is a container component it contains the Link presentational component and separates the logic from it
class FilterLink extends React.Component{
    //when the FilterLink component mounts, it subscribes to the redux store, so that it rerenders each time an action is dispatched and the store state changes, because it needs to use the store.getState() inside its render method
    //it's logic calculates the props for the Link component based on FilterLink's own props and the current state of the Redux store and it also specifies the callbacks that will dispatch actions to the store. After the action is dispatched the store will remember the new state returned by the reducer and will call every subscriber. and in this case every FilterLink componet instance is subscribed to the store so they will have their forceupdate methods called on them, and they will rerender according to the current store state.
    //The FilterLink is a self-sufficient component and it can be used inside a presentational component like the Footer without passing additional props to it to get the data from the store and specify the behavior. This lets us keep the Footer component simple and decoupled from the behavior and the data that its child components need
    componentDidMount(){
        const {store}=this.context;
        this.unsubscribe = store.subscribe(()=>this.forceUpdate());
    }
    componentWillUnmount(){
        this.unsubscribe();
    }
    render(){
        const props = this.props;
        const{store}=this.context;
        const state = store.getState();
        return(
            <Link
                active={
                    //the props.filter is passed to the FilterLink component as props from the parent component, the visibilityfilter is from the redux store, if they match, the link will appear active
                    props.filter===state.visibilityFilter
                }
                // the container component also specifies the behavior of dispatching an action when particular link is clicked
                onClick={()=>
                store.dispatch({
                    type: "SET_VISIBILITY_FILTER",
                    filter: props.filter
                })
                }
            >
                {props.children}
            </Link>
        );
    }
}

//mandatory to receivie context :
FilterLink.contextTypes = {
    store: PropTypes.object
};

//a single list item component - presentational component that doesn't describe any behavior inside

const Footer =()=>( //when using parenthesis no need in return statement
    <p>
        Show:{" "}
        <FilterLink filter='SHOW_ALL'  >All</FilterLink>
        {" "}
        <FilterLink filter='SHOW_ACTIVE' >Active</FilterLink>
        {" "}
        <FilterLink filter='SHOW_COMPLETED' >Completed</FilterLink>
    </p>
);

const Todo =({onClick, completed,text})=>{
    return (
        <li
            onClick={onClick}
            style={{textDecoration: completed ? "line-through" : "none"}}
        >
            {text}
        </li>
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

//All container components are similar: their job is to connect a presentational component to the Redux store and specify the data and the behavior that it needs-  it is subscribed to the store!
//We extract reading the currently visible todos into a separate container component that connects the TodoList to the Redux store:

class VisibleTodoList extends React.Component{
    //the sore subscription logic:
    componentDidMount(){
        const {store}=this.context; // to have access to the store from the context
        this.unsubscribe = store.subscribe(()=>this.forceUpdate()); //subscribe a function that will rerender the component by calling the forceUpdate() method of the React Component
    }
    componentWillUnmount(){
        this.unsubscribe();
    }
    render(){

        const props = this.props;
        const {store}=this.context;
        const state = store.getState();
        return(
            <TodoList
                todos={getVisibleTodos(state.todos, state.visibilityFilter)}
                onTodoClick={id=>store.dispatch({type:"TOGGLE_TODO", id:id})}
            />
        );
    }
}

//also a presentational component, accepts an array of todos
const TodoList =({todos, filter, onTodoClick})=>{
    return(
        <ul>
            {todos.map(todo=>
                <Todo
                    key={todo.id}
                    {...todo} /*spread the todo object's properties in the props object */
                    onClick={()=>onTodoClick(todo.id)}
                />
            )}
        </ul>
    );
};

let nextTodoId = 0;
//functional components also receive context but as a 2nd argument -after the props
const AddTodo =(props,{store})=>{
    //functional components don't have instances so we replace this to the local variable
    let input;
    return(
        //a component has to have a single root element - we are wrapping it in a div here
        <div>
            <input ref={node=>{input=node}} />
            <button
                onClick={()=>{
                    store.dispatch({
                        type: "ADD_TODO",
                        text: input.value,
                        id: nextTodoId++
                    });//dispatches an action, is passed as a prop
                    input.value = ""; //clear the input field after dispatching an action
                }}
            >Add todo</button>
        </div>
    );
};

//you have to specify which context type you want to receive
AddTodo.contextTypes = {
    store: PropTypes.object
};

//have to specify it to receive the context
VisibleTodoList.contextTypes={
    store: PropTypes.object
};


//here would go the TodoApp component

//The TodoApp is a container component
//we are passing todos property in the props object in the ReactDOM.render
//we remove props after separating logic into container components that receive state from the Redux store by themselves
const  TodoApp =()=>(
        //we need to filter visible todos before rendering them - moved to the TodoList props declaration

        //we are using the callback ref api - the functioin receives the React component instance of or the html dom element in this case as its argument, which can be accessed elsewhere.
        //this.input gets the reference to the input element and it's value property will contain whatever is typed inside the input field
        //none of the container components below need to pass props from the state
        <div>
            <AddTodo />
            <VisibleTodoList />
            <Footer />
        </div>
);

//because the container components are subscribed directly to the store, we no longer need the render method containing the toplivel TodoApp component to be subscribed to the store, nor we need to pass any props top-down, and so we remove props from it along with the render method and call ReactDOM.render() just once:

//here we create a store with the top level reducer
//to have the store portable for the testing purposes and to suppy different store from the server we inject the store to the toplevel component as a props, so that it is completely injectable. Every container component will need a reference to the store via props. So we pass it down to every container component as prop
//const store = createStore(todoApp);

//we shall pass the store implicitly via context
    class Provider extends React.Component{
        //getChildContext is a special method that will be called by React
        //Store is passed to the provider as a prop just once
        //getChildContext returns a context object with the store property that was passed to it as props. Any component inside the Provider will recieve the context object
        getChildContext(){
            return {store: this.props.store};
        }

        render(){
            //it returns whatever its child is, so we can wrap any component with a Provider and it's going to render that component
            return this.props.children;
        }
    }

    //For the Context to work, you have to define the childContextTypes on the component that defines getChildContext. It is essential for the context to be turned on. if you don't specify them, no child components will receive the context
    Provider.childContextTypes = {
        store: PropTypes.object
    };

    ReactDOM.render(
        //here we spread all the fields of the state object into props object  of the TodoApp component
        //we wrap the TodoApp with a Prpvider and pass the store to it.
        //the Provider will make use of React's advanced context feature to make the store available to any component inside it including grandchildren
        <Provider store={createStore(todoApp)}>
            <TodoApp  />
        </Provider>
            , document.querySelector("#root")
    );
//we don't render again when the store state changes because the container components are subscribed directly

//store.subscribe(render); //subscribe render method to the store
//render();//render the initial state

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