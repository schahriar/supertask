var moment = require('moment');

require('blanket')({
	pattern: __dirname,
    "data-cover-never": [ "node_modules", "tests" ],
    "data-cover-reporter-options": {
        "shortnames": true
    },
    "data-cover-flags": {
        "engineOnly":true
    }
});

// Run Main
require('./tests/main.js');

//console.log("<small style='opacity: 0.7; display: block; margin: 7px 13px;'> Generated on: ", moment().format('MMMM Do YYYY, h:mm:ss a'), '</small>');