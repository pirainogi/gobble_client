import React, { Component } from 'react';
import { Switch, Route, withRouter } from 'react-router-dom';
import BigCalendar from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './App.css';
import Header from './components/Header'
import Home from './components/Home';
import UserShow from './containers/UserShow';
import Footer from './components/Footer'
// import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import EventForm from './components/EventForm';
import Login from './components/Login';
import Signup from './components/Signup';
import RecipeBoxContainer from './containers/RecipeBoxContainer';
import SearchContainer from './containers/SearchContainer';
import RecipeContainer from './containers/RecipeContainer';
moment.locale('en-us');
BigCalendar.momentLocalizer(moment);


const RecipeAPI = 'http://localhost:3000/api/v1/recipes'
// const UserAPI = 'http://localhost:3000/api/v1/users'
const RecipeboxAPI = 'http://localhost:3000/api/v1/recipeboxes'
const EventAPI = 'http://localhost:3000/api/v1/events'

class App extends Component {

  constructor(props) {
    super(props)

    this.state = {
      recipes: [],
      currentUser: {},
      currentRecipebox: [],
      currentRecipeView: {},
      calendarEvents: [],
      recipeForEvent: {},
    }
  }

  componentDidMount() {
    fetch(RecipeAPI)
    .then(res => res.json())
    .then(recipes => this.setState({recipes: recipes}) )

    fetch(EventAPI)
    .then(res => res.json())
    .then(events => {
      for (let i=0; i < events.length; i++){
        // console.log(events[i])
        events[i].start = this.convertDate(events[i].eventStart)
        events[i].end = this.convertDate(events[i].eventEnd)
      }
      this.setState({calendarEvents: events})
    })

    const token = localStorage.getItem("token")
    if (token){
      fetch("http://localhost:3000/api/v1/auto_login", {
        method: "GET",
        headers: {
          "Authorization": token
        }
      })
      .then(res => res.json())
      .then(response => {
        // console.log('getting user info', response)
        this.setState({
          currentUser: response,
          currentRecipebox: response.recipes,
          calendarEvents: response.events,
        })
      })
    }
  }

  convertDate = (date) => {
    return moment.utc(date).toDate()
  }

  findRecipe = (routerID) => {
    // console.log('looking for recipe that matches', );
    let foundRecipe =  this.state.recipes.find( recipe => recipe.id === parseInt(routerID) )
    // console.log('returned recipe', foundRecipe);
    return foundRecipe
  }

  selectRecipePreviewForShow = (e) => {
    // console.log(e.target.id);
    let recipeToView = this.state.currentRecipebox.find(recipe => recipe.id === parseInt(e.target.id))
    // console.log(recipeToView);
    this.setState({
      currentRecipeView: recipeToView
    })
  }

  addRecipeToRecipeBox = (recipeID) => {
    console.log('pushing add button', recipeID, 'user', this.state.currentUser);
    // // this.props.history.push(`/recipes/${e.target.id}`)
    let recipeToAdd = this.state.recipes.find(recipe => recipe.id === recipeID)
    // // console.log('recipe to add', recipeToAdd)
    // console.log('user id', this.state.currentUser[0].id, 'type', typeof this.state.currentUser[0].id, 'recipe id', recipeToAdd.id, 'type', typeof recipeToAdd.id)
    fetch(RecipeboxAPI,{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        user_id: this.state.currentUser.id,
        recipe_id: recipeToAdd.id
      })
    })
    .then(res => res.json())
    .then(addedRecipe => {
      let foundRecipe = this.state.recipes.find(recipe => recipe.id === addedRecipe.recipe_id)
      console.log(foundRecipe)
      let updatedRecipebox = [...this.state.currentRecipebox, foundRecipe]
      this.setState({
        currentRecipebox: updatedRecipebox
      })
    })
  }

  setCurrentUser = (response) => {
    localStorage.setItem("token", response.jwt)
    console.log(response.user)
    this.setState({
      currentUser: response.user,
      currentRecipebox: response.user.recipes,
      calendarEvents: response.user.events,
    })
  }

  logout = () => {
    localStorage.removeItem("token")
    this.setState({
      currentUser: {}
    })
  }

  grabRecipeForEvent = (recipe) => {
    console.log(recipe);
    this.setState({
      recipeForEvent: recipe
    })
    this.props.history.push('/eventform')
  }

  createEvent = (stringifiedStart, stringifiedEnd, recipeName) => {

    console.log(stringifiedStart, stringifiedEnd);

    fetch("http://localhost:3000/api/v1/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accepts": "application/json"
      },
      body: JSON.stringify({
        user_id: this.state.currentUser.id,
        name: recipeName,
        eventType: "tbd",
        eventStart: stringifiedStart,
        eventEnd: stringifiedEnd
      })
    })
    .then(res => res.json())
    .then(addedEvent => {
      console.log(addedEvent)
      this.setState({
        calendarEvents: [...this.state.calendarEvents, addedEvent]
      },     this.props.history.push('/calendar'))
    })
  }

  render() {
    // console.log('logging all info', this.state);
    return (
      <div className="App">
      <Header currentUser={this.state.currentUser} logout={this.logout}/>
        <Switch>
          <Route
            path="/login"
            render={routerProps => <Login {...routerProps} setCurrentUser={this.setCurrentUser}/>}
          />
          <Route
            path="/signup"
            render={routerProps => <Signup {...routerProps} setCurrentUser={this.setCurrentUser}/>}
          />
          <Route
            path="/profile"
            component={() => <UserShow user={this.state.currentUser}/>}
          />
          <Route
            path="/calendar"
            component={() => <Calendar
              events={this.state.calendarEvents}
              user={this.state.currentUser}
            />}
          />
          <Route
            path="/eventform"
            component={() => <EventForm
              userID={this.state.currentUser.id}
              recipeForEvent={this.state.recipeForEvent.name}
              createEvent={this.createEvent}
            />}
          />
          <Route
            path="/recipebox"
            component={() => <RecipeBoxContainer
              currentRecipebox={this.state.currentRecipebox}
              currentRecipeView={this.state.currentRecipeView}
              selectRecipePreviewForShow={this.selectRecipePreviewForShow}
            />}
          />
          <Route
            exact
            path="/recipes/:id"
            render={routerProps => {
              let recipe = this.findRecipe(routerProps.match.params.id)
              return recipe ? (
                <RecipeContainer
                  recipes={this.state.recipes}
                  foundRecipe={recipe}
                  addRecipeToRecipeBox={this.addRecipeToRecipeBox}
                  grabRecipeForEvent={this.grabRecipeForEvent}
                />
              ) : (
                <h1> loading dem recipes </h1>
              )
            }}
          />
          <Route
            path="/search"
            render={(routerProps) => <SearchContainer {...routerProps} recipes={this.state.recipes}/>}
          />
          <Route
            path="/"
            component={() => <Home />}
          />
        </Switch>
      <Footer />
      </div>
    );
  }
}

export default withRouter(App);


// <Route
//   path="/dashboard"
//   component={() => <Dashboard
//     currentRecipebox={this.state.currentRecipebox}
//   />}
// />

// fetch(UserAPI)
// .then(res => res.json())
// .then(user =>
//   this.setState({
//     currentUser: user,
//     currentRecipebox: user[0].recipes
//   })
// )
