# Understanding Tasks
As of version `2.1.x` there are 3 types of base tasks named *local*, *foreign* and *remote* tasks.

- **Local tasks** are introduced on a local machine and kept there. They have access to global scope and closures and act as a normal function would do.
- **Foreign tasks** on the other hand are introduced from source (whether over a network or within a script) and are compiled with the **VM** to functions. They do not support closures outside their own scope and can have limited or unlimited sandboxed globals (such as limited `require` or access to `console`).
- **Remote tasks** are defined outside the local machine and require a *handler* function to accompany them on creation. This *handler* function is called whenever the task is called to be executed to run a task on another remote location and return the results through the callback.

----

## Why Tasks?
Tasks can be easily parallelized. They are converted to source and compiled at their target destination with their provided globals (sometimes referred to as **permissions** in SuperTask) and can be called with a certain set of arguments and a context. **But most importantly** tasks have the ability to recurse and call other tasks (remote, foreign or local) from within the context. We'll get to this ability of tasks in a bit.


### Are Tasks functions?
All tasks can be converted to functions but not all functions can be directly converted to tasks. This is where tasks differ from functions and that is their inability to access the scope they were created in.


### What's the difference between a Task and a Function?
Functions can't be shared within Clusters or networks in JS unlike many other types that can be trasferred in form of JSON. That's because of **globals** and **closures**. If we could ignore closures and instead stick to globals we can pass the source of these functions across a network and re-compile then through the VM Core Module provided with NodeJS from source. In fact `require` itself uses VM to process modules. *Moreover Functions can be converted to Tasks but without [closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures). Although you can provide global variable access through Task#globals which can be useful at times.*

-----

## Tasks in a parallel world
SuperTask's definition of tasks adds a unique set of abilities to enable high-performance usage of tasks in a distributed or parallel environment. All tasks have a set of reserved properties in their context (`this`) that will enable recursion, deep asynchronous calls and self awareness.

 Currently reserved properties are:
 
 `recurse`(...arguments `{...*}`, callback `{Function}`) - A function that enables calls to the same function with arguments and a callback.
```javascript
// Takes a value and multiplies it by 2 for (n) number of rounds
module.exports = function(value, n, callback) {
    // If we are done call the callback with results
    if (n > 5) return callback(null, value);
    value = value * 2;
    this.recurse(value, ++n, callback);
};
 ```
 
 `call`(taskName `{String}`, ...arguments `{...*}`, callback `{Function}`) - A function that allows calls to any other task with any number of arguments.
```javascript
// Powers a value by 2 and adds 5
// Note that task 'pow2' should be defined somewhere
module.exports = function(value, callback) {
    this.call('pow2', value, function(error, result) {
        result = result + 5;
        callback(error, result);
    });
};
 ```
 
 `apply`(taskName `{String}`, context `{Object}`, args `{Array}`, callback `{Function}`) - A function that applies (similar to Function#apply) to a task with the given name. Note that you won't be able to override reserved properties in context.
```javascript
// Assume 'echo' Echoes back the context
// Note that task 'echo' should be defined somewhere
module.exports = function(callback) {
    this.apply('echo', { test: 'yes' }, [], function(error, result) {
        callback(error, result);
    });
};
 ```
 
 `self` `{Object}` - An object with a few properties of the mapped task.
```javascript
module.exports = function(callback) {
    console.log(this.self);
    // Output:
    // {
    //  executionRounds: ...,
    //  averageExecutionTime: ...,
    //  name: ...,
    //  lastStarted: ...,
    //  lastFinished: ...,
    //  lastDiff: ...
    // }
};
 ```
 
 You can mix any of these properties to create a complex structure of task calls within a task.
 
 ----
 
## How can I Cluster/Parallelize/Distribute these tasks?
 You should remember that `SuperTask` is a base module. It provides the concept and implementation of tasks with a super fast queue, recurssion, deep calls, etc. communication, creation and management part of the process is left to be developed on top of this module. That being said the building blocks that are shipped with this module should be enough to get you started.
 
# Footnotes
 - `*Tasks shouldn't throw (unless sandboxed): ` Tasks can be executed in different environments and under different permissions (or may be introduced from outside sources). A good practice is to pass your error directly to the callback but if that isn't possible make sure that your task is created as sandboxed (Foreign tasks are automatically sandboxed) that way you may throw and your error will be caught within a try/catch block.
 - `Tasks are asynchronous. You can't return values: ` Return values of all tasks is **ignored**. Your tasks may be synchronous but be tasks are designed to be fully async and therefore return values are not considered to be final results. Be sure to call the last argument in `arguments` as your `callback` with `error` as the first parameter followed by any number of parameters.
