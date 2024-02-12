import TripPresenter from './presenter/trip-presenter.js';
import FilterPresenter from './presenter/filter-presenter.js';
import NewEventButtonView from './view/new-event-button-view.js';
import EventsApiService from './api/events-api-service.js';
import EventsModel from './model/events-model.js';
import FilterModel from './model/filter-model.js';

import { render } from './framework/render.js';

const AUTHORIZATION = 'Basic kh3d4djhhd23fsfdfvfwfvxdfdcdfdghikoheio3';
const END_POINT = 'https://22.objects.htmlacademy.pro/big-trip';

const filtersElement = document.querySelector('.trip-controls__filters');
const tripElement = document.querySelector('.trip-main');
const eventsElement = document.querySelector('.trip-events');
const filterModel = new FilterModel();

const eventsModel = new EventsModel({
  eventsApiService: new EventsApiService(END_POINT, AUTHORIZATION)
});

const tripPresenter = new TripPresenter({ tripElement, eventsElement, eventsModel, filterModel, onNewEventDestroy: handleNewEventFormClose });

const filterPresenter = new FilterPresenter({
  filterContainer: filtersElement,
  filterModel,
  eventsModel
});

const newEventButtonComponent = new NewEventButtonView({
  onClick: handleNewEventButtonClick
});

function handleNewEventFormClose() {
  newEventButtonComponent.element.disabled = false;
}

function handleNewEventButtonClick() {
  tripPresenter.createEvent();
  newEventButtonComponent.element.disabled = true;
}

eventsModel.init()
  .finally(() => {
    render(newEventButtonComponent, tripElement);
  });
filterPresenter.init();
