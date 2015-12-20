/// Required Core Modules
var vm = require('vm');
///
/// Predefined Types
var ST_LOCAL_TYPE = 0, ST_SHARED_TYPE = 1, ST_FOREIGN_TYPE = 2;
///

var SuperTask = function ST_INIT() {
    this.queue = [];
    this._batch = [];
    this._paused = true;
    this.map = new Map();
};

SuperTask.prototype._createTask = function ST__CREATE_TASK(func, type, isModule, remote, sandboxed) {
    return {
        func: func,
        local: (type === ST_LOCAL_TYPE),
        shared: (type === ST_SHARED_TYPE),
        sandboxed: ((!!sandboxed) || (type === ST_FOREIGN_TYPE)),
        module: (isModule === false) ? false : true,
        isCompiled: (typeof func === 'function'),
        isRemote: (!!remote),
        lastStarted: [],
        lastFinished: [],
        lastDiff: 0,
        averageExecutionTime: -1,
        executionRounds: 0
    };
};

SuperTask.prototype._next = function ST__QUEUE_NEXT() {
    if (this._paused) return false;
    var _this = this, i = 0;
    for (i = 0; i < this.queue.length; i++) {
        this._batch.push(this.queue.shift());
    }
    /* Feature: Detect Stack Like Overflows to prevent unwanted recursion */
    // Non-blocking execution that allows for automatic batching
    setImmediate(function(){
        // Execute all in parallel
        for (i = 0; i < _this._batch.length; i++) {
            (_this._batch.shift())();
        }
        // Set Paused
        _this._pause();
    });
};

SuperTask.prototype._pause = function ST__QUEUE_PAUSE() { this._paused = true; };
SuperTask.prototype._unpause = function ST__QUEUE_UNPAUSE() { this._paused = false; this._next(); };

SuperTask.prototype._add = function ST__QUEUE_ADD(name, func, context, args) {
    // Push Function to Queue
    this.queue.push(function ST_QUEUE_EXECUTOR() {
        func.apply(context, args);
    });
    // Unpause Queue
    this._unpause();
};

SuperTask.prototype.addLocal = function ST_ADD_LOCAL(name, func, callback) {
    if (this.map.has(name)) {
        if (typeof callback === 'function') callback(new Error('Enable to create new task. A Task with the given name already exists.'));
        return;
    }
    var task = this._createTask(func, ST_LOCAL_TYPE);
    // Add Task to Map
    this.map.set(name, task);

    if (typeof callback === 'function') callback(null, task);
};

SuperTask.prototype.addForeign = function ST_ADD_FOREIGN(name, source, callback) {
    if (this.map.has(name)) {
        if (typeof callback === 'function') callback(new Error('Enable to create new task. A Task with the given name already exists.'));
        return;
    }
    // VM requires a String source to compile
    // If given source is a function convert it to source (context is lost)
    if (typeof source === 'function') {
        source = 'module.exports = ' + source.toString();
    }

    var task = this._createTask(source, ST_FOREIGN_TYPE, true);
    // Add Task to Map
    this.map.set(name, task);

    if (typeof callback === 'function') callback(null, task);
};

SuperTask.prototype.do = function ST_DO(name, context, args, callback) {
    if (!this.map.has(name)) {
        if (typeof callback === 'function') callback(new Error('Task not found!'));
        return;
    }
    var task = this.map.get(name);
    task.lastStarted = process.hrtime();
    // Sanitize args
    args = (Array.isArray(args)) ? args : [];
    // Push Callback & Tracker to args;
    args.push(function ST_DO_TRACKER(error) {
        // Calculate High Resolution time it took to run the function
        task.lastFinished = process.hrtime(task.lastStarted);
        // Calculate Time Difference
        task.lastDiff = task.lastFinished[0] * 1e9 + task.lastFinished[1];
        // Calculate Average Execution Time
        if (task.averageExecutionTime === -1) {
            task.averageExecutionTime = task.lastDiff;
        } else {
            task.averageExecutionTime = ((task.averageExecutionTime * task.executionRounds) + task.lastDiff) / (task.executionRounds + 1);
        }
        // Bump execution rounds
        task.executionRounds++;
        // Call Callback function if provided
        if (typeof callback === 'function') callback.apply(task, arguments);
    });

    if (typeof task.func !== 'function') {
        // Check if script is not compiled
        if (typeof task.func === 'string') {
            // Compile script using VM
            task.func = new vm.Script(task.func);
        }
        // Make sure we can call run on the compiled script
        if (typeof task.func.runInContext !== 'function') {
            if (typeof callback === 'function') callback(new Error("Unknown Error Occurred. Function property of Task is invalid or failed to compile."));
            return;
        }
        // Define module.exports and exports in context
        context.module = {};
        context.exports = context.module.exports = {};
        
        // Create VM Context from context object
        vm.createContext(context);
        // Run Compiled Script
        task.func.runInContext(context);
        // If task is defined as module
        if (task.module) {
            // Make sure module.exports is set to a function
            if (typeof context.module.exports === 'function') {
                // Cache and Call the function
                task.func = context.module.exports;
                // Set isCompiled property
                task.isCompiled = true;
                // Push to Queue
                this._add(name, task.func, context, args);
            } else {
                // Call Callback with an error if module.exports is not set to a function
                if (typeof callback === 'function') callback(new Error("Compiled Script is not a valid foreign task or module. Failed to identify module.exports as a function."));
            }
        }
    } else {
        // Push to Queue
        this._add(name, task.func, context, args);
    }
};

SuperTask.prototype.remove = function ST_REMOVE(name, callback) {
    var result = this.map.delete(name);
    if (typeof callback === 'function') callback((!result) ? (new Error('Task not found!')) : null);
};

SuperTask.prototype.has = function ST_HAS(name, callback) {
    if (typeof callback === 'function') callback(null, (!!this.map.has(name)));
};

/// EXTEND TYPES
SuperTask.ST_LOCAL_TYPE = ST_LOCAL_TYPE;
SuperTask.ST_SHARED_TYPE = ST_SHARED_TYPE;
SuperTask.ST_FOREIGN_TYPE = ST_FOREIGN_TYPE;
///

module.exports = SuperTask;