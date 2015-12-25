var moment = require('moment');

require('blanket')({
	pattern: __dirname,
    "data-cover-never": [ "node_modules", "tests" ],
    "data-cover-reporter-options": {
        "shortnames": true
    }
});

// Run Main
require('./tests/main.js');

console.log("<small style='opacity: 0.7; margin: 12px 8px;'> Generated on: ", moment().format('MMMM Do YYYY, h:mm:ss a'), '</small>');