var chai = require("chai");
var async = require("async");
var expect = chai.expect;
var inspect = require("util").inspect;

var SuperTask = require('../interface');
var TaskManager;
var exec = 0;
var averager = { prev: 0, current: 0 };

var ftasks = {
    t1: "var exec = 0; module.exports = function(a1, callback){ setTimeout(function(){callback(null, a1, ++exec);}, 10) };",
    t2: "module.exports = function(callback) { callback(); console.log('hey'); };",
    t3: "module.exports = function(callback) { callback(null, process.hrtime()); };",
    t4delayed: "module.exports = function(callback) { setTimeout(function(){callback(null, process.hrtime());}, 5000); };"
};

function noop () { return null; }

describe('Basic Test Suite', function(){
    it('should create a new instance', function() {
        TaskManager = new SuperTask();
    });
    it('should add a local task', function() {
        var task = TaskManager.addLocal('test', function(callback) {
            exec++;
            callback(null, 'hey');
        });
        expect(task).to.have.property('model');
        expect(task.model).to.have.property('local');
    });
    it('should run a task', function(done) {
        TaskManager.do('test', function(error, result) {
            if(error) throw error;
            var task = TaskManager.get('test');
            expect(result).to.equal('hey');
            expect(exec).to.be.gte(1);
            averager.prev = task.model.lastDiff;
            done();
        });
    });
    it('should allow for context modifications', function(done) {
        var task = TaskManager.addLocal('testadvanced', function(callback) {
            exec++;
            callback(null, this.test);
        });
        task.permission(SuperTask.ST_NONE);
        expect(task.model).to.have.property('shared', false);
        TaskManager.apply('testadvanced', { test: 'advanced' }, [], function(error, test){
            expect(test).to.be.equal('advanced');
            done();
        });
    });
    it('should get a task', function() {
        expect(TaskManager.get('test').model.name).to.equal('test');
    });
    it('should calculate average execution time', function(done) {
        TaskManager.do('test', function(error, result) {
            if(error) throw error;
            var task = TaskManager.get('test');
            expect(result).to.equal('hey');
            expect(exec).to.be.gte(1);
            averager.current = (averager.prev + task.model.lastDiff)/2;
            expect(task.model.averageExecutionTime).to.be.equal(averager.current);
            // Sanity Check
            expect(task.model.averageExecutionTime).to.be.lt(1000000000);
            done();
        });
    });
    it('should deny duplicate task names', function() {
        expect(function(){
            TaskManager.addLocal('test', function(callback) {
                exec++;
                callback(null, 'hey');
            });
        }).to.throw("Enable to create new task. A Task with the given name already exists.");
    });
    it('should call with an error if do name is invalid', function(done) {
        TaskManager.do('unknown', function(error) {
            expect(error).to.be.an('error');
            expect(error).to.have.property('message', 'Task not found!');
            done();
        });
    });
    it('should check if task exists on has call', function() {
       var has = TaskManager.has('test');
       expect(has).to.be.equal(true);
    });
    it('should remove given task', function() {
        expect(TaskManager.has('test')).to.be.equal(true);
        TaskManager.remove('test');
        expect(TaskManager.has('test')).to.be.equal(false);
    });
});

describe('Foreign Task Suite', function(){
    it('should add a foreign task', function() {
        var task = TaskManager.addForeign('foreign', ftasks.t1);
        task.permission(SuperTask.ST_MINIMAL);
        expect(task.model).to.have.property('sandboxed', true);
    });
    it('should run a foreign task', function(done) {
        TaskManager.do('foreign', 'HelloWorld', function(error, a1, count) {
            if(error) throw error;
            expect(a1).to.equal('HelloWorld');
            expect(count).to.equal(1);
  
            done();
        });
    });
    it('should compile and cache a foreign task', function(done) {
        TaskManager.do('foreign', 'HelloWorld', function(error, a1, count) {
            if(error) throw error;
            expect(a1).to.equal('HelloWorld');
            expect(count).to.equal(2);
            expect(TaskManager.get('foreign').model.isCompiled).to.equal(true);
            done();
        });
    });
    it('should allow foreign tasks as JS functions', function(done) {
        var task = TaskManager.addForeign('foreignFunc', function(callback) {
            console.log('hey');
            callback();
        });
        var called = false;
        task.globals({ console: { log: function(m){
            if(called) return;
            expect(m).to.equal("hey");
            called = true;
            done();
        }}});
        TaskManager.do('foreignFunc');
    });
    it('should allow foreign tasks with context as JS functions', function(done) {
        var task = TaskManager.addForeign('foreignFunc2', function(callback) {
            console.log('hey');
            callback();
        });
        task.globals({
            console: {
                log: function(m){
                    expect(m).to.equal("hey");
                    done();
                }
            }
        });
        task.permission(SuperTask.ST_UNRESTRICTED);
        TaskManager.do('foreignFunc2');
    });
});

