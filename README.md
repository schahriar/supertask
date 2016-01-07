# supertask
[![Build Status](https://travis-ci.org/schahriar/supertask.svg?branch=master)](https://travis-ci.org/schahriar/supertask)
[![Test Coverage](https://codeclimate.com/github/schahriar/supertask/badges/coverage.svg)](https://codeclimate.com/github/schahriar/supertask/coverage)

## Supertask is a NodeJS task queue designed for parallel and cluster execution with optimizations.

**Supertask** was designed to run tasks in parallel and enable for a connected interface to distribute tasks across a network or cluster. A task can either be a local JavaScript function or in form of source which is then compiled and sandboxed through the VM. **This is a base module you should checkout [Supertask-cluster](https://github.com/schahriar/supertask-cluster) a superset of this module that automatically runs and handles tasks on a NodeJS cluster of Workers.**

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
var source = "module.exports = function power(n, x, callback) { callback(null, Math.pow(n,x)); }";
TaskManager.addForeign('foreignPow', source, function callback(error, task) {
    console.log("Task was created", task);
});
```

Change permissions and context of a task and precompilation
```javascript
var Supertask = require('supertask');
var TaskManager = new Supertask();

// Source from network I/O etc.
var source = "module.exports = function cmtp(y, callback) { callback(null, y * gx); }";

TaskManager.addForeign('contextMultiply', source, function callback(error, task) {
    task.permissions(Supertask.ST_MINIMAL); // Allows limited require, Buffer, etc.
    // gx will be available globally
    task.context({ gx: 2 });
    // Compile Task through VM
    task.precompile();
    // Call Task (similar to TaskManager.do)
    task.do(8, function(error, result) {
        // arg[0] * gx = 8 * 2 = 16
        console.log(result);
        // Output: 16
    });
});
```

## API
[API documentation is available here.](./documentation/api.md).

## Disclaimer
This module is not *yet* ready to be used in a production environment. While Supertask has reasonably good stability with over 40 tests it does not fully expose all methods and capabilities and may not function as intended. Supertask-cluster is equally missing some important cluster monitoring methods to keep the cluster alive and well in a production environment. Use it at your own risk.

## License
MIT © Schahriar SaffarShargh <info@schahriar.com>