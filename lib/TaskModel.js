/// Predefined Types
// TYPES
var ST_LOCAL_TYPE = 0, ST_SHARED_TYPE = 1, ST_FOREIGN_TYPE = 2;
// PERMISSIONS
var ST_NONE = 0, ST_RESTRICTED = 1, ST_MINIMAL = 2, ST_UNRESTRICTED = 3;
///

/**
 * Created through {@link SuperTask#addLocal}, {@link SuperTask#addShared} and {@link SuperTask#get} methods.
 * @constructor
 */
var Task = function ST__TASK_MODEL(instance, name, func, handler, type, model) {
    this._do = instance.do.bind(instance);
    this._compile = instance._compile.bind(instance);
    // If model is given task is wrapped
    this.model = model || {
        name: name,
        func: func,
        handler: handler,
        source: (typeof func === 'function')?('module.exports = ' + func.toString()):func,
        local: (type === ST_LOCAL_TYPE),
        shared: (type === ST_SHARED_TYPE),
        sandboxed: (type === ST_FOREIGN_TYPE),
        isModule: true,
        isCompiled: (typeof func === 'function'),
        isRemote: false,
        lastStarted: [],
        lastFinished: [],
        lastDiff: 0,
        averageExecutionTime: -1,
        executionRounds: 0,
        priority: -1,
        defaultContext: {},
        access: ST_NONE
    };
};

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
Task.prototype.permission = function ST__TASK_MODEL_GETSET_ACCESS(permission) {
    if(permission !== undefined) this.model.access = permission;
    return this.model.access;
};

/**
 * Gets/Sets context of the Task. Context is not the same as
 * a local function context (this). This context is the VM's
 * context such as globals. Check out NodeJS's VM core module
 * for more info.
 * 
 * @example
 * var SuperTask = require('supertask');
 * var TaskManager = new SuperTask();
 * TaskManager.addLocal('ctask', function(callback) { callback(null, this.test); }, function(error, task) {
 *      task.context({ test: 'yes' });
 *      TaskManager.do('ctask', function(error, r1){
 *          console.log(r1);
 *          // Output: yes
 *      })
 * });
 *
 * @param {Object} [context] - Context of the Task.
 * 
 * @returns {Object} context
 */
Task.prototype.context = function ST__TASK_MODEL_GETSET_CONTEXT(context) {
    if(context !== undefined) this.model.defaultContext = context;
    return this.model.defaultContext;
};

/**
 * Gets/Sets Task's priority that determines order of execution
 * in optimizations. To disable property set optimization level
 * to {@link SuperTask#ST_0}. To change order of priority use
 * {@link SuperTask#ST_O_PRIORITY_ASC} & {@link SuperTask#ST_O_PRIORITY_DSC}
 * with {@link SuperTask#setFlags} method.
 *
 * @param {Number} [priority] - Priority of the Task.
 * 
 * @returns {Number} priority
 */
Task.prototype.priority = function ST__TASK_MODEL_GETSET_PRIORITY(priority) {
    if(priority !== undefined) this.model.priority = (priority)?Math.abs(priority):-1;
    return this.model.priority;
};

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
Task.prototype.sandbox = function ST__TASK_MODEL_GETSET_SANDBOX(sandboxed) {
    if(sandboxed !== undefined) this.model.sandboxed = (!!sandboxed);
    return this.model.sandboxed;
};

Task.prototype.module = function ST__TASK_MODEL_GETSET_MODULE(isModule) {
    if(isModule !== undefined) this.model.isModule = (!!isModule);
    else return this.model.isModule;
};

Task.prototype.remote = function ST__TASK_MODEL_GETSET_REMOTE(isRemote, handler) {
    if(isRemote !== undefined) {
        this.model.isRemote = (!!isRemote);
        this.model.func = handler;
    }else return this.model.isRemote;
};

/**
 * An internal replacement for {@link SuperTask#do} function.
 *
 * @param {...arguments} [arguments]
 * @param {Function} callback
 */
Task.prototype.call = function ST__TASK_MODEL_CALL() {
    var args = Array.prototype.slice.call(arguments);
    // Add name to args
    args.unshift(this.model.name);
    this._do.apply(null, args);
};

/**
 * An extension to {@link SuperTask#do} function. Enables passing
 * of context as the first argument and call arguments as an array
 *
 * @param {Object} context - Context of the Task.
 * @param {Array} arguments - An array of arguments.
 * @param {Function} callback
 */
Task.prototype.apply = function ST__TASK_MODEL_APPLY(context, args, callback) {
    this.context(context);
    // Add name to args
    args.unshift(this.model.name);
    // Allow callback to be the last argument
    if(typeof callback === 'function') {
        args.push(callback);
    }
    this._do.apply(null, args);
};

/**
 * Allows for precompilation of the Task to save execution time
 * on the first call. Note that to change the context you'll
 * need to precompile the task again. Context is preserved.
 *
 * @param {Object} context
 */
Task.prototype.precompile = function ST__TASK_PRE_COMPILE(context) {
    // Compile script
    this._compile(this.model, context);
};

module.exports = {
    create: function ST__CREATE_TASK(ST_DO, name, func, handler, type) {
        return new Task(ST_DO, name, func, handler, type, null);
    },
    wrap: function ST__WRAP_TASK(ST_DO, model) {
        return new Task(ST_DO, null, null, null, null, model);
    }
};