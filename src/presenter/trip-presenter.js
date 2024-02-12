import TripInfoView from '../view/trip-info-view.js';
import SortView from '../view/sort-view.js';
import EventsListView from '../view/events-list-view.js';
import EventPresenter from './event-presenter.js';
import NewEventPresenter from './new-event-presenter.js';
import NoEventsView from '../view/no-events-view.js';
import LoadingView from '../view/loading-view.js';
import { render, RenderPosition, remove } from '../framework/render.js';
import { sortByTime, sortByPrice, filter } from '../utils/utils.js';
import { SortType, UpdateType, UserAction, FilterType, TimeLimit } from '../utils/const.js';
import UiBlocker from '../framework/ui-blocker/ui-blocker.js';

export default class TripPresenter {
  #eventsListComponent = new EventsListView();
  #tripElement = null;
  #eventsElement = null;
  #eventsModel = null;
  #filterModel = null;
  #sortComponent = null;
  #noEventsComponent = null;
  #loadingComponent = new LoadingView();
  #isLoading = true;
  #tripInfoComponent = null;
  #eventPresenters = new Map();
  #newEventPresenter = null;
  #currentSortType = SortType.DEFAULT;
  #filterType = FilterType.EVERYTHING;
  #onNewEventDestroy = null;
  #uiBlocker = new UiBlocker({
    lowerLimit: TimeLimit.LOWER_LIMIT,
    upperLimit: TimeLimit.UPPER_LIMIT
  });

  constructor({ tripElement, eventsElement, eventsModel, filterModel, onNewEventDestroy }) {
    this.#tripElement = tripElement;
    this.#eventsElement = eventsElement;
    this.#eventsModel = eventsModel;
    this.#filterModel = filterModel;
    this.#onNewEventDestroy = onNewEventDestroy;
    this.#eventsModel.addObserver(this.#handleModelEvent);
    this.#filterModel.addObserver(this.#handleModelEvent);

  }

  get events() {
    const events = this.#eventsModel.events;
    this.#filterType = this.#filterModel.filter;
    const filteredEvents = [...filter[this.#filterType](events)];
    switch (this.#currentSortType) {
      case SortType.TIME:
        return filteredEvents.sort(sortByTime);
      case SortType.PRICE:
        return filteredEvents.sort(sortByPrice);
    }


    return filteredEvents;
  }

  get offers() {
    return this.#eventsModel.offers;
  }

  get types() {
    return this.#eventsModel.offers.map((item) => item.type);
  }

  get destinations() {
    return this.#eventsModel.destinations;
  }

  createEvent() {
    this.#currentSortType = SortType.DEFAULT;
    this.#filterModel.setFilter(UpdateType.MAJOR, FilterType.EVERYTHING);
    this.createNewEventPresenter();
    this.#newEventPresenter.init();
  }

  createNewEventPresenter() {
    this.#newEventPresenter = new NewEventPresenter({
      destinations: this.destinations,
      types: this.types,
      offers: this.offers,
      eventListContainer: this.#eventsListComponent.element,
      onDataChange: this.#handleViewAction,
      onDestroy: this.#onNewEventDestroy
    });
  }

  #handleViewAction = async (actionType, updateType, update) => {
    this.#uiBlocker.block();

    switch (actionType) {
      case UserAction.UPDATE_EVENT:
        this.#eventPresenters.get(update.id).setSaving();
        try {
          await this.#eventsModel.updateEvent(updateType, update);
        } catch (err) {
          this.#eventPresenters.get(update.id).setAborting();
        }
        break;
      case UserAction.ADD_EVENT:
        this.#newEventPresenter.setSaving();
        try {
          await this.#eventsModel.addEvent(updateType, update);
        } catch (err) {
          this.#newEventPresenter.setAborting();
        }
        break;
      case UserAction.DELETE_EVENT:
        this.#eventPresenters.get(update.id).setDeleting();
        try {
          await this.#eventsModel.deleteEvent(updateType, update);
        } catch (err) {
          this.#eventPresenters.get(update.id).setAborting();
        }
        break;
    }
    this.#uiBlocker.unblock();
  };

  getTotalPrice() {
    let totalPrice = 0;
    this.events.forEach((event) => {
      const offersByType = this.offers.find((item) => item.type === event.type).offers;
      offersByType.filter((offer) => event.offers.includes(offer.id)).forEach((offer) => {
        totalPrice += offer.price;
      });
      totalPrice += event.basePrice;
    });
    return totalPrice;
  }

  #handleModelEvent = (updateType, data) => {
    switch (updateType) {
      case UpdateType.PATCH:
        this.#eventPresenters.get(data.id).init(data);
        break;
      case UpdateType.MINOR:
        this.#clearBoard();
        this.#renderBoard();
        break;
      case UpdateType.MAJOR:
        this.#clearBoard({ resetRenderedTaskCount: true, resetSortType: true });
        this.#renderBoard();
        break;
      case UpdateType.INIT:
        this.#isLoading = false;
        remove(this.#loadingComponent);
        this.#renderBoard();
        break;
    }
  };

  #handleModeChange = () => {
    if (this.#newEventPresenter) {
      this.#newEventPresenter.destroy();
    }
    this.#eventPresenters.forEach((presenter) => presenter.resetView());
  };

  #handleSortTypeChange = (sortType) => {
    if (this.#currentSortType === sortType) {
      return;
    }

    this.#currentSortType = sortType;
    this.#clearBoard({ resetRenderedTaskCount: true });
    this.#renderBoard();
  };

  #renderLoading() {
    render(this.#loadingComponent, this.#eventsElement, RenderPosition.AFTERBEGIN);
  }

  #renderSort() {
    this.#sortComponent = new SortView({
      onSortTypeChange: this.#handleSortTypeChange,
      currentSortType: this.#currentSortType
    });

    render(this.#sortComponent, this.#eventsElement, RenderPosition.AFTERBEGIN);
  }

  #renderTripInfo() {
    this.#tripInfoComponent = new TripInfoView({
      destinations: this.destinations,
      events: [...this.events].sort(sortByTime),
      totalPrice: this.getTotalPrice()
    });
    render(this.#tripInfoComponent, this.#tripElement, RenderPosition.AFTERBEGIN);
  }

  #clearBoard({ resetSortType = false } = {}) {
    if (this.#newEventPresenter !== null) {
      this.#newEventPresenter.destroy();
    }

    this.#eventPresenters.forEach((presenter) => presenter.destroy());
    this.#eventPresenters.clear();

    remove(this.#sortComponent);
    remove(this.#noEventsComponent);
    remove(this.#loadingComponent);
    remove(this.#tripInfoComponent);

    if (this.#noEventsComponent) {
      remove(this.#noEventsComponent);
    }

    if (resetSortType) {
      this.#currentSortType = SortType.DEFAULT;
    }
  }

  #renderNoEvent() {
    this.#noEventsComponent = new NoEventsView({
      filterType: this.#filterType
    });
    render(this.#noEventsComponent, this.#eventsElement, RenderPosition.AFTEREND);
  }

  #renderEvent(event) {
    const eventPresenter = new EventPresenter({
      eventListContainer: this.#eventsListComponent,
      destinations: this.destinations,
      types: this.types,
      offers: this.offers,
      onDataChange: this.#handleViewAction,
      onModeChange: this.#handleModeChange,
    });

    eventPresenter.init(event);
    this.#eventPresenters.set(event.id, eventPresenter);
  }

  #renderEvents() {
    for (const event of this.events) {
      this.#renderEvent(event);
    }
  }

  #renderBoard() {
    this.#renderSort();
    render(this.#eventsListComponent, this.#eventsElement);

    if (this.#isLoading) {
      this.#renderLoading();
      return;
    }

    if (this.events.length === 0) {
      this.#renderNoEvent();
    } else {
      this.#renderTripInfo();
      this.#renderEvents();
    }
  }
}
