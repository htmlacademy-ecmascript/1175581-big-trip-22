import TripPresenter from './presenter/trip-presenter.js';
import FilterPresenter from './presenter/filter-presenter.js';
import NewEventButtonView from './view/new-event-button-view.js';
import EventsApiService from './api/events-api-service.js';
import EventsModel from './model/events-model.js';
import FilterModel from './model/filter-model.js';

import { render } from './framework/render.js';

const AUTHORIZATION = 'Basic kh34jhh23vvxchiohio3';
const END_POINT = 'https://22.objects.htmlacademy.pro/big-trip';

const filtersElement = document.querySelector('.trip-controls__filters');
const tripElement = document.querySelector('.trip-main');
const eventsElement = document.querySelector('.trip-events');
const filterModel = new FilterModel();

const eventsModel = new EventsModel({
  eventsApiService: new EventsApiService(END_POINT, AUTHORIZATION)
});

const tripPresenter = new TripPresenter({ tripElement, eventsElement, eventsModel, filterModel, onNewTaskDestroy: handleNewEventFormClose });

const filterPresenter = new FilterPresenter({
  filterContainer: filtersElement,
  filterModel,
  eventsModel
});

const newEventButtonComponent = new NewEventButtonView({
  onClick: handleNewTaskButtonClick
});

function handleNewEventFormClose() {
  newEventButtonComponent.element.disabled = false;
}

function handleNewTaskButtonClick() {
  tripPresenter.createEvent();
  newEventButtonComponent.element.disabled = true;
}

filterPresenter.init();
tripPresenter.init();
eventsModel.init()
  .finally(() => {
    render(newEventButtonComponent, tripElement);
  });
