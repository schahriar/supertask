"use strict";

/// Required Core Modules

///
/// External Modules
const Deque = require('double-ended-queue');
///
/// Internal Modules
const SuperTaskInternal = require('./lib/SuperTask');
const ContextPermissions = require('./lib/ContextPermissions');
const TaskObject = require('./lib/TaskObject');
///
/// Predefined Types
// TYPES
const ST_LOCAL_TYPE = 0, ST_SHARED_TYPE = 1, ST_FOREIGN_TYPE = 2;
// PERMISSIONS
const ST_NONE = 0, ST_RESTRICTED = 1, ST_MINIMAL = 2, ST_UNRESTRICTED = 3;
///
// No Operation function
function noop() { return null; }

class SuperTask extends SuperTaskInternal {
    /**
     * Creates new instance.
     * @class SuperTask
     * 
     * @example
     * var SuperTask = require('supertask');
     * var TaskManager = new SuperTask();
     * 
     * @returns {Instance} Returns a new instance of the module.
     */
    constructor(size) {
        super(size);
    }
    /**
    * Creates a new local Task. A local task is a task that is not
    * shared by any outside entity and usually performs slightly
    * faster than shared or foreign tasks as there is no compilation
    * or try/catch involved. 
    * 
    * @param {String} name - A unique name for this Task.
    * @param {Function} taskFunction - The JS function of the Task.
    * @returns {@link Task}
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
     * @returns {@link Task}
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
     * @param {String} taskName - Unique name of the task
     * @param {...*} arguments - Arguments that are passed to the Task.
     * You can call this function with any number of arguments so long
     * as the last argument is the callback.
     * @param {Function} callback - The callback that handles the response.
     * Note that the callback parameters are based on what the function calls
     * the callback with but will include `error` as the first parameter as
     * per usual NodeJS async calls.
     */
    do() {
        let args = new Array(arguments.length);
        for(let i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
        }
        let name = args.shift();
        let callback = noop;
        
        // Check for callback
        if (typeof args[args.length - 1] === 'function') {
            callback = args.pop();
        }
        
        this.apply(name, null, args, callback);
    }
    
    apply(name, context, args, callback) {
        
        // Check for mapped task
        if (!this.map.has(name)) {
            callback(new Error('Task not found!'));
            return;
        }

        let task = this.map.get(name);
        
        // Check for mapped task
        if (!task) {
            return callback(new Error('Task not found!'));
        }
        
        // Set Globals to task's default
        let globals = task.globals;
        // Combine Permissions Context (SLOWS DOWN EXECUTION)
        if ((task.access) && (task.access !== ST_NONE)) {
            globals = ContextPermissions(globals || {}, task.access);
        }
        
        // Make sure we have a context
        if (!context) context = {};
        
        // Override context with enforced methods
        for (let key in task.context) {
            context[key] = task.context[key];
        }
        
        // Sanitize args
        args = (Array.isArray(args)) ? args : [];

        // Compile task if it is in source form
        if (typeof task.func !== 'function') {
            try {
                let result = this._compile(task, globals);
                if (typeof result === 'function') task.func = result;
                else return callback(new Error("Unknown error occurred. Failed to compile and execution was halted."));
            } catch (e) {
                return callback(e);
            }
        }
        // Push to Queue
        this._push({
            name: name,
            globals: globals,
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