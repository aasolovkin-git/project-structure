export default class ColumnChart {
  element;
  subElements = {};
  chartHeight = 50;

  constructor({
    data = {},
    label = '',
    link = '',
    value = 0
  } = {}) {
    this.data = data;
    this.label = label;
    this.link = link;
    this.value = value;
  }

  formatValue(value) {
    return value;
  }

  getTooltip({ dateString, value } = {}) {
    let [ year = 1900, month = 1, day = 1 ] = dateString.split("-").map(item => +item);
    return `<div><small>${new Date(year, month, day).toLocaleString('ru', {dateStyle: 'medium'})}</small></div><strong>${this.formatValue(value)}</strong>`;
  }

  getColumnBody(data) {
    const dataItems = Object.keys(data);
    const maxValue = Math.max(...dataItems.map(item => data[item]));

    return dataItems
    .map(item => {
      const scale = this.chartHeight / maxValue;
      return `<div style="--value: ${Math.floor(data[item] * scale)}" data-tooltip="${this.getTooltip( { dateString: item, value: data[item] })}"></div>`;
    })
    .join('');
  }

  getLink() {
    return this.link ? `<a class="column-chart__link" href="${this.link}">Подробнее</a>` : '';
  }

  get template () {
    return `
      <div class="column-chart column-chart_loading" style="--chart-height: ${this.chartHeight}">
        <div class="column-chart__title">
          ${this.label}
          ${this.getLink()}
        </div>
        <div class="column-chart__container">
          <div data-element="header" class="column-chart__header">
            ${this.value}
          </div>
          <div data-element="body" class="column-chart__chart">
            ${this.getColumnBody(this.data)}
          </div>
        </div>
      </div>
    `;
  }

  async render() {
    const element = document.createElement('div');

    element.innerHTML = this.template;
    this.element = element.firstElementChild;

    if (this.data) {
      this.element.classList.remove(`column-chart_loading`);
    }

    this.subElements = this.getSubElements(this.element);

    return this.element;
  }

  getSubElements (element) {
    const elements = element.querySelectorAll('[data-element]');

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  update ({headerData = null, bodyData = null } = {}) {
    this.subElements.header.textContent = headerData;
    this.subElements.body.innerHTML = this.getColumnBody(bodyData || {});

    if (bodyData) {
      this.element.classList.remove(`column-chart_loading`);
    } else {
      this.element.classList.add(`column-chart_loading`);
    }
  }

  destroy() {
    this.element.remove();
  }
}
