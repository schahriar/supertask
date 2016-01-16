var chai = require("chai");
var async = require("async");
var expect = chai.expect;
var inspect = require("util").inspect;

var SuperTask = require('../supertask');
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
    it('should add a local task', function(done) {
        TaskManager.addLocal('test', function(callback) {
            exec++;
            callback(null, 'hey');
        }, function(error, task) {
            if(error) throw error;
            expect(task).to.have.property('model');
            expect(task.model).to.have.property('local');
            done();
        });
    });
    it('should run a task', function(done) {
        TaskManager.do('test', function(error, result) {
            if(error) throw error;
            expect(result).to.equal('hey');
            expect(exec).to.be.gte(1);
            averager.prev = this.lastDiff;
            done();
        });
    });
    it('should allow for context modifications', function(done) {
        TaskManager.addLocal('testadvanced', function(callback) {
            exec++;
            callback(null, this.test);
        }, function(error, task) {
            if(error) throw error;
            task.context({ test: 'advanced' });
            task.permission(SuperTask.ST_NONE);
            expect(task.model).to.have.property('shared', false);
            TaskManager.do('testadvanced', function(error, test){
                expect(test).to.be.equal('advanced');
                done();
            });
        });
    });
    it('should add a shared task', function(done) {
        TaskManager.addShared('testShared', function(callback) {
            callback(null, 'hey');
        }, noop, function(error, task) {
            if(error) throw error;
            expect(task.model).to.have.property('shared', true);
            done();
        });
    });
    it('should run a shared task', function(done) {
        var called = false;
        TaskManager.addShared('testSharedAdvanced', function(callback) {
            callback(null, this.test);
        }, function(name, context, callback) { called = true; TaskManager.get(name).model.func.apply(context, [callback]); }, function(error, task) {
            if(error) throw error;
            task.context({ test: 'advanced' });
            task.permission(SuperTask.ST_NONE);
            TaskManager.do('testSharedAdvanced', function(error, test){
                expect(test).to.be.equal('advanced');
                expect(called).to.be.equal(true);
                done();
            });
        });
    });
    it('should get a task', function() {
        expect(TaskManager.get('testShared').model.name).to.equal('testShared');
    });
    it('should calculate average execution time', function(done) {
        TaskManager.do('test', function(error, result) {
            if(error) throw error;
            expect(result).to.equal('hey');
            expect(exec).to.be.gte(1);
            averager.current = (averager.prev + this.lastDiff)/2;
            expect(this.averageExecutionTime).to.be.equal(averager.current);
            // Sanity Check
            expect(this.averageExecutionTime).to.be.lt(1000000000);
            done();
        });
    });
    it('should deny duplicate task names', function(done) {
        TaskManager.addLocal('test', function(callback) {
            exec++;
            callback(null, 'hey');
        }, function(error) {
            expect(error.message).to.be.equal('Enable to create new task. A Task with the given name already exists.');
            done();
        });
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
    it('should add a foreign task', function(done) {
        TaskManager.addForeign('foreign', ftasks.t1, function(error, task) {
            if(error) throw error;
            task.permission(SuperTask.ST_MINIMAL);
            expect(task.model).to.have.property('sandboxed', true);
            done();
        });
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
            expect(this.isCompiled).to.equal(true);
            done();
        });
    });
    it('should allow foreign tasks as JS functions', function(done) {
        TaskManager.addForeign('foreignFunc', function(callback) {
            console.log('hey');
            callback();
        }, function(error, task) {
            if(error) throw error;
            var called = false;
            task.context({ console: { log: function(m){
                if(called) return;
                expect(m).to.equal("hey");
                called = true;
                done();
            }}});
            TaskManager.do('foreignFunc');
        });
    });
    it('should allow foreign tasks with context as JS functions', function(done) {
        TaskManager.addForeign('foreignFunc2', function(callback) {
            console.log('hey');
            callback();
        }, function(error, task) {
            if(error) throw error;
            task.context({
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
});

describe('Queue Suite', function(){
    it('should queue tasks', function() {
        TaskManager.do('foreign', 'HelloWorld');
        expect(TaskManager.queue.length).to.be.gte(1);
    });
    it('should queue tasks in parallel', function() {
        // Queue 5 times
        var i = 0;
        for(i=0; i<5; i++) {
            TaskManager.do('foreign', 'HelloWorld');
        }
        expect(TaskManager.queue.length).to.be.gte(5);
    });
    it('should handle large parallel tasks', function(done) {
        this.timeout(20000);
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
    it('should construct a proper model and underlying prototypes', function(done) {
        TaskManager.addLocal('localMFunc', pow2, function(error, task) {
            expect(task).to.have.property('model');
            expect(task.model).to.have.property('func', pow2);
            done();
        });
    });
    it('should set/unset permissions', function(done) {
        TaskManager.addLocal('localMFuncP1', pow2, function(error, task) {
            expect(task).to.have.property('model');
            expect(task.permission()).to.be.equal(SuperTask.ST_MINIMAL);
            task.permission(SuperTask.ST_RESTRICTED);
            expect(task.permission()).to.be.equal(SuperTask.ST_RESTRICTED);
            done();
        });
    });
    it('should set/unset context', function(done) {
        TaskManager.addLocal('localMFuncC1', pow2, function(error, task) {
            var m = { test: true, a: 4 };
            expect(task).to.have.property('model');
            expect(task.context()).to.be.eql({});
            task.context(m);
            expect(task.context()).to.be.eql(m);
            done();
        });
    });
    it('should set/unset sandbox', function(done) {
        TaskManager.addLocal('localMFuncS', pow2, function(error, task) {
            expect(task).to.have.property('model');
            expect(task.sandbox()).to.be.equal(false);
            task.sandbox(true);
            expect(task.sandbox()).to.be.equal(true);
            done();
        });
    });
    it('should set/unset module', function(done) {
        TaskManager.addLocal('localMFuncM', pow2, function(error, task) {
            expect(task).to.have.property('model');
            expect(task.module()).to.be.equal(true);
            task.module(false);
            expect(task.module()).to.be.equal(false);
            done();
        });
    });
    it('should call through wrapper', function(done) {
        TaskManager.addLocal('localMFuncC', pow2, function(error, task) {
            expect(task).to.have.property('model');
            task.call(2, function(error, result) {
                expect(result).to.be.equal(4);
                done();
            });
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
        TaskManager.addLocal('localMFuncA', pow2, function(error, task) {
            expect(task).to.have.property('model');
            task.apply({ test: 'applied'}, [2], function(error, result, r2) {
                expect(result).to.be.equal(4);
                expect(r2).to.have.property('test', 'applied');
                done();
            });
        });
    });
    it('should precompile through wrapper', function(done) {
        TaskManager.addLocal('localMFuncPC', pow2, function(error, task) {
            expect(task).to.have.property('model');
            task.precompile({ test: 'applied'});
            expect(task.model.isCompiled).to.be.equal(true);
            done();
        });
    });
});

describe('Permission & Context Suite', function(){
    /* Add More Tests */
    it('should contain the context with respect to permissions', function(done) {
        TaskManager.addForeign('foreignT3', ftasks.t3, function(error, task) {
            if(error) throw error;
            task.permission(SuperTask.ST_UNRESTRICTED);
            expect(task.model).to.have.property('sandboxed');
            TaskManager.do('foreignT3', function(error, time) {
                expect(time).to.be.an('array');
                expect(time).to.have.length(2);
                done();
            });
        });
    });
    it('should restrict the context', function(done) {
        TaskManager.addForeign('foreignT3C', ftasks.t3, function(error, task) {
            if(error) throw error;
            task.permission(SuperTask.ST_RESTRICTED);
            expect(task.model).to.have.property('sandboxed', true);
            TaskManager.do('foreignT3C', function(error, time) {
                expect(error.message).to.have.string('process is not defined');
                done();
            });
        });
    });
});