# supertask
[![Build Status](https://travis-ci.org/schahriar/supertask.svg?branch=master)](https://travis-ci.org/schahriar/supertask)
[![Test Coverage](https://codeclimate.com/github/schahriar/supertask/badges/coverage.svg)](https://codeclimate.com/github/schahriar/supertask/coverage)

## Supertask is a NodeJS task queue designed for parallel and cluster execution.

**Supertask** was designed to run tasks in parallel and enable for a connected interface to distribute tasks across a network or cluster. A task can either be a local JavaScript function or in form of source which is then compiled and sandboxed through the VM. It utilizes a [**double-ended queue**](https://en.wikipedia.org/wiki/Double-ended_queue) to manage and execute given tasks.

 **Note that there is no underlying interface for parallelization or clustering and this module enables such features through tasks.**

# Installation
Note that Supertask requires *ES6* and is designed to run on NodeJS 4.x and above.
```javascript
npm install supertask
```

# Usage
Create a new local task with a unique name. **Note that a unique name is required for every task.**
```javascript
var Supertask = require('supertask');
var TaskManager = new Supertask();

var task = TaskManager.addLocal('taskname', function power(n, x, callback) {
    // n^x function
    callback(null, Math.pow(n,x));
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
var task = TaskManager.addForeign('foreignPow', source);
```

Change permissions and globals of a task and precompilation
```javascript
var Supertask = require('supertask');
var TaskManager = new Supertask();

// Source from network I/O etc.
var source = "module.exports = function cmtp(y, callback) { callback(null, y * gx); }";

var task = TaskManager.addForeign('globalMultiply', source);
task.permissions(Supertask.ST_MINIMAL); // Allows limited require, Buffer, etc.
// gx will be available globally
task.globals({ gx: 2 });
// Compile Task through VM
task.precompile();
// Call Task (similar to TaskManager.do)
task.do(8, function(error, result) {
    // arg[0] * gx = 8 * 2 = 16
    console.log(result);
    // Output: 16
});
```

**Calling another task** within a task.
```javascript
...
// Source from network I/O etc.
var sourceF1 = "module.exports = function (a, b, callback) { callback(null, a*b); }";
var sourceF2 = "module.exports = function (a, b, callback) { this.call('multiply', a, b, callback); }";

TaskManager.addForeign('multiply', sourceF1);
var task = TaskManager.addForeign('Caller', source);
// Call Task (similar to TaskManager.do)
task.do(3, 7, function(error, result) {
    // 3 * 7
    console.log(result);
    // Output: 21
});
```

## What's the difference between a Task and a Function?
Functions can't be shared within Clusters or networks in JS unlike many other types that can be trasferred in form of JSON. That's because of **globals** and **closures**. If we could ignore closures and instead stick to globals we can pass the source of these functions across a network and re-compile then through the VM Core Module provided with NodeJS from source. In fact `require` itself uses VM to process modules. *Moreover Functions can be converted to Tasks but without [closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures). Although you can provide global variable access through Task#globals which can be useful at times.*

\**Above is an excerpt from `Understanding Tasks`* You can read the [entire guide here.](./documentation/Understanding_Tasks.md)

## API & Documentation
[Read more about tasks here.](./documentation/Understanding_Tasks.md)

[API documentation is available here.](./documentation/api.md)

## License
MIT © Schahriar SaffarShargh <info@schahriar.com>
