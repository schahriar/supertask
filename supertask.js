/// Required Core Modules
var vm = require('vm');
///
/// External Modules
var async = require('async');
var defaultsDeep = require('lodash.defaultsdeep');
///
/// Internal Modules
var ContextPermissions = require('./lib/ContextPermissions');
var Optimizer = require('./lib/Optimizations');
///
/// Predefined Types
// TYPES
var ST_LOCAL_TYPE = 0, ST_SHARED_TYPE = 1, ST_FOREIGN_TYPE = 2;
// PERMISSIONS
var ST_NONE = 0, ST_RESTRICTED = 1, ST_MINIMAL = 2, ST_UNRESTRICTED = 3;
///

var SuperTask = function ST_INIT() {
    this.cargo = async.cargo(this._next, 50);
    this._batch = [];
    this._paused = true;
    this._busy = false;
    this.map = new Map();
};

SuperTask.prototype._createTask = function ST__CREATE_TASK(func, type, access, priority, context, isModule, remote, sandboxed) {
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
        priority: (priority)?Math.abs(priority):-1,
        defaultContext: context || {},
        access: access || ST_NONE
    };
};

SuperTask.prototype._extendContextFromPermissions = ContextPermissions;

SuperTask.prototype._next = function ST__CARGO_NEXT(tasks, callback) {
    /* At this point the source is fully compiled
    /* to a function or a function is resupplied
    /* from cache to be executed. Here we transfer
    /* the given function (task.func) to the cargo
    /* after attaching the pre tracker */
    
    // Optimize Tasks
    tasks = Optimizer.optimize(tasks);
    
    // Go through tasks in parallel
    async.each(tasks, function ST__CARGO_EACH(task, done) {
        // Cargo Tracker
        function ST__CARGO_TRACKER(error) {
            done();
            task.callback.apply(this, arguments);
        }
        // Call preTracker
        task.pre();
        // Push Callback to args
        task.args.push(ST__CARGO_TRACKER);
        // Call Function with context & args
        if(task.sandboxed) {
            try {
                task.func.apply(task.context, task.args);
            }catch(error) {
                ST__CARGO_TRACKER(error);
            }
        }else{
            task.func.apply(task.context, task.args);
        }
        
    }, callback);
};

SuperTask.prototype._newCargo = function ST__CARGO_ADD(CargoTask) {
    // Push Cargo Object & Attach postTracker
    this.cargo.push(CargoTask);
    // Resume Cargo
    this.cargo.resume();
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

SuperTask.prototype.addLocalAdvanced = function ST_ADD_LOCAL_ADVANCED(name, func, context, priority, permissions, callback) {
    this._addTask(name, func, ST_LOCAL_TYPE, permissions, priority, context, callback);
};

SuperTask.prototype.addForeign = function ST_ADD_FOREIGN(name, source, callback) {
    // VM requires a String source to compile
    // If given source is a function convert it to source (context is lost)
    if (typeof source === 'function') {
        source = 'module.exports = ' + source.toString();
    }
    this._addTask(name, source, ST_FOREIGN_TYPE, callback);
};

SuperTask.prototype.addForeignAdvanced = function ST_ADD_FOREIGN_ADVANCED(name, source, context, priority, permissions, callback) {
    // VM requires a String source to compile
    // If given source is a function convert it to source (context is lost)
    if (typeof source === 'function') {
        source = 'module.exports = ' + source.toString();
    }
    this._addTask(name, source, ST_FOREIGN_TYPE, permissions, priority, context, callback);
};

SuperTask.prototype.do = function ST_DO(name, context, args, callback) {
    if (!this.map.has(name)) {
        if (typeof callback === 'function') callback(new Error('Task not found!'));
        return;
    }
    var task = this.map.get(name);
    // Combine Contexts
    if (task.defaultContext && (Object.keys(task.defaultContext).length !== 0)) context = defaultsDeep(task.defaultContext, context || {});
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
        // Call Callback function if provided
        if (typeof callback === 'function') callback.apply(task, arguments);
    };
    // Sanitize args
    args = (Array.isArray(args)) ? args : [];
    
    // Create a Cargo-able Clone of Task
    var CargoTask = {};
    CargoTask.name = name;
    CargoTask.func = task.func;
    CargoTask.sandboxed = task.sandboxed;
    CargoTask.averageExecutionTime = task.averageExecutionTime;
    CargoTask.executionRounds = task.executionRounds;
    CargoTask.local = task.local;
    CargoTask.context = context;
    CargoTask.args = args;
    CargoTask.pre = preTracker;
    CargoTask.callback = postTracker;
    //

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
                // Set Task Compile Function to CargoTask
                CargoTask.func = task.func;
                // Push to Cargo
                this._newCargo(CargoTask);
            } else {
                // Call Callback with an error if module.exports is not set to a function
                if (typeof callback === 'function') callback(new Error("Compiled Script is not a valid foreign task or module. Failed to identify module.exports as a function."));
            }
        }
    } else {
        // Push to Cargo
        this._newCargo(CargoTask);
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

// Extend Flags
for(var key in Optimizer.flags) {
    if(!SuperTask[key]) SuperTask[key] = Optimizer.flags[key];
}
// Extend Levels
for(var key in Optimizer.levels) {
    if(!SuperTask[key]) SuperTask[key] = Optimizer.levels[key];
}
///

module.exports = SuperTask;