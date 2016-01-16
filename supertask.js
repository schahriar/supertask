"use strict";

/// Required Core Modules
var vm = require('vm');
var eventEmmiter = require('events').EventEmitter;
///
/// External Modules
var Deque = require('double-ended-queue');
var defaultsDeep = require('lodash.defaultsdeep');
///
/// Internal Modules
var ContextPermissions = require('./lib/ContextPermissions');
var TaskObject = require('./lib/TaskObject');
///
/// Predefined Types
// TYPES
var ST_LOCAL_TYPE = 0, ST_SHARED_TYPE = 1, ST_FOREIGN_TYPE = 2;
// PERMISSIONS
var ST_NONE = 0, ST_RESTRICTED = 1, ST_MINIMAL = 2, ST_UNRESTRICTED = 3;
///
// No Operation function
function noop() { return null; }

class SuperTask extends eventEmmiter {
    /**
     * Creates new instance.
     * @constructor
     * @example
     * var SuperTask = require('supertask');
     * var TaskManager = new SuperTask();
     * 
     * @returns {Instance} Returns a new instance of the module.
     */
    constructor(size) {
        // Call eventEmmiter constructor
        super();

        this._busy_ = false;
        this.map = new Map();
        this.queue = new Deque(parseInt(size, 10) || 10000);
        this.concurrency = 1000;

        eventEmmiter.call(this);
    }

    _next() {
        // Allow _next_ to be called
        this._busy_ = false;
        
        /* At this point the source is fully compiled
        /* to a function or a function is resupplied
        /* from cache to be executed. Here we transfer
        /* the given function (task.func) to the queue
        /* after attaching the pre tracker */
        
        // Do a batch
        for (var i = 0; i < Math.min(this.queue.length, this.concurrency); i++) {
            // Get a job
            var job = this.queue.shift();

            // Assign lastStarted
            job.task.lastStarted = process.hrtime();
            // Push Callback to args
            job.args.push(job.callback);
            // If task is shared call handler
            if (job.task.shared && job.task.handler) {
                // Assign task name to argument[0] followed by context
                job.args.unshift(job.context);
                job.args.unshift(job.name);
                job.handler.apply(null, job.args);
            } else {
                // Call local/remote Function with context & args
                if (job.task.sandboxed) {
                    try {
                        job.task.func.apply(job.context, job.args);
                    } catch (error) {
                        job.callback(error);
                    }
                } else {
                    job.task.func.apply(job.context, job.args);
                }
            }
        }
        
        // Keep executing until Queue is empty
        if (this.queue.length > 0) {
            // Do after I/O & Tasks are cleared
            setImmediate(() => { this._next(); });
        }
    }

    _push(job) {
        // Push Job to Queue
        this.queue.push(job);
        // Batch Queue items into one call
        if (!this._busy_) {
            this._busy_ = true;
            setImmediate(() => {
                this._next();
            });
        }
    }

    _addTask(name, func, handler, type) {
        // Make sure Map Key is not taken
        if (this.map.has(name)) {
            throw new Error('Enable to create new task. A Task with the given name already exists.');
        }
        
        // Add ST_DO function to the back with current context
        // & Create task
        var task = TaskObject.create(this, name, func, handler, type);
        // Add Task's model to Map
        this.map.set(name, task.model);

        return task;
    }

