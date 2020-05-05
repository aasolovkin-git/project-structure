export default class RangePicker {
  element;
  subElements = {};
  selectingDateRange = false;
  selected = {
    from: new Date(),
    to: new Date()
  };

  constructor({
    from = new Date(),
    to = new Date()} = {}
  ) {
    this.shownCalendarMonth = { year: to.getFullYear(), month: to.getMonth() };
    this.newDateRangeFrom = new Date(from);
    this.selected = {from, to};
  }

  get template () {
    return `
    <div class="container">
      <div class="rangepicker">
        <div class="rangepicker__input" data-elem="input">
          <span data-elem="from"></span> -
          <span data-elem="to"></span>
        </div>
        <div class="rangepicker__selector" data-elem="selector">
          <div class="rangepicker__selector-arrow"></div>
          <div class="rangepicker__selector-control-left"></div>
          <div class="rangepicker__selector-control-right"></div>        
        </div>
      </div>
    </div>
    `;
  }

  getCalendarTemplate(year, month) {
    let getMonthAlias = monthIndex => {
      return monthIndex >= 0 && monthIndex <=11 
        ? ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"][monthIndex]
        : "Не известный месяц";
    }  

    let getDayOfWeek = (year, month) => {
      let firstDayOfMonth = new Date(year, month, 1);
      return firstDayOfMonth.getDay() === 0 ? 7 : firstDayOfMonth.getDay();
    };

    let getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

    let monthAlias = getMonthAlias(month);

    return `
    <div class="rangepicker__calendar">
      <div class="rangepicker__month-indicator">
        <time datetime="${monthAlias}">${monthAlias}</time>
      </div>
      <div class="rangepicker__day-of-week">
        <div>Пн</div>
        <div>Вт</div>
        <div>Ср</div>
        <div>Чт</div>
        <div>Пт</div>
        <div>Сб</div>
        <div>Вс</div>
      </div>
      <div class="rangepicker__date-grid">
        ${
          [ ...new Array(getDaysInMonth(year, month))]
          .map((item, itemIndex) => {
            let dayDate = new Date(Date.UTC(year, month, itemIndex + 1, 0, 0, 0));
            return `<button type="button" ${ itemIndex === 0 ? 'style="--start-from: '+getDayOfWeek(year, month)+'"': ''}  class="rangepicker__cell" data-value="${ dayDate.toISOString() }">${itemIndex + 1}</button>`;
          })
          .join("")
        }
      </div>
    </div>    
    `;
  }

  compareDate(date1, date2) {
    let getDateIndex = date => date.getFullYear() * 10000 + date.getMonth() * 100 + date.getDate();
    return getDateIndex(date1) - getDateIndex(date2);
  }

  selectCalendarCells({from, to} = {}) {
    let [dateFrom, dateTo] = (from && to)
      ? [from, to].sort(this.compareDate)
      : [from, to];

    this.subElements.selector
      .querySelectorAll(".rangepicker__calendar .rangepicker__date-grid .rangepicker__cell")
      .forEach(item => { 
        item.classList.remove("rangepicker__selected-from");
        item.classList.remove("rangepicker__selected-between");
        item.classList.remove("rangepicker__selected-to");

        let itemDate = new Date(item.dataset.value);
        
        if(Boolean(dateFrom) && this.compareDate(dateFrom, itemDate) === 0) {
          item.classList.add("rangepicker__selected-from");
        }
        
        if(Boolean(dateFrom) && Boolean(dateTo) && this.compareDate(dateFrom, itemDate) < 0 && this.compareDate(dateTo, itemDate) > 0) {
          item.classList.add("rangepicker__selected-between");
        }

        if(Boolean(dateTo) && this.compareDate(dateTo, itemDate) === 0) {
          item.classList.add("rangepicker__selected-to");
        }
      });
  }

  setInputValues({from, to} = {}) {
    let [dateFrom, dateTo] = (from && to)
      ? [from, to].sort(this.compareDate)
      : [from, to];

    let dateToString = (date) => {
      return date
        ? date.toLocaleString('ru', {dateStyle: 'short'})
        : ""; 
    };

    this.subElements.from.textContent = dateToString(from);
    this.subElements.to.textContent = dateToString(to);
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.template;
    this.element = wrapper.firstElementChild;
    
    this.subElements = this.getSubElements(this.element);

    this.rangepickerElement = this.subElements.input.closest(".rangepicker");

    this.setInputValues(this.selected);
    
    this.initEventListeners();

    return this.element;
  }

  getSubElements (element) {
    return [ ...element.querySelectorAll('[data-elem]') ].reduce((subElements, item) => { 
      subElements[item.dataset.elem] = item;
      return subElements;
    }, {});
  }

  getPrevMonth( { year, month } = {} ) {
    let date = new Date(year, month - 1, 1);

    return {
      year: date.getFullYear(), 
      month: date.getMonth()
    }
  }  

  getNextMonth( { year, month } = {} ) {
    let date = new Date(year, month + 1, 1);

    return {
      year: date.getFullYear(), 
      month: date.getMonth()
    }
  } 

  renderCalendars() {
    this.subElements.selector.querySelectorAll("div.rangepicker__calendar").forEach(item => item.remove());

    let shownCalendarPrevMonth = this.getPrevMonth(this.shownCalendarMonth);

    this.subElements.selector.insertAdjacentHTML("beforeEnd", 
      this.getCalendarTemplate(shownCalendarPrevMonth.year, shownCalendarPrevMonth.month) + 
      this.getCalendarTemplate(this.shownCalendarMonth.year, this.shownCalendarMonth.month));
  }

  get isRangepickerOpened() {
    return this.rangepickerElement.classList.contains("rangepicker_open");
  }

  OnClickOutOfRangepicker = (event) => {
    let rangepicker = event.target.closest(".rangepicker");
    if (!rangepicker) {
      this.closeRangepicker();
    }
  }

  openRangepicker() {
    this.selectingDateRange = false;
    this.newDateRangeFrom = new Date(this.selected.from);
    this.shownCalendarMonth = { year: this.selected.to.getFullYear(), month: this.selected.to.getMonth() };

    this.renderCalendars();
    this.selectCalendarCells(this.selected);

    this.rangepickerElement.classList.add("rangepicker_open");
    
    document.addEventListener("click", this.OnClickOutOfRangepicker);
  }

  closeRangepicker() {
    this.rangepickerElement.classList.remove("rangepicker_open");
    document.removeEventListener("click", this.OnClickOutOfRangepicker);
  }

  OnInputClick = (event) => {
    if (this.isRangepickerOpened) {
      this.closeRangepicker();
    } else {
      this.openRangepicker();
    }
  }

  OnSelectorClick = (event) => {
    let controlLeft = event.target.closest(".rangepicker__selector-control-left");
    let controlRight = event.target.closest(".rangepicker__selector-control-right");

    if (controlLeft || controlRight) {
      this.shownCalendarMonth = controlLeft
        ? this.getPrevMonth(this.shownCalendarMonth)
        : this.getNextMonth(this.shownCalendarMonth);

      this.renderCalendars();
      this.selectCalendarCells(!this.selectingDateRange ? this.selected : {from: this.newDateRangeFrom, to: null});
    }

    let rangepickerCell = event.target.closest(".rangepicker__cell");

    if (rangepickerCell) {
      if (!this.selectingDateRange) {
        this.newDateRangeFrom = new Date(rangepickerCell.dataset.value);
      } else {
        let selectedDate = new Date(rangepickerCell.dataset.value);
        let [ dateFrom, dateTo ] = [this.newDateRangeFrom, selectedDate].sort(this.compareDate);
        
        this.selected = {
          from: dateFrom, 
          to: dateTo
        };

        this.setInputValues(this.selected);
      }    

      this.selectingDateRange = !this.selectingDateRange;

      this.selectCalendarCells(!this.selectingDateRange ? this.selected : {from: this.newDateRangeFrom, to: null});

      if (!this.selectingDateRange) {
        this.closeRangepicker();
        this.dispatchChoosedEvent();
      }
    }
  }

  dispatchChoosedEvent() {
    this.element.dispatchEvent(new CustomEvent("range-picker-choosed", {
      bubbles: true,
      detail: {
        selected: this.selected
      }
    }));
  }

  initEventListeners () {
    this.subElements.input.addEventListener("click", this.OnInputClick);
    this.subElements.selector.addEventListener("click", this.OnSelectorClick);
  }

  removeEventListeners () {
    this.subElements.input.removeEventListener("click", this.OnInputClick);
    this.subElements.selector.removeEventListener("click", this.OnSelectorClick);
  }

  remove () {
    this.element.remove();
  }

  destroy() {
    this.removeEventListeners();
    this.remove();
  }
}
