"use strict";

/// Predefined Types
// TYPES
const ST_LOCAL_TYPE = 0, ST_SHARED_TYPE = 1, ST_FOREIGN_TYPE = 2;
// PERMISSIONS
const ST_NONE = 0, ST_RESTRICTED = 1, ST_MINIMAL = 2, ST_UNRESTRICTED = 3;
///

class TaskModel {
    constructor(name, func, handler, type) {
        this.name = name;
        this.func = func;
        this.handler = handler;
        this.source = (typeof func === 'function')?('module.exports = ' + func.toString()):func;
        this.local = (type === ST_LOCAL_TYPE);
        this.shared = (type === ST_SHARED_TYPE);
        this.sandboxed = (type === ST_FOREIGN_TYPE);
        this.isModule = true;
        this.isCompiled = (typeof func === 'function');
        this.isRemote = false;
        this.lastStarted = [];
        this.lastFinished = [];
        this.lastDiff = 0;
        this.averageExecutionTime = -1;
        this.executionRounds = 0;
        this.defaultContext = {};
        this.access = ST_MINIMAL;
    }
}

module.exports = TaskModel;
