/// Predefined Types
// TYPES
var ST_LOCAL_TYPE = 0, ST_SHARED_TYPE = 1, ST_FOREIGN_TYPE = 2;
// PERMISSIONS
var ST_NONE = 0, ST_RESTRICTED = 1, ST_MINIMAL = 2, ST_UNRESTRICTED = 3;
///

var Task = function ST__TASK_MODEL(ST_DO, func, type) {
    this._do = ST_DO;
    this.model = {
        func: func,
        source: (typeof func === 'function')?('module.exports = ' + func.toString()):func,
        local: (type === ST_LOCAL_TYPE),
        shared: (type === ST_SHARED_TYPE),
        sandboxed: (type === ST_FOREIGN_TYPE),
        module: true,
        isCompiled: (typeof func === 'function'),
        isRemote: false,
        remoteHandler: null,
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

Task.prototype.permission = function ST__TASK_MODEL_GETSET_ACCESS(permission) {
    if(permission !== undefined) this.model.access = permission;
    else return this.model.access;
};

Task.prototype.context = function ST__TASK_MODEL_GETSET_CONTEXT(context) {
    if(context !== undefined) this.model.defaultContext = context;
    else return this.model.defaultContext;
};

Task.prototype.priority = function ST__TASK_MODEL_GETSET_PRIORITY(priority) {
    if(priority !== undefined) this.model.priority = (priority)?Math.abs(priority):-1;
    else return this.model.priority;
};

Task.prototype.sandbox = function ST__TASK_MODEL_GETSET_SANDBOX(sandboxed) {
    if(sandboxed !== undefined) this.model.sandboxed = (!!sandboxed);
    else return this.model.sandboxed;
};

Task.prototype.module = function ST__TASK_MODEL_GETSET_MODULE(isModule) {
    if(isModule !== undefined) this.model.module = (!!isModule);
    else return this.model.module;
};

Task.prototype.remote = function ST__TASK_MODEL_GETSET_REMOTE(isRemote, handler) {
    if(isRemote !== undefined) {
        this.model.remote = (!!isRemote);
        this.model.remoteHandler = handler;
    }
    else return this.model.remote;
};

Task.prototype.call = function ST__TASK_MODEL_CALL() {
    this._do.apply(null, arguments);
};

Task.prototype.apply = function ST__TASK_MODEL_APPLY(context, args) {
    this.context(context);
    this._do.apply(null, args);
};

module.exports = function ST__CREATE_TASK(ST_DO, name, func, type) {
    return new Task(ST_DO, func, type);
};