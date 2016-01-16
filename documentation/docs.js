'use strict'
var fs = require('fs');
var path = require('path');
var render = require('jsdoc-to-markdown');
var stream = fs.createWriteStream("./documentation/api.md");
render({
    src: [path.resolve(__dirname, '../', 'interface.js'), path.resolve(__dirname, '../lib/', 'TaskObject.js')],
    separators: true
}).pipe(stream);