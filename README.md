# filtertable

A simple table column and free-text filter script. For *[reasons]* this was needed versus one of the many existing libraries.

### Usage

1. Copy the lib into `/filtertable` (this is the assumption for the css path etc)
2. Import the JS module `import FilterTable from './filtertable/filtertable.js'` (or whatever relative path)
3. Call `FilterTable.init([optional: relative path])` in order to inject required css (relative path refers to the path with the `filtertable` directory, if it's not `./`
4. Call `new FilterTable(document.getElementById('id-of-your-table'));`
5. Add the `filterable` class to any headers you want to filter
6. If you want free-text filtering, add an input similar to `<input id="text-filter" type="text" class="filterable"
        data-table-id="id-of-your-table" data-col-ids="col1, col2">`
   1. Make sure that each column that will be filterable has `data-col-id` set to an id (that is then used above)