describe('Queue Suite', function(){
    it('should queue tasks', function() {
        TaskManager.do('foreign', 'HelloWorld');
        expect(TaskManager.queue.length).to.be.gte(1);
    });
    it('should queue tasks in parallel', function() {
        // Queue 5 times
        var i = 0;
        for(i=0; i < 5; i++) {
            TaskManager.do('foreign', 'HelloWorld');
        }
        expect(TaskManager.queue.length).to.be.gte(5);
    });
    it('should handle large parallel tasks', function(done) {
        this.timeout(60000);
        var parallelExecutionArray = [];
        var i = 0;
        this.concurrency = 10000;
        for(i=0; i < 100000; i++) {
            parallelExecutionArray.push(function(cb) {
                TaskManager.do('foreign', 'HelloWorld', cb);
            });
        }
        // Queue 100000 times
        async.parallel(parallelExecutionArray, function() {
            expect(TaskManager.queue.length).to.be.lte(10);
            done();
        });
        expect(TaskManager.queue.length).to.be.gte(100000);
    });
    it('should respect maximum concurrency limit', function(done) {
        TaskManager.concurrency = 10;
        // Queue 30 times
        var i = 0;
        for(i=0; i < 30; i++) {
            TaskManager.do('foreign', 'HelloWorld');
        }
        expect(TaskManager.queue.length).to.be.gte(30);
        setImmediate(function() {
            expect(TaskManager.queue.length).to.be.gte(20);
            done();
        });
    });
});

describe('Task Model Suite', function() {
    function pow2(n, cb) { cb(null, n*n, this); }
    // permission context priority sandbox module remote call apply
    it('should construct a proper model and underlying prototypes', function() {
        var task = TaskManager.addLocal('localMFunc', pow2);
        expect(task).to.have.property('model');
        expect(task.model).to.have.property('func', pow2);
    });
    it('should set/unset permissions', function() {
        var task = TaskManager.addLocal('localMFuncP1', pow2);
        expect(task).to.have.property('model');
        expect(task.permission()).to.be.equal(SuperTask.ST_MINIMAL);
        task.permission(SuperTask.ST_RESTRICTED);
        expect(task.permission()).to.be.equal(SuperTask.ST_RESTRICTED);
    });
    it('should set/unset globals', function() {
        var task = TaskManager.addLocal('localMFuncC1', pow2);
        var m = { test: true, a: 4 };
        expect(task).to.have.property('model');
        expect(task.globals()).to.be.eql({});
        task.globals(m);
        expect(task.globals()).to.be.eql(m);
    });
    it('should set/unset sandbox', function() {
        var task = TaskManager.addLocal('localMFuncS', pow2);
        expect(task).to.have.property('model');
        expect(task.sandbox()).to.be.equal(false);
        task.sandbox(true);
        expect(task.sandbox()).to.be.equal(true);
    });
    it('should set/unset module', function() {
        var task = TaskManager.addLocal('localMFuncM', pow2);
        expect(task).to.have.property('model');
        expect(task.module()).to.be.equal(true);
        task.module(false);
        expect(task.module()).to.be.equal(false);
    });
    it('should call through wrapper', function(done) {
        var task = TaskManager.addLocal('localMFuncC', pow2);
        expect(task).to.have.property('model');
        task.call(2, function(error, result) {
            expect(result).to.be.equal(4);
            done();
        });
    });
    it('should do through wrapper (alias check)', function(done) {
        var task = TaskManager.get('localMFuncC');
        task.do(2, function(error, result) {
            expect(result).to.be.equal(4);
            done();
        });
    });
    it('should apply through wrapper', function(done) {
        var task = TaskManager.addLocal('localMFuncA', pow2);
        expect(task).to.have.property('model');
        task.apply({ test: 'applied'}, [2], function(error, result, r2) {
            expect(result).to.be.equal(4);
            expect(r2).to.have.property('test', 'applied');
            done();
        });
    });
    it('should precompile through wrapper', function() {
        var task = TaskManager.addLocal('localMFuncPC', pow2);
        expect(task).to.have.property('model');
        task.precompile({ test: 'applied'});
        expect(task.model.isCompiled).to.be.equal(true);
    });
});

describe('Permission & Globals Suite', function(){
    /* Add More Tests */
    it('should contain the globals with respect to permissions', function(done) {
        var task = TaskManager.addForeign('foreignT3', ftasks.t3);
        task.permission(SuperTask.ST_UNRESTRICTED);
        expect(task.model).to.have.property('sandboxed');
        TaskManager.do('foreignT3', function(error, time) {
            expect(time).to.be.an('array');
            expect(time).to.have.length(2);
            done();
        });
    });
    it('should restrict the globals', function(done) {
        var task = TaskManager.addForeign('foreignT3C', ftasks.t3);
        task.permission(SuperTask.ST_RESTRICTED);
        expect(task.model).to.have.property('sandboxed', true);
        TaskManager.do('foreignT3C', function(error, time) {
            expect(error.message).to.have.string('process is not defined');
            done();
        });
    });
});

describe('Recursion & Call Methods', function(){
    it('should provide call methods as a part of context', function(done) {
        var funcStr = "module.exports = " +
        "function(callback){" +
           "if (typeof this.recurse !== 'function') return callback(new Error('no recurse')); " +
           "return callback(null, 'all good');" +
        "}";
        var task = TaskManager.addForeign('selfAware1', funcStr); 
        task.do(function(error, result) {
            expect(error).to.be.equal(null);
            expect(result).to.be.equal('all good');
            done();
        });
    });
    it('should be capable of recursing', function(done) {
        var funcStr = "module.exports = " +
        "function(){" +
           "var args = Array.prototype.slice.call(arguments);" +
           "var callback = args.pop();" +
           "if (args.length >= 1) { return callback(null, 2, args.shift()) }; " +
           "this.recurse('hello', callback);" +
        "}";
        var task = TaskManager.addForeign('selfAware2', funcStr);
        task.permission(SuperTask.ST_UNRESTRICTED);
        task.do(function(error, num, text) {
            expect(error).to.be.equal(null);
            expect(num).to.be.equal(2);
            expect(text).to.be.equal('hello');
            done();
        });
    });
});