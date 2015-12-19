var SuperTask = function ST_INIT() {
	this.queue = [];
	this.map = new Map();
};

SuperTask.prototype.addLocal = function ST_ADD_LOCAL(name, func, callback) {
    if(this.map.has(name)) {
        if(typeof callback === 'function') callback(new Error('Enable to create new task. A Task with the given name already exists.'));
        return;
    }
    var task = {
        func: func,
        local: true,
        isRemote: false,
        lastStarted: [],
        lastFinished: [],
        lastDiff: 0,
        averageExecutionTime: -1,
        executionRounds: 0
    };
    // Add Task to Map
	this.map.set(name, task);
    
    if(typeof callback === 'function') callback(null, task);
};

SuperTask.prototype.do = function ST_DO(name, context, args, callback) {
    if(!this.map.has(name)) {
        if(typeof callback === 'function') callback(new Error('Task not found!'));
        return;
    }
    var task = this.map.get(name);
    task.lastStarted = process.hrtime();
    // Sanitize args
    args = (Array.isArray(args))?args:[];
    // Push Callback & Tracker to args;
    args.push(function ST_DO_TRACKER(error) {
        // Calculate High Resolution time it took to run the function
        task.lastFinished = process.hrtime(task.lastStarted);
        // Calculate Time Difference
        task.lastDiff = task.lastFinished[0] * 1e9 + task.lastFinished[1];
        // Calculate Average Execution Time
        if(task.averageExecutionTime === -1) {
            task.averageExecutionTime = task.lastDiff;
        }else{
            task.averageExecutionTime = ((task.averageExecutionTime*task.executionRounds) + task.lastDiff)/(task.executionRounds+1);
        }
        // Bump execution rounds
        task.executionRounds++;
        // Call Callback function if provided
        if(typeof callback === 'function') callback.apply(task, arguments);
    });
    
    task.func.apply(context || {}, args);
};

SuperTask.prototype.remove = function ST_REMOVE(name, callback) {
    var result = this.map.delete(name);
    if(typeof callback === 'function') callback((!result)?(new Error('Task not found!')):null);
};

SuperTask.prototype.has = function ST_HAS(name, callback) {
    if(typeof callback === 'function') callback(null, (!!this.map.has(name)));
};

module.exports = SuperTask;