/// Modules
const defaultsDeep = require('lodash.defaultsdeep');
///
/// Predefined Types
const ST_NONE = 0, ST_RESTRICTED = 1, ST_MINIMAL = 2, ST_UNRESTRICTED = 3;
///

// Build a restricted require
function restrictedRequire(allow) {
    return function(name) {
        if ((name) && (typeof name === 'string') && (allow.indexOf(name) !== -1)) {
            return require(name);
        }
    };
}

// Warning: Try to avoid setting context using permissions as much as possible
// Providing a unique context with the required globals to a task is a much better
// option that keeps the calls clean and improves performance of tasks
module.exports = function ST__CREATE_CONTEXT_P(context, type) {
    if (type === ST_NONE) return context;
    switch(type) {
        case ST_RESTRICTED:
            // Allow stream module
            if(!context.require) context.require = restrictedRequire(['stream']);
            if(!context.setTimeout) context.setTimeout = global.setTimeout;
            if(!context.setInterval) context.setInterval = global.setInterval;
            if(!context.setImmediate) context.setImmediate = global.setImmediate;
            if(!context.clearTimeout) context.clearTimeout = global.clearTimeout;
            if(!context.clearInterval) context.clearInterval = global.clearInterval;
            if(!context.Buffer) context.Buffer = Buffer;
            return context;
        case ST_MINIMAL:
            // Allow some core modules
            if(!context.require) context.require = restrictedRequire(['http', 'https', 'util', 'os', 'path', 'events', 'stream', 'string_decoder', 'url', 'zlib']);
            if(!context.setTimeout) context.setTimeout = global.setTimeout;
            if(!context.setInterval) context.setInterval = global.setInterval;
            if(!context.setImmediate) context.setImmediate = global.setImmediate;
            if(!context.clearTimeout) context.clearTimeout = global.clearTimeout;
            if(!context.clearInterval) context.clearInterval = global.clearInterval;
            if(!context.Buffer) context.Buffer = Buffer;
            if(!context.console) context.console = global.console;
            return context;
        case ST_UNRESTRICTED:
            // Allow all core modules & most globals
            if(!context.require) context.require = require;
            if(!context.setTimeout) context.setTimeout = global.setTimeout;
            if(!context.setInterval) context.setInterval = global.setInterval;
            if(!context.setImmediate) context.setImmediate = global.setImmediate;
            if(!context.clearTimeout) context.clearTimeout = global.clearTimeout;
            if(!context.clearInterval) context.clearInterval = global.clearInterval;
            if(!context.Buffer) context.Buffer = Buffer;
            if(!context.console) context.console = global.console;
            if(!context.process) context.process = global.process;
            return context;
        default:
            return context;
    }
};