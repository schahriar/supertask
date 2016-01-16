"use strict";

/// Predefined Types
// TYPES
const ST_LOCAL_TYPE = 0, ST_SHARED_TYPE = 1, ST_FOREIGN_TYPE = 2;
// PERMISSIONS
const ST_NONE = 0, ST_RESTRICTED = 1, ST_MINIMAL = 2, ST_UNRESTRICTED = 3;
///
const TaskModel = require('./TaskModel');

/**
 * Created through {@link SuperTask#addLocal}, {@link SuperTask#addForeign} and {@link SuperTask#get} methods.
 * @constructor
 */
class Task {
    constructor(instance, name, func, handler, type, model) {
        this._do = instance.do.bind(instance);
        this._apply = instance.apply.bind(instance);
        this._compile = instance._compile.bind(instance);
        // If model is given task is wrapped
        this.model = model || (new TaskModel(name, func, handler, type));
    }
    
    /**
     * Gets/Sets permission of the Task based on the given SuperTaskPermissionFlag
     * such as {@link SuperTask#ST_NONE} or {@link SuperTask#ST_MINIMAL}.
     * 
     * @example
     * var SuperTask = require('supertask');
     * var TaskManager = new SuperTask();
     * TaskManager.addLocal('minimaltask', function(callback) { setTimeout(callback, 1000); }, function(error, task) {
     *      task.permission(SuperTask.ST_MINIMAL);
     * });
     *
    * @param {SuperTaskPermissionFlag} [permission] - Permission of the Task.
    * 
    * @returns {SuperTaskPermissionFlag} access
    */
    permission(_permission_) {
        if(_permission_ !== undefined) this.model.access = _permission_;
        return this.model.access;
    }
    
    /**
     * Gets/Sets global variables available to a the Task.
     * 
     * @example
     * var SuperTask = require('supertask');
     * var TaskManager = new SuperTask();
     * TaskManager.addLocal('ctask', function(callback) { callback(null, this.test); }, function(error, task) {
     *      task.globals({ test: 'yes' });
     *      TaskManager.do('ctask', function(error, r1){
     *          console.log(r1);
     *          // Output: yes
     *      })
     * });
     *
    * @param {Object} [globals] - Globals of the Task.
    * 
    * @returns {Object} globals
    */
    globals(_globals_) {
        if(_globals_ !== undefined) this.model.globals = _globals_;
        return this.model.globals;
    }
    
    /**
     * Gets/Sets Task's isSanboxed property. If a task is sandboxed
     * it is determined to be likely for it to throw therefore it is
     * wrapped around a try/catch block. By default all no local tasks
     * are sandboxed. Error that is caught is passed to callback as the
     * first argument.
     *
    * @param {Boolean} [sandboxed] - Sandbox property of the Task.
    * 
    * @returns {Boolean} sandboxed
    */
    sandbox(isSandboxed) {
        if(isSandboxed !== undefined) this.model.sandboxed = (!!isSandboxed);
        return this.model.sandboxed;
    }
    
    module(isModule) {
        if(isModule !== undefined) this.model.isModule = (!!isModule);
        else return this.model.isModule;
    }
    
    /**
     * An internal replacement for {@link SuperTask#do} function.
     *
    * @param {...arguments} [arguments]
    * @param {Function} callback
    */
    call() {
        let args = Array.prototype.slice.call(arguments);
        // Add name to args
        args.unshift(this.model.name);
        this._do.apply(null, args);
    }
    
    /**
     * An extension to {@link SuperTask#do} function. Enables passing
     * of call context (this) as the first argument followed by the
     * call arguments as an array
     *
    * @param {Object} context - Context of the Task (this).
    * @param {Array} arguments - An array of arguments.
    * @param {Function} callback
    */
    apply(context, args, callback) {
        this._apply(this.model.name, context, args, callback);
    }

    /**
     * Allows for precompilation of the Task to save execution time
     * on the first call. Note that to change the context you'll
     * need to precompile the task again. Context is preserved.
     *
    * @param {Object} context
    */
    precompile(context) {
        // Compile script
        this._compile(this.model, context);
    }
    
    static create(ST_DO, name, func, handler, type) {
        return new Task(ST_DO, name, func, handler, type, null);
    }
    
    static wrap(ST_DO, model) {
        return new Task(ST_DO, null, null, null, null, model);
    }
    
}

/**
 * An alias for {@link Task#call} function.
 *
 * @param {...arguments} [arguments]
 * @param {Function} callback
 */
Task.prototype.do = Task.prototype.call;

module.exports = Task;