    _compile(task, context) {
        // Check if script is not compiled
        if (typeof task.func === 'string') {
            // Compile script using VM
            task.func = new vm.Script(task.func);
        }
        // Make sure we can call run on the compiled script
        if (typeof task.func.runInContext !== 'function') {
            throw new Error("Unknown Error Occurred. Function property of Task is invalid or failed to compile.");
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
                throw new Error("Compiled Script is not a valid foreign task or module. Failed to identify module.exports as a function.");
            }
        } else {
            return task.func;
        }
    }
    
    /**
    * Creates a new local Task. A local task is a task that is not
    * shared by any outside entity and usually performs slightly
    * faster than shared or foreign tasks as there is no compilation
    * or try/catch involved. 
    * 
    * @param {String} name - A unique name for this Task.
    * @param {Function} taskFunction - The JS function of the Task.
    */
    addLocal(name, func) {
        return this._addTask(name, func, null, ST_LOCAL_TYPE);
    }
    
    /**
     * Creates a new foreign Task. A local task is a task that is not
     * shared by any outside entity and usually performs slightly
     * faster than shared or foreign tasks as there is no compilation
     * or try/catch involved. 
     * 
     * @param {String} name - A unique name for this Task.
     * @param {Function} taskFunction - The JS function or source with
     * module.exports to be used as the function. Note that sources are compiled
     * to a function before use with about a 30ms overhead on the first call unless
     * precompile method of task is called beforehand.
     */
    addForeign(name, source) {
        // VM requires a String source to compile
        // If given source is a function convert it to source (context is lost)
        if (typeof source === 'function') {
            source = 'module.exports = ' + source.toString();
        }
        return this._addTask(name, source, null, ST_FOREIGN_TYPE);
    }
    
    /**
     * Run a task with the given arguments
     * 
     * @param {...*} arguments - Arguments that are passed to the Task.
     * You can call this function with any number of arguments so long
     * as the last argument is the callback.
     * @param {Function} callback - The callback that handles the response.
     * Note that the callback parameters are based on what the function calls
     * the callback with but will include `error` as the first parameter as
     * per usual NodeJS async calls.
     */
    do() {
        var args = Array.prototype.slice.call(arguments);
        var name = args.shift();
        var callback = (typeof args[args.length - 1] === 'function') ? args.pop() : null;
        // Check for callback
        if (typeof callback !== 'function') {
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
            context = ContextPermissions(context || {}, task.access);
        }
        
        // Sanitize args
        args = (Array.isArray(args)) ? args : [];

        // Compile task if it is in source form
        if (typeof task.func !== 'function') {
            try {
                var result = this._compile(task, context);
                if (typeof result === 'function') task.func = result;
                else if (result === true) return callback();
                else if (typeof result === 'object') return callback(result);
                else return callback(new Error("Unknown error occurred. Failed to compile and execution was halted."));
            } catch (e) {
                callback(e);
            }
        }
        // Push to Queue
        this._push({
            name: name,
            context: context,
            args: args,
            task: task,
            callback: callback
        });
    }
    
    /**
     * Remove a task.
     * 
     * @param {String} name - Name of the task.
     * @returns {Boolean} - Returns true if task
     * existed and was removed or false if task did not exist
     */
    remove(name) {
        return this.map.delete(name);
    }

    /**
     * Check if task exists.
     * 
     * @param {String} name - Name of the task.
     * @returns {Boolean} exists
     */
    has(name) {
        return !!this.map.has(name);
    }

    /**
     * Get a wrapped version of the task.
     * 
     * @param {String} name - Name of the task.
     * @returns {Object} task  
     */
    get(name) {
        if (!this.has(name)) return null;
        return TaskObject.wrap(this, this.map.get(name));
    }
}

/// EXTEND PREDEFINED VARS
SuperTask.ST_LOCAL_TYPE = ST_LOCAL_TYPE;
SuperTask.ST_SHARED_TYPE = ST_SHARED_TYPE;
SuperTask.ST_FOREIGN_TYPE = ST_FOREIGN_TYPE;

/** No permissions. Code runs JS only. */
SuperTask.ST_NONE = ST_NONE;
/** Some permissions. Allows streams, Buffer, setTimeout, setInterval only */
SuperTask.ST_RESTRICTED = ST_RESTRICTED;
/** Minimal permissions. Allows all restricted permissions and __dirname, __filename, console globals.
 * Includes a limited require('*') function with access to 'http', 'https', 'util', 'os', 'path', 'events', 'stream', 'string_decoder', 'url', 'zlib'
 */
SuperTask.ST_MINIMAL = ST_MINIMAL;
/** UNSAFE, All permissions. Copies global scope. */
SuperTask.ST_UNRESTRICTED = ST_UNRESTRICTED;

module.exports = SuperTask;