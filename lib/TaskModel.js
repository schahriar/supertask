/// Predefined Types
// TYPES
var ST_LOCAL_TYPE = 0, ST_SHARED_TYPE = 1, ST_FOREIGN_TYPE = 2;
// PERMISSIONS
var ST_NONE = 0, ST_RESTRICTED = 1, ST_MINIMAL = 2, ST_UNRESTRICTED = 3;
///

module.exports = function ST__CREATE_TASK(func, type, access, priority, context, isModule, remote, sandboxed) {
    return {
        func: func,
        source: (typeof func === 'function')?('module.exports = ' + func.toString()):func,
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