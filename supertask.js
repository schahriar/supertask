/// Required Core Modules
var vm = require('vm');
///
/// Modules
var async = require('async');
var defaultsDeep = require('lodash.defaultsdeep');
///
/// Predefined Types
// TYPES
var ST_LOCAL_TYPE = 0, ST_SHARED_TYPE = 1, ST_FOREIGN_TYPE = 2;
// PERMISSIONS
var ST_NONE = 0, ST_RESTRICTED = 1, ST_MINIMAL = 2, ST_UNRESTRICTED = 3;
///

var SuperTask = function ST_INIT() {
    this.queue = async.queue(this._next, 50);
    this._batch = [];
    this._paused = true;
    this._busy = false;
    this.map = new Map();
};

SuperTask.prototype._createTask = function ST__CREATE_TASK(func, type, access, context, isModule, remote, sandboxed) {
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
        executionRounds: 0,
        defaultContext: context || {},
        access: access || ST_NONE
    };
};

SuperTask.prototype._extendContextFromPermissions = require('./lib/ContextPermissions');

SuperTask.prototype._next = function ST__QUEUE_NEXT(task, callback) {
    /* At this point the source is fully compiled
    /* to a function or a function is resupplied
    /* from cache to be executed. Here we transfer
    /* the given function (task.func) to the queue
    /* after attaching the pre tracker */
    
    // Call preTracker
    task.pre();
    // Push Callback to args
    task.args.push(callback);
    // Call Function with context & args
    task.func.apply(task.context, task.args);
};

SuperTask.prototype._add = function ST__QUEUE_ADD(name, func, context, args, preTracker, postTracker) {
    // Push Queue Object & Attach postTracker
    this.queue.push({
        name: name,
        pre: preTracker,
        func: func,
        context: context,
        args: args
    }, postTracker);
    // Resume Queue
    this.queue.resume();
};

SuperTask.prototype._addTask = function ST__ADD_TASK() {
    var args = Array.prototype.slice.call(arguments);
    var name = args.shift();
    var callback = args.pop();
    
    // Make sure Map Key is not taken
    if (this.map.has(name)) {
        if (typeof callback === 'function') callback(new Error('Enable to create new task. A Task with the given name already exists.'));
        return;
    }

    var task = this._createTask.apply(this, args);
    // Add Task to Map
    this.map.set(name, task);

    if (typeof callback === 'function') callback(null, task);
};

SuperTask.prototype.addLocal = function ST_ADD_LOCAL(name, func, callback) {
    this._addTask(name, func, ST_LOCAL_TYPE, callback);
};

SuperTask.prototype.addLocalWithContext = function ST_ADD_LOCAL_W_CONTEXT(name, func, context, permissions, callback) {
    this._addTask(name, func, ST_LOCAL_TYPE, permissions, context, callback);
};

SuperTask.prototype.addForeign = function ST_ADD_FOREIGN(name, source, callback) {
    // VM requires a String source to compile
    // If given source is a function convert it to source (context is lost)
    if (typeof source === 'function') {
        source = 'module.exports = ' + source.toString();
    }
    this._addTask(name, source, ST_FOREIGN_TYPE, callback);
};

SuperTask.prototype.addForeignWithContext = function ST_ADD_FOREIGN_W_CONTEXT(name, source, context, permissions, callback) {
    // VM requires a String source to compile
    // If given source is a function convert it to source (context is lost)
    if (typeof source === 'function') {
        source = 'module.exports = ' + source.toString();
    }
    this._addTask(name, source, ST_FOREIGN_TYPE, permissions, context, callback);
};

SuperTask.prototype.do = function ST_DO(name, context, args, callback, permissions) {
    if (!this.map.has(name)) {
        if (typeof callback === 'function') callback(new Error('Task not found!'));
        return;
    }
    var task = this.map.get(name);
    // Combine Contexts
    if (task.defaultContext && (Object.keys(task.defaultContext).length !== 0)) defaultsDeep(context, task.defaultContext);
    // Combine Permissions Context (SLOWS DOWN EXECUTION)
    if (task.access !== ST_NONE) {
        context = this._extendContextFromPermissions(context, permissions || task.access);
    }
    // Function executed on queue execution
    var preTracker = function ST_DO_PRETRACKER() {
        task.lastStarted = process.hrtime();
    };
    var postTracker = function ST_DO_POSTTRACKER(error) {
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
    };
    // Sanitize args
    args = (Array.isArray(args)) ? args : [];

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
                this._add(name, task.func, context, args, preTracker, postTracker);
            } else {
                // Call Callback with an error if module.exports is not set to a function
                if (typeof callback === 'function') callback(new Error("Compiled Script is not a valid foreign task or module. Failed to identify module.exports as a function."));
            }
        }
    } else {
        // Push to Queue
        this._add(name, task.func, context, args, preTracker, postTracker);
    }
};

SuperTask.prototype.remove = function ST_REMOVE(name, callback) {
    var result = this.map.delete(name);
    if (typeof callback === 'function') callback((!result) ? (new Error('Task not found!')) : null);
};

SuperTask.prototype.has = function ST_HAS(name, callback) {
    if (typeof callback === 'function') callback(null, (!!this.map.has(name)));
};

/// EXTEND PREDEFINED VARS
SuperTask.ST_LOCAL_TYPE = ST_LOCAL_TYPE;
SuperTask.ST_SHARED_TYPE = ST_SHARED_TYPE;
SuperTask.ST_FOREIGN_TYPE = ST_FOREIGN_TYPE;

SuperTask.ST_NONE = ST_NONE;
SuperTask.ST_RESTRICTED = ST_RESTRICTED;
SuperTask.ST_MINIMAL = ST_MINIMAL;
SuperTask.ST_UNRESTRICTED = ST_UNRESTRICTED;
///

module.exports = SuperTask;