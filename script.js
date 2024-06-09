"use strict";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);

  constructor(coords, distance, duration) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }
}

class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }

  calcPace() {
    this.pace = Number((this.duration / this.distance + "").slice(0, 5));
    return this.pace;
  }
}

class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }
  calcSpeed() {
    this.speed = Number((this.distance / (this.duration / 60) + "").slice(0, 5));
    return this.speed;
  }
}

class App {
  #map;
  #mapEvent;
  workouts = [];

  constructor() {
    this._getPosition();

    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationField);
  }

  _getPosition() {
    navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
      alert(`ERROR! There is a problem in getting your location.`);
    });
  }

  _loadMap(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const coords = [latitude, longitude];
    this.#map = L.map(`map`).setView(coords, 13);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on(`click`, this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove(`hidden`);
    inputDistance.focus();
  }

  _toggleElevationField() {
    inputElevation.closest(`.form__row`).classList.toggle(`form__row--hidden`);
    inputCadence.closest(`.form__row`).classList.toggle(`form__row--hidden`);
  }

  _newWorkout(e) {
    const validInputs = (...inputs) => inputs.every((input) => Number.isFinite(input));
    const allPositives = (...inputs) => inputs.every((input) => input > 0);

    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;

    // If workout is running, Create a new Running object
    if (type === `running`) {
      const cadence = +inputCadence.value;
      // Check if data is valid
      if (!validInputs(distance, duration, cadence) || !allPositives(distance, duration, cadence)) {
        // Hide form + Clear input fields
        inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = ``;
        return alert(`Only positive numbers are valid!`);
      }
      const workout = new Running([lat, lng], distance, duration, cadence);
      this.workouts.push(workout);
    }

    // If workout is cycling, Create a new Cycling object
    if (type === `cycling`) {
      const elevation = +inputElevation.value;
      // Check if data is valid
      if (!validInputs(distance, duration, elevation) || !allPositives(distance, duration)) {
        // Hide form + Clear input fields
        inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = ``;
        return alert(`Only positive numbers are valid!`);
      }
      const workout = new Cycling([lat, lng], distance, duration, elevation);
      this.workouts.push(workout);
    }

    // Add new object to workout array

    // Render workout on map as marker
    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          maxHeight: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${type}-popup`,
        })
      )
      .setPopupContent(`Hello!`)
      .openPopup();

    // Render workout on list

    // Hide form + Clear input fields
    inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = ``;
  }
}

const app = new App();
