# supertask
[![Build Status](https://travis-ci.org/schahriar/supertask.svg?branch=master)](https://travis-ci.org/schahriar/supertask)
[![Test Coverage](https://codeclimate.com/github/schahriar/supertask/badges/coverage.svg)](https://codeclimate.com/github/schahriar/supertask/coverage)

## Supertask is a NodeJS task queue designed for parallel and cluster execution with optimizations.

**Supertask** was designed to run tasks in parallel and enable for a connected interface to distribute tasks across a network or cluster. A task can either be a local JavaScript function or in form of source which is then compiled and sandboxed through the VM.

# Installation
Note that Supertask requires *ES6* and is designed to run on NodeJS 4.x and above.
```javascript
npm install supertask
```

# Usage
Create a new local task with a unique name. Note that a unique name is required for every task.
```javascript
var Supertask = require('supertask');
var TaskManager = new Supertask();

TaskManager.addLocal('taskname', function power(n, x, callback) {
    // n^x function
    callback(null, Math.pow(n,x));
}, function callback(error, task) {
    console.log("Task was created", task);
});
```

Run task. You can pass arguments after name and before callback.

```javascript
TaskManager.do('taskname', 2, 4, function callback(error, result) {
    console.log("2^4 is equal to", result);
});
```

Add a foreign task
```javascript
// Source from network I/O etc.
var source = "module.exports = function power(n, x, callback) { callback(null, Math.pow(n,x)); }"
TaskManager.addForeign('foreignPow', source, function callback(error, task) {
    console.log("Task was created", task);
});
```

Add a remote task
```javascript
// Launch task on cluster, etc.
var handler = function(arg1, arg2, ..., callback) {
    // launch on cluster
    callback(error, result1, result2);
};
TaskManager.addRemote('foreignPow', handler, function callback(error, task) {
    console.log("Task was created", task);
});
```

More documentation and methods coming soon. Check out the test functions for more information in the mean time.


## License
MIT © Schahriar SaffarShargh <info@schahriar.com>