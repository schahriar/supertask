# supertask
[![Build Status](https://travis-ci.org/schahriar/supertask.svg?branch=master)](https://travis-ci.org/schahriar/supertask)
[![Test Coverage](https://codeclimate.com/github/schahriar/supertask/badges/coverage.svg)](https://codeclimate.com/github/schahriar/supertask/coverage)

## Supertask is a NodeJS task queue designed for parallel and cluster execution with optimizations.

**Supertask** was designed to run tasks in parallel and enable for a connected interface to distribute tasks across a network or cluster. A task can either be a local JavaScript function or in form of source which is then compiled and sandboxed through the VM.

**This is a base module used for creating and executing tasks. If you want to try parallelization features that this module enables you should checkout [Supertask-cluster](https://github.com/schahriar/supertask-cluster) a superset of this module that automatically runs and handles tasks on a NodeJS cluster of Workers.**

# Installation
Note that Supertask requires *ES6* and is designed to run on NodeJS 4.x and above.
```javascript
npm install supertask
```

# Understanding Tasks
## What is a Task?
A Task is the product of any NodeJS async script file that performs and action and exports a function through `module.exports` that function is then cached and used as the Task itself. Tasks can be called with arguments and return parameters through callbacks but most importantly Tasks can be parallelized through a certain number of additional features. We'll get to these in a bit.
## What's the difference between a Task and a Function?
Functions can't be shared within Clusters or networks in JS unlike many other types that can be trasferred in form of JSON. That's because of **context** and **closures**. If we could ignore closures and instead stick to contexts we can pass the source of these functions across a network and re-compile then through the VM Core Module provided with NodeJS from source. In fact `require` itself uses VM to process modules. *Moreover Functions can be converted to Tasks but without [closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures). Although you can provide global variable access through Task#context which can be useful at times.*
## Types of Tasks
SuperTask provides 4 different types of tasks. **Local**, **Shared**, **Foreign** and soon **Remote**. **Local** tasks are merely functions but use the internal SuperTask Queue and its optimizations. **Shared** tasks are true Tasks that accept a handler function to call them within whatever shared context is implemented (e.g. [Cluster](https://www.npmjs.com/package/supertask-cluster), Network). **Foreign** tasks are tasks that are introduced from an outside source (again Cluster/Network). **Foreign/Shared tasks can be sandboxed** but this doesn't mean you can run unsafe code within them.

## What does this module do?
SuperTask introduces the concept of these Parallelized tasks. It implementes a **Queue** with concurrency handling and **Tracking** features such as timeouts and performance measurements that work with an **Optimization** sorting algorithm that can be customized to prioritize tasks based on certain factors such as Average Execution Time or a given priority number when they are called. **Note that SuperTask is a base module and only provides the concept and implementation of Tasks**, real parallelization of these tasks are built on top of this module. Check-out [SuperTask-Cluster](https://www.npmjs.com/package/supertask-cluster) for an implementation that utilizes all CPU cores (instead of single-threaded NodeJS) by distributing tasks across a Cluster of processes. 

# Usage
Create a new local task with a unique name. **Note that a unique name is required for every task.**
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
This module is not *yet* ready to be used in a production environment. While Supertask has reasonably good stability with over 40 tests it does not fully expose all methods and capabilities and may not function as intended. Furthermore there may be breaking API changes in the upcoming versions. This module follows [Semver](http://semver.org/) as much as possible but use it at your own risk.

## License
MIT © Schahriar SaffarShargh <info@schahriar.com>