export default class FilterTable {

  static SELECT_ALL = '(Select All)';

  static initialized = false;

  table = null;

  // expect:
  // {
  //   col_id: {
  //     values: [{value: {visible: bool}],
  //     filter: string
  //   }
  // }
  filters = {};

  constructor(table) {

    if (!FilterTable.initialized) {
      throw new Error('Must call FilterTable.init() before contructing instances of this class');
    }

    this.table = table;

    table
      .querySelectorAll('th.filterable')
      .forEach(header => this.#createHeaderFilter(header));

    // find all text filters that target this table
    document
      .querySelectorAll(`input[data-table-id="${table.id}"]`)
      .forEach(txtbox => this.#createTextFilter(txtbox));
  }

  static init(pathPrefix) {
    if (FilterTable.initialized) return;

    FilterTable.initialized = true;

    // inject filtertable css into the page
    let path = 'filtertable/filtertable.css';

    if (pathPrefix !== undefined) {
      path = `${pathPrefix}/${path}`;
    }

    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = path;

    document.head.appendChild(cssLink);
  }

  #createTextFilter(txtbox) {

    const colIds = txtbox.dataset.colIds.split(',');

    // initialize the text filters
    colIds.forEach(colId => {

      if (!this.filters[this.#getColumnIndex(this.#getColumnByDataId(colId))]) {
        this.filters[this.#getColumnIndex(this.#getColumnByDataId(colId))] = {
          values: {},
          filter: ''
        };
      }
    });

    txtbox.addEventListener('input', e => {

      // update the filter value from the textbox on each associated column
      colIds.forEach(colId => (
        this
          .filters[this.#getColumnIndex(this.#getColumnByDataId(colId))]
          .filter = txtbox.value.toLowerCase()
      ));

      this.filter();
    });
  }

  #getColumnByDataId(dataId) {
    return this.table.querySelector(`thead th[data-col-id="${dataId}"]`);
  }

  #getColumnIndex(col) {
    return Array.from(col.parentNode.children).indexOf(col);
  }

  #createHeaderFilter(header) {
    const table = header.closest('table');
    const text = header.querySelector('.ft-select-box div')?.textContent || header.textContent;
    const colIndex = this.#getColumnIndex(header);

    const uniqueOptions = Array
      .from(table.querySelectorAll(`tbody tr td:nth-child(${colIndex + 1})`))
      .map(td => td.textContent.trim())
      .filter((elem, index, array) => array.indexOf(elem) === index)
      .sort();

    // add in the "select-all" option
    uniqueOptions.unshift(FilterTable.SELECT_ALL);

    const div = document.createElement('div');
    const div2 = document.createElement('div');
    div2.className = "ft-select-box";
    const select = document.createElement('div');
    select.innerText = text;
    div2.appendChild(select);

    const dropdown = document.createElement('div');
    dropdown.className = "ft-select-checkboxes";

    this.filters[colIndex] = { values: [], filter: '' }

    uniqueOptions.forEach(opt => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = true;
      input.addEventListener('change', () => this.#updateColumnFilter(header, colIndex, input));
      if (opt === FilterTable.SELECT_ALL) input.className = 'ft-sortable-select-all';
      label.append(input, opt);
      dropdown.appendChild(label);

      this.filters[colIndex].values[opt] = { visible: true };
    });

    div.appendChild(div2);
    div.appendChild(dropdown);

    div.addEventListener('click', (e) => {
      this.#closeDropdowns();
      dropdown.style.display = (dropdown.style.display === "block" ? "none" : "block");

      // prevent higher click handlers from running (for example, to prevent sorting
      // the header every time the select is clicked)
      e.stopImmediatePropagation();
    });

    // close the drop down when you click outside the dropdown
    document.addEventListener('click', (event) => {

      if (!event.target.closest('.ft-select-checkboxes')) {
        this.#closeDropdowns();
      }
    });

    header.replaceChildren(div);
  }

  #closeDropdowns() {
    document.querySelectorAll('.ft-select-checkboxes').forEach(element => {
      element.style.display = 'none';
    });
  }

  #updateColumnFilter(header, colId, input) {
    const dropdown = header.querySelector('.ft-select-checkboxes');
    const isChecked = input.checked;

    const checkedOptions = Array.from(dropdown.querySelectorAll('input[type="checkbox"]:checked:not(.ft-sortable-select-all)'))
      .map(checkbox => checkbox.nextSibling.textContent);

    if (input.classList.contains('ft-sortable-select-all')) {

      // check / uncheck all of the checkboxes
      dropdown
        .querySelectorAll('input:not(.ft-sortable-select-all)')
        .forEach(cb => (cb.checked = isChecked));

      // set all of the value filters to the correct value
      Object.values(this.filters[colId].values).forEach(value => (value.visible = isChecked));

    } else {

      const selectedValue = input.nextSibling.textContent;
      this.filters[colId].values[selectedValue].visible = isChecked;

      const allVisible = Object.values(this.filters[colId].values).every(value => value.visible);

      const selectAllCheckbox = dropdown.querySelector('.ft-sortable-select-all');
      selectAllCheckbox.checked = allVisible;
    }

    this.filter();
  }

  filter() {
    this.table.querySelectorAll('tbody tr').forEach(row => {

      const cells = Array.from(row.querySelectorAll('td'));

      // should the row be visible, based on the values in all columns
      // (i.e. not text filters)
      const allColsVisible = cells.every((col, colId) =>
        this.filters[colId]?.values[col.textContent]?.visible ?? true
      );

      let textFilterRequested = false;

      const filterTextMatches = cells.some((col, colId) => {

        textFilterRequested ||= !this.#undefinedOrEmpty(this.filters[colId]?.filter);

        return (
          this.filters[colId] &&
          this.filters[colId].filter !== '' &&
          col.textContent.toLowerCase().includes(this.filters[colId].filter)
        );
      });

      row.style.display = (allColsVisible && (!textFilterRequested || filterTextMatches) ? '' : 'none');
    });
  }

  #undefinedOrEmpty(str) {
    return str === undefined || str === null || str.trim() === '';
  }

}
