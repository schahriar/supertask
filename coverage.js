require('blanket')({
	pattern: __dirname,
    "data-cover-never": [ "node_modules", "tests" ],
    "data-cover-reporter-options": {
        "shortnames": false
    }
});

// Run Main
require('./tests/main.js');