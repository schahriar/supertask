"use strict";

/// Required Core Modules
const vm = require('vm');
const eventEmmiter = require('events').EventEmitter;
///
/// External Modules
const Deque = require('double-ended-queue');
///
/// Internal Modules
const TaskObject = require('./TaskObject');
///

class SuperTask extends eventEmmiter { 
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
        /* from cache to be executed after attaching
        /* the post tracker */
        
        // Do a batch
        for (let i = 0; i < Math.min(this.queue.length, this.concurrency); i++) {
            // Get a job
            let job = this.queue.shift();
            
            // Create a tracker
            let postTracker = function(error) {
                // Calculate High Resolution time it took to run the function
                job.task.lastFinished = process.hrtime(job.task.lastStarted);
                // Calculate Time Difference
                job.task.lastDiff = job.task.lastFinished[0] * 1e9 + job.task.lastFinished[1];
                // Calculate Average Execution Time
                if (job.task.averageExecutionTime === -1) {
                    job.task.averageExecutionTime = job.task.lastDiff;
                } else {
                    job.task.averageExecutionTime = ((job.task.averageExecutionTime * job.task.executionRounds) + job.task.lastDiff) / (job.task.executionRounds + 1);
                }
                // Bump execution rounds
                job.task.executionRounds++;

                job.callback.apply(null, arguments);
            };

            // Assign lastStarted
            job.task.lastStarted = process.hrtime();
            // Push Callback to args
            job.args.push(postTracker);
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
                        postTracker(error);
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
        let task = TaskObject.create(this, name, func, handler, type);
        // Add Task's model to Map
        this.map.set(name, task.model);

        return task;
    }

    _compile(task, context) {        
        // Check if script is not compiled
        if (typeof task.func === 'string') {
            // Compile script using VM
            task.func = new vm.Script(task.func);
        }else if (typeof task.func === 'function') {
            // If script is already compiled return it
            return task.func;
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
}

module.exports = SuperTask;