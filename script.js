'use strict';

////////////////////////////////////////////////////////////////////////////

class Workout {
  date = new Date();

  id = (Date.now() + '').slice(-10);
  clicks = 0;
  constructor(coords, distance, duration) {
    this.distance = distance; // in km
    this.duration = duration; // in min
    this.coords = coords; // [lat,lng]
  }
  _setDiscription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // Running on April 14
    this.discription = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDiscription();
  }

  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    // this.type='cycling';
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDiscription();
  }
  calcSpeed() {
    // km/h
    this.speed = this.distance / this.duration;
    return this;
  }
}
// Guard class
// is basically we will check for the opposite of what we are originally
// interested in, and if that opposite is ture the we simply return the
// function immidiately.

////////////////////////////////////////////////////////////////////////////
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

//----------------------Application Architecture--------------------------//

// Geolocation API
// this takes two callback functions

// ab yaha dikkat ye hui ki map and mapEvent h vo to geolocation me defined
// hai to fir ham use iske bahar kisi dusre event handler me use nhi kar
// sakte (reason scop chain) to ye solve karne k liye ham inhe globelly
// define kar denge or fir baad me inhe re assign kar denge simple

// let map, mapEvent;

// now we want everything related our project in this map class so
// theirfore we are going to define these as property of the object

class App {
  #map;
  #mapEvent;
  #mapZoomLevel = 15;
  #workout = [];

  constructor() {
    //----------------------Get user's position----------------------//
    // why should we this out side of  App class instead if we can do this
    // inside the (ES6) class that wolud actually be a lot cleaner
    // So inside a class we also have a method which autometically called
    // as the page loads that is "Constructor method"
    // so this constructor method is called immediatly when a new object is
    // created from this class so we simply gets the position inside the constructor
    this._getPosition();

    //-------------------Get data from local storage-------------------//
    this._getLocalStorage();

    //----------------------Attach eventHandlers-----------------------//
    // inside of this method this keyword is going to point the handler that is
    // here to the form and no longar to the App object
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('could not get your position.');
        }
      );
  }

  // here _loadMap function is called by getCurrentPosition() method so here
  // _loadMap is treated as normal function call not as a method and we know
  // for normal function call this key word is set to simply undefined
  // to solve this problem we use bind method and set this key word

  _loadMap(position) {
    // const latitude  = position.coords.latitude;
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
    const coord = [latitude, longitude];

    // using map from 3rd party (coping code frome leaflet library)
    this.#map = L.map('map').setView(coord, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // jese ham log event handler ka use karte the bas vese hi yaha par
    // leaflet library ka handler use karenge to get coords of pt where we clicked
    // here the map object is the object generated by leaflet

    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));
    this.#workout.forEach(work => this._randerWorkoutMarker(work));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hiddenForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => ((form.style.display = 'grid'), 1000));
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const validInputs = (...input) => input.every(inp => Number.isFinite(inp));
    const allPositive = (...input) => input.every(inp => inp > 0);

    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If workout running,creat running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Input have to be positive Number!');
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout cycling,creat cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // Check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Input have to be positive Number!');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to workout array
    this.#workout.push(workout);
    console.log(workout);

    // Rander workout on map as a marker
    this._randerWorkoutMarker(workout);

    // Rander workout on list
    this._renderWorkout(workout);

    // Hide form + Clear input fields
    this._hiddenForm();

    // Set local storage to all workouts
    this._setLocalStorage();
  }

  _randerWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          // from reading documentation
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.discription}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.discription}</h2>
           <div class="workout__details">
             <span class="workout__icon">${
               workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
             }</span>
             <span class="workout__value">${workout.distance}</span>
             <span class="workout__unit">km</span>
           </div>
             <div class="workout__details">
             <span class="workout__icon">⏱</span>
             <span class="workout__value">${workout.duration}</span>
             <span class="workout__unit">min</span>
           </div>
         `;

    if (workout.type === 'running') {
      html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
      `;
    }

    if (workout.type === 'cycling') {
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    console.log(workoutEl);

    if (!workoutEl) return;

    const workout = this.#workout.find(
      work => work.id === workoutEl.dataset.id
    );
    console.log(workout);
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animated: true,
      pan: {
        duration: 1,
      },
    });
    //
    // workout.click();
  }

  _setLocalStorage() {
    // converting object into string ----> JSON.stringify()
    localStorage.setItem('workout', JSON.stringify(this.#workout));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workout'));
    console.log(data);

    if (!data) return;
    this.#workout = data;

    this.#workout.forEach(work => this._renderWorkout(work));
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
// app._getPosition();
