/// Required Core Modules
var vm = require('vm');
var eventEmmiter = require('events').EventEmitter;
var util = require('util');
///
/// External Modules
var async = require('async');
var defaultsDeep = require('lodash.defaultsdeep');
///
/// Internal Modules
var ContextPermissions = require('./lib/ContextPermissions');
var Optimizer = require('./lib/Optimizations');
var TaskModel = require('./lib/TaskModel');
///
/// Predefined Types
// TYPES
var ST_LOCAL_TYPE = 0, ST_SHARED_TYPE = 1, ST_FOREIGN_TYPE = 2;
// PERMISSIONS
var ST_NONE = 0, ST_RESTRICTED = 1, ST_MINIMAL = 2, ST_UNRESTRICTED = 3;
///
// No Operation function
function noop() { return null; }

var SuperTask = function ST_INIT(strict) {
    this.cargo = async.cargo(this._next.bind(this._timeout), 1000);
    this._batch = [];
    this._paused = true;
    this._busy = false;
    this._timeout = 1000;
    this.map = new Map();
    this.strict = (!!strict);
    
    eventEmmiter.call(this);
};

util.inherits(SuperTask, eventEmmiter);

SuperTask.prototype._createTask = TaskModel.create;
SuperTask.prototype._wrapTask = TaskModel.wrap;

SuperTask.prototype._extendContextFromPermissions = ContextPermissions;

SuperTask.prototype._next = function ST__CARGO_NEXT(tasks, callback) {
    var timeout_duration = this;
    /* At this point the source is fully compiled
    /* to a function or a function is resupplied
    /* from cache to be executed. Here we transfer
    /* the given function (task.func) to the cargo
    /* after attaching the pre tracker */

    // Optimize Tasks
    tasks = Optimizer.optimize(tasks);
    
    // Go through tasks in parallel
    async.each(tasks, function ST__CARGO_EACH(task, done) {
        /* A timeout indicator is introduced here
           if a task runs past a certain time it can
           clog the cargo by filling up the maximum
           number of parallel tasks and thus requires
           a reasonably short timeout to proceed and
           assume that the task has completed. Note that
           this does not call the task callback function
           which may never be called if the task somehow
           fails without an error. 
        */
        // Timedout indicator
        var ST__CARGO_TIMEDOUT = false;
        // Timeout holder
        var ST__CARGO_TIME;
        // Timeout Tracker
        function ST__CARGO_COMPLETE(isComplete) {
            // Timedout previously, we won't call done twice
            if (ST__CARGO_TIMEDOUT) return;
            // Timeout
            if (!isComplete) ST__CARGO_TIMEDOUT = true;
            // Clear previous timeout
            clearTimeout(ST__CARGO_TIME);
            // Indicate that the queue is free to proceed
            done();
        }
        // Set timeout to this._timeout or 1 second
        ST__CARGO_TIME = setTimeout(ST__CARGO_COMPLETE, timeout_duration || 1000);
        // Cargo Tracker
        function ST__CARGO_TRACKER(error) {
            ST__CARGO_COMPLETE(true);
            task.callback.apply(this, arguments);
        }
        // Call preTracker
        task.pre();
        // Push Callback to args
        task.args.push(ST__CARGO_TRACKER);
        // If task is shared call handler
        if (task.shared && task.handler) {
            // Assign task name to argument[0] followed by context
            task.args.unshift(task.context);
            task.args.unshift(task.name);
            task.handler.apply(null, task.args);
        }else{
            // Call local/remote Function with context & args
            if (task.sandboxed) {
                try {
                    task.func.apply(task.context, task.args);
                } catch (error) {
                    ST__CARGO_TRACKER(error);
                }
            } else {
                task.func.apply(task.context, task.args);
            }
        }
    }, callback);
};

SuperTask.prototype._newCargo = function ST__CARGO_ADD(CargoTask) {
    // Push to Cargo & Resume if paused
    this.cargo.push(CargoTask);
    this.cargo.resume();
};

SuperTask.prototype._addTask = function ST__ADD_TASK(name, func, handler, type, callback) {
    if (typeof callback !== 'function') callback = noop;
    
    // Make sure Map Key is not taken
    if (this.map.has(name)) {
        return callback(new Error('Enable to create new task. A Task with the given name already exists.'));
    }
    
    // Add ST_DO function to the back with current context
    // & Create task
    var task = this._createTask(this, name, func, handler, type);
    // Add Task's model to Map
    this.map.set(name, task.model);

    callback(null, task);
};

SuperTask.prototype._compile = function ST__VM_COMPILE(task, context) {
    // Check if script is not compiled
    if (typeof task.func === 'string') {
        // Compile script using VM
        task.func = new vm.Script(task.func);
    }
    // Make sure we can call run on the compiled script
    if (typeof task.func.runInContext !== 'function') {
        return new Error("Unknown Error Occurred. Function property of Task is invalid or failed to compile.");
    }
    // Define module.exports and exports in context
    if (!context) context = {};
    context.module = {};
    context.exports = context.module.exports = {};
    
    // Create VM Context from context object
    vm.createContext(context);
    // Run Compiled Script
    task.func.runInContext(context);

    if (task.isModule) {
        // Make sure module.exports is set to a function
        // after script is run. Similar to how require(...)
        // modules work.
        if (typeof context.module.exports === 'function') {
            // Cache and Call the function
            task.func = context.module.exports;
            // Set isCompiled property to prevent recompilation
            task.isCompiled = true;

            return task.func;
        } else {
            return new Error("Compiled Script is not a valid foreign task or module. Failed to identify module.exports as a function.");
        }
    } else {
        return task.func;
    }
};

