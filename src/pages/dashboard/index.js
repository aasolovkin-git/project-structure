import SortableTable from "../../components/sortable-table/index.js";
import header from './bestsellers-header.js';
import ColumnChart from "../../components/column-chart/index.js";
import RangePicker from "../../components/range-picker/index.js";
import fetchJson from "../../utils/fetch-json.js";

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class Page {
  element;
  subElements = {};
  components = {};

  constructor () {
    this.initComponents();
    this.initEventListeners();
  }

  initComponents () {
    let curDate = new Date();

    const rangePicker = new RangePicker({
      from: new Date(curDate.getFullYear(), curDate.getMonth() - 1, curDate.getDate()),
      to: curDate
    });

    // TODO: replace by API for Bestsellers products
    const sortableTable = new SortableTable(header, {
      url: 'api/dashboard/bestsellers', //?from=2020-04-05T14%3A42%3A29.319Z&to=2020-05-05T14%3A42%3A29.319Z
      isSortLocally: true,
      step: 30,
      start: 0,
      sorted: {
        id: 'title',
        order: 'asc'
      },
      from: rangePicker.selected.from,
      to: rangePicker.selected.to
    });

    // TODO: replace "mocked" data by real API calls
    const ordersChart = new ColumnChart({
      label: 'Заказы',
      link: 'sales'
    });

    // TODO: replace "mocked" data by real API calls
    const salesChart = new ColumnChart({
      label: 'Продажи',
    });

    salesChart.formatValue = value => {
      var gasPrice = new Intl.NumberFormat("en-US",
                      { style: "currency", currency: "USD", minimumFractionDigits: 0 });

      return gasPrice.format(value);
    };

    // TODO: replace "mocked" data by real API calls
    const customersChart = new ColumnChart({
      label: 'Клиенты',
    });

    this.components.sortableTable = sortableTable;
    this.components.ordersChart = ordersChart;
    this.components.salesChart = salesChart;
    this.components.customersChart = customersChart;
    this.components.rangePicker = rangePicker;
  }

  get template () {
    return `<div class="dashboard">
      <div class="content__top-panel">
        <h2 class="page-title">Панель управления</h2>
        <div data-element="rangePicker"></div>
      </div>
      <div data-element="chartsRoot" class="dashboard__charts">
        <!-- column-chart components -->
        <div data-element="ordersChart" class="dashboard__chart_orders"></div>
        <div data-element="salesChart" class="dashboard__chart_sales"></div>
        <div data-element="customersChart" class="dashboard__chart_customers"></div>
      </div>

      <h3 class="block-title">Лидеры продаж</h3>

      <div data-element="sortableTable"></div>
    </div>`;
  }

  async render () {
    const element = document.createElement('div');

    element.innerHTML = this.template;

    this.element = element.firstElementChild;
    this.subElements = this.getSubElements(this.element);

    await this.renderComponents();

    await this.reinitCharts(this.components.rangePicker.selected);

    return this.element;
  }

  async renderComponents () {
    // NOTE: All renders in components are async (check in components)
    const promises = Object.values(this.components).map(item => Promise.resolve(item.render()));
    const elements = await Promise.all(promises);

    Object.keys(this.components).forEach((component, index) => {
      this.subElements[component].append(elements[index]);
    });
  }

  getSubElements ($element) {
    const elements = $element.querySelectorAll('[data-element]');

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  async getChartData(chartName = 'orders', { from = new Date(), to = new Date() } = {} ) {
    let result = [];

    let url = new URL(`api/dashboard/${chartName}`, BACKEND_URL);
    url.searchParams.set('from', from.toISOString());
    url.searchParams.set('to', to.toISOString());
    
    return await fetchJson(url);
  }

  initChart = (chart, data) => {
      let sum = Object.keys(data).map(item => data[item]).reduce((sum, value) => sum += value, 0);
      
      chart.update({
        headerData: chart.formatValue(sum), 
        bodyData: data
      });
  };

  showChartLoadingPlaceholder(chart) {
    chart.update({});
  }

  async reinitCharts({ from = new Date(), to = new Date() } = {} ) {
    let { ordersChart, salesChart, customersChart } = this.components;
    
    this.showChartLoadingPlaceholder(ordersChart);
    this.showChartLoadingPlaceholder(salesChart);
    this.showChartLoadingPlaceholder(customersChart);

    let [ ordersChartData, salesChartData, customersChartData ] = await Promise.all([
      this.getChartData('orders', { from: from, to: to }), 
      this.getChartData('sales', { from: from, to: to }), 
      this.getChartData('customers', { from: from, to: to })
    ]);

    this.initChart(ordersChart, ordersChartData);
    this.initChart(salesChart, salesChartData);
    this.initChart(customersChart, customersChartData);
  }

  async reinitSortableTable({ from = new Date(), to = new Date() } = {} ) {
    let sortableTable = this.components.sortableTable;
    const {id, order} = sortableTable.sorted;

    sortableTable.from = from;
    sortableTable.to = to;
    
    await sortableTable.sortOnServer(id, order, 0, this.step);
  }

  onRangePickerChoosed = async (event) => {
    await Promise.all([
      this.reinitCharts(event.detail.selected),
      this.reinitSortableTable(event.detail.selected)
    ]);
  }

  initEventListeners () {
    document.addEventListener("range-picker-choosed", this.onRangePickerChoosed);
  }

  destroy () {
    document.removeEventListener("range-picker-choosed", this.onRangePickerChoosed);

    for (const component of Object.values(this.components)) {
      component.destroy();
    }
  }
}
