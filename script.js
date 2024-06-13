"use strict";

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
  type = `running`;
  emojy = `🏃‍♂️`;
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
  type = `cycling`;
  emojy = `🚴‍♂️`;
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
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

    this._getLocalStorage();

    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationField);
    containerWorkouts.addEventListener(`click`, this._moveToWorkout.bind(this));
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

    this.workouts.forEach((work) => {
      this._renderWorkoutMarker(work);
    });
  }

  _renderTitle(workout) {
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

    let title;

    if (typeof workout.date === "string") {
      title = `${workout.emojy} ${workout.type[0].toUpperCase()}${workout.type.slice(1)} on ${
        months[+workout.date.slice(5, 7)]
      } ${+workout.date.slice(8, 10)}`;
    } else {
      title = `${workout.emojy} ${workout.type[0].toUpperCase()}${workout.type.slice(1)} on ${
        months[workout.date.getMonth()]
      } ${workout.date.getDate()}`;
    }

    return title;
  }

  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${workout.id}">
                    <h2 class="workout__title">${this._renderTitle(workout)}</h2>
                    <div class="workout__details">
                      <span class="workout__icon">${workout.emojy}</span>
                      <span class="workout__value">${workout.distance}</span>
                      <span class="workout__unit">km</span>
                    </div>
                    <div class="workout__details">
                      <span class="workout__icon">⏱</span>
                      <span class="workout__value">${workout.duration}</span>
                      <span class="workout__unit">min</span>
                    </div>`;

    if (workout.type === `running`) {
      html += `<div class="workout__details">
                  <span class="workout__icon">⚡️</span>
                  <span class="workout__value">${workout.pace}</span>
                  <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                  <span class="workout__icon">🦶🏼</span>
                  <span class="workout__value">${workout.cadence}</span>
                  <span class="workout__unit">spm</span>
                </div>
              </li>`;
    }

    if (workout.type === `cycling`) {
      html += `<div class="workout__details">
                  <span class="workout__icon">⚡️</span>
                  <span class="workout__value">${workout.speed}</span>
                  <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                  <span class="workout__icon">⛰</span>
                  <span class="workout__value">${workout.elevation}</span>
                  <span class="workout__unit">m</span>
                </div>
              </li>`;
    }

    form.insertAdjacentHTML(`afterend`, html);
  }

  _renderWorkoutMarker(workout) {
    const lat = +workout.coords[0];
    const lng = +workout.coords[1];
    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          maxHeight: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${this._renderTitle(workout)}`)
      .openPopup();
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove(`hidden`);
    inputDistance.focus();
  }

  _hideForm() {
    // Clear fields
    inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = ``;

    // Hide form
    form.style.display = "none";
    form.classList.add(`hidden`);
    setTimeout(() => {
      form.style.display = "grid";
    }, 1000);
  }

  _setLocalStorage() {
    localStorage.setItem(`workouts`, JSON.stringify(this.workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem(`workouts`));
    if (!data) return;
    this.workouts = data;

    this.workouts.forEach((work) => {
      this._renderWorkout(work);
    });
  }

  _toggleElevationField() {
    inputElevation.closest(`.form__row`).classList.toggle(`form__row--hidden`);
    inputCadence.closest(`.form__row`).classList.toggle(`form__row--hidden`);
  }

  _newWorkout(e) {
    const _validInputs = (...inputs) => inputs.every((input) => Number.isFinite(input));
    const _allPositives = (...inputs) => inputs.every((input) => input > 0);

    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If workout is running, Create a new Running object
    if (type === `running`) {
      const cadence = +inputCadence.value;
      // Check if data is valid
      if (!_validInputs(distance, duration, cadence) || !_allPositives(distance, duration, cadence)) {
        // Hide form + Clear input fields
        inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = ``;
        return alert(`Only positive numbers are valid!`);
      }
      workout = new Running([lat, lng], distance, duration, cadence);
      this.workouts.push(workout);
    }

    // If workout is cycling, Create a new Cycling object
    if (type === `cycling`) {
      const elevation = +inputElevation.value;
      // Check if data is valid
      if (!_validInputs(distance, duration, elevation) || !_allPositives(distance, duration)) {
        // Hide form + Clear input fields
        inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = ``;
        return alert(`Only positive numbers are valid!`);
      }
      // Add new object to workout array
      workout = new Cycling([lat, lng], distance, duration, elevation);
      this.workouts.push(workout);
    }

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Hide form + Clear input fields
    this._hideForm();

    // Set Localstorage
    this._setLocalStorage();
  }

  _moveToWorkout(e) {
    const workoutEl = e.target.closest(`.workout`);

    if (!workoutEl) return;

    const workoutId = workoutEl.dataset.id;
    const workout = this.workouts.find((workout) => workout.id === workoutId);

    this.#map.setView([workout.coords[0], workout.coords[1]], 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
}

const app = new App();