SuperTask.prototype.timeout = function ST_GETSET_TIMEOUT(duration) {
    if (duration) this._timeout = duration;
    else return this._timeout;
};

SuperTask.prototype.addLocal = function ST_ADD_LOCAL(name, func, callback) {
    return this._addTask(name, func, null, ST_LOCAL_TYPE, callback);
};
SuperTask.prototype.addShared = function ST_ADD_SHARED(name, source, handler, callback) {
    // VM requires a String source to compile
    // If given source is a function convert it to source (context is lost)
    if (typeof source === 'function') {
        source = 'module.exports = ' + source.toString();
    }
    return this._addTask(name, source, handler, ST_SHARED_TYPE, callback);
};

SuperTask.prototype.addForeign = function ST_ADD_FOREIGN(name, source, callback) {
    // VM requires a String source to compile
    // If given source is a function convert it to source (context is lost)
    if (typeof source === 'function') {
        source = 'module.exports = ' + source.toString();
    }
    return this._addTask(name, source, null, ST_FOREIGN_TYPE, callback);
};

SuperTask.prototype.addRemote = function ST_ADD_REMOTE(name, handler, callback) {
    this._addTask(name, handler, null, ST_FOREIGN_TYPE, function ST_REMOTE_CREATOR(error, task) {
        if(error) return callback(error);
        // Attach handler
        task.remote(true, handler);
        
        callback(error, task);
    });
};

SuperTask.prototype.do = function ST_DO() {
    var args = Array.prototype.slice.call(arguments);
    var name = args.shift();
    var callback = (typeof args[args.length - 1] === 'function') ? args.pop() : null;
    // Check for callback
    // Note that we only throw if strict is set to true
    if ((typeof callback !== 'function') && (this.strict === true)) throw new Error("A callback is required to execute a task. Pass a noop function if errors are intended to be ignored.");
    else if (typeof callback !== 'function') {
        callback = noop;
    }
    
    // Check for mapped task
    if (!this.map.has(name)) {
        callback(new Error('Task not found!'));
        return;
    }

    var task = this.map.get(name);
    // Set Context to task's default
    var context = task.defaultContext;
    // Combine Permissions Context (SLOWS DOWN EXECUTION)
    if ((task.access) && (task.access !== ST_NONE)) {
        context = this._extendContextFromPermissions(context || {}, task.access);
    }
    // Function executed on cargo execution
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

        callback.apply(task, arguments);
    };
    // Sanitize args
    args = (Array.isArray(args)) ? args : [];
    
    // Create a Cargo-able Clone of Task
    var CargoTask = {};
    CargoTask.name = name;
    CargoTask.func = task.func;
    CargoTask.handler = task.handler;
    CargoTask.sandboxed = task.sandboxed;
    CargoTask.averageExecutionTime = task.averageExecutionTime;
    CargoTask.executionRounds = task.executionRounds;
    CargoTask.local = task.local;
    CargoTask.shared = task.shared;
    CargoTask.context = context;
    CargoTask.args = args;
    CargoTask.pre = preTracker;
    CargoTask.callback = postTracker;
    //

    // Compile task if it is in source form
    if (typeof task.func !== 'function') {
        var result = this._compile(task, context);
        if (typeof result === 'function') CargoTask.func = result;
        else if (result === true) return callback();
        else if (typeof result === 'object') return callback(result);
        else return callback(new Error("Unknown error occurred. Failed to compile and execution was halted."));
    }
    // Push to Cargo
    this._newCargo(CargoTask);
};

SuperTask.prototype.remove = function ST_REMOVE(name, callback) {
    var result = this.map.delete(name);
    return ((!result) ? (new Error('Task not found!')) : null);
};

SuperTask.prototype.has = function ST_HAS(name, callback) {
    return !!this.map.has(name);
};

SuperTask.prototype.get = function ST_GET(name, callback) {
    return this._wrapTask(this, this.map.get(name));
};

/// EXTEND PREDEFINED VARS
SuperTask.ST_LOCAL_TYPE = ST_LOCAL_TYPE;
SuperTask.ST_SHARED_TYPE = ST_SHARED_TYPE;
SuperTask.ST_FOREIGN_TYPE = ST_FOREIGN_TYPE;

SuperTask.ST_NONE = ST_NONE;
SuperTask.ST_RESTRICTED = ST_RESTRICTED;
SuperTask.ST_MINIMAL = ST_MINIMAL;
SuperTask.ST_UNRESTRICTED = ST_UNRESTRICTED;

// Extend Flags
for (var fkey in Optimizer.flags) {
    if (!SuperTask[fkey]) SuperTask[fkey] = Optimizer.flags[fkey];
}
// Extend Levels
for (var lkey in Optimizer.levels) {
    if (!SuperTask[lkey]) SuperTask[lkey] = Optimizer.levels[lkey];
}
///

module.exports = SuperTask;