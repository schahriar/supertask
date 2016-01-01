/// Modules
var defaultsDeep = require('lodash.defaultsdeep');
///
/// Predefined Types
var ST_NONE = 0, ST_RESTRICTED = 1, ST_MINIMAL = 2, ST_UNRESTRICTED = 3;
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
            context.require = restrictedRequire(['stream']);
            return defaultsDeep(context, {
                setTimeout: global.setTimeout,
                setInterval: global.setInterval,
                setImmediate: global.setImmediate,
                clearTimeout: global.clearTimeout,
                clearInterval: global.clearInterval,
                Buffer: Buffer
            });
        case ST_MINIMAL:
            // Allow some core modules
            context.require = restrictedRequire(['http', 'https', 'util', 'os', 'path', 'events', 'stream', 'string_decoder', 'url', 'zlib']);
            return defaultsDeep(context, {
                setTimeout: global.setTimeout,
                setInterval: global.setInterval,
                setImmediate: global.setImmediate,
                clearTimeout: global.clearTimeout,
                clearInterval: global.clearInterval,
                Buffer: Buffer,
                __dirname: __dirname,
                __filename: __filename,
                console: console
            });
        case ST_UNRESTRICTED:
            // Bad implementation
            /*NEEDS FIX*/
            return defaultsDeep(context, global);
        default:
            return context;
    }
};