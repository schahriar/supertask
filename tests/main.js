var chai = require("chai");
var expect = chai.expect;
var inspect = require("util").inspect;

var SuperTask = require('../supertask');
var Optimizer = require('../lib/Optimizations');
var TaskManager;
var exec = 0;
var averager = { prev: 0, current: 0 };

var ftasks = {
    t1: "var exec = 0; module.exports = function(a1, callback){ setTimeout(function(){callback(null, a1, ++exec);}, 10) };",
    t2: "module.exports = function(callback) { callback(); console.log('hey'); };",
    t3: "module.exports = function(callback) { callback(null, process.hrtime()); };",
    t4delayed: "module.exports = function(callback) { setTimeout(function(){callback(null, process.hrtime());}, 5000); };"
};

var samples = {
    o_basic: [{
        name: "e1",
        averageExecutionTime: 5300
    }, {
        name: "e2",
        averageExecutionTime: 1200
    }, {
        name: "e3",
        averageExecutionTime: 2000
    }],
    o_mixed: [{
        name: "e1",
        averageExecutionTime: 3000
    }, {
        name: "e2",
        averageExecutionTime: 5300
    }, {
        name: "e3",
        averageExecutionTime: 2000
    }],
    o_mixed_2: [{
        name: "e1",
        averageExecutionTime: 1900
    }, {
        name: "e2",
        averageExecutionTime: 3200
    }, {
        name: "e3",
        averageExecutionTime: 1000
    }],
    o_advanced: [{
        name: "e1",
        averageExecutionTime: 1900,
        executionRounds: 10
    }, {
        name: "e2",
        averageExecutionTime: 1900,
        executionRounds: 100
    }, {
        name: "e3",
        averageExecutionTime: 8000,
        executionRounds: 0
    }],
    o_advanced2: [{
        name: "e1",
        averageExecutionTime: 1900,
        executionRounds: 10,
        priority: 4
    }, {
        name: "e2",
        averageExecutionTime: 1900,
        executionRounds: 100,
        priority: 0
    }, {
        name: "e3",
        averageExecutionTime: 8000,
        executionRounds: 0,
        priority: 100
    }]
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
            exec++;
            callback(null, 'hey');
        }, function(error, task) {
            if(error) throw error;
            expect(task.model).to.have.property('shared', true);
            done();
        });
    });
    it('should run a shared task', function(done) {
        TaskManager.addShared('testSharedAdvanced', function(callback) {
            exec++;
            callback(null, this.test);
        }, function(error, task) {
            if(error) throw error;
            task.context({ test: 'advanced' });
            task.permission(SuperTask.ST_NONE);
            TaskManager.do('testSharedAdvanced', function(error, test){
                expect(test).to.be.equal('advanced');
                done();
            });
        });
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
    it('should check if task exists on has call', function(done) {
       TaskManager.has('test', function(error, has) {
           if(error) throw error;
           expect(has).to.be.equal(true);
           done();
       });
    });
    it('should remove given task', function(done) {
        TaskManager.remove('test', function(error) {
            if(error) throw error;
            TaskManager.has('test', function(error, has) {
                if(error) throw error;
                expect(has).to.be.equal(false);
                done();
            });
        });
    });
    it('should contain optimization flags', function (){
        expect(SuperTask).to.have.property('ST_O0');
        expect(SuperTask).to.have.property('ST_O_PRIORITY_ASC');
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

describe('Queue & Cargo Suite', function(){
    it('should queue tasks', function() {
        TaskManager.do('foreign', 'HelloWorld');
        expect(TaskManager.cargo.length()).to.be.gte(1);
    });
    it('should queue tasks in parallel', function() {
        // Queue 5 times
        var i = 0;
        for(i=0; i<5; i++) {
            TaskManager.do('foreign', 'HelloWorld');
        }
        expect(TaskManager.cargo.length()).to.be.gte(5);
    });
    it('should handle large parallel tasks', function(done) {
        this.timeout(10000);
        // Set max parallel to 5000
        TaskManager.cargo.payload = 5000;
        // Queue 5000 times
        var i = 0;
        for(i=0; i<5000; i++) {
            TaskManager.do('foreign', 'HelloWorld');
        }
        expect(TaskManager.cargo.length()).to.be.gte(5000);
        TaskManager.cargo.drain = function(){
            done();
            // Reset
            TaskManager.cargo.drain = noop;
        };
    });
    it('should respect maximum parallel execution limit', function(done) {
        TaskManager.cargo.payload = 10;
        var saturated = false;
        TaskManager.cargo.saturated = function(){
            saturated = true;
        };
        // Queue 30 times
        var i = 0;
        for(i=0; i<30; i++) {
            TaskManager.do('foreign', 'HelloWorld');
        }
        expect(saturated).to.be.equal(true);
        var c = 0;
        TaskManager.cargo.drain = function(){
            done();
            // Reset
            TaskManager.cargo.drain = noop;
        };
    });
    it('should free cargo after set timeout', function(done) {
        // Increase test timeout
        this.timeout(5000);
        // Set timeout
        TaskManager.timeout(100);
        expect(TaskManager.timeout()).to.be.equal(100);
        TaskManager.addForeign('foreignDelayed', ftasks.t4delayed, function(error, task) {
            if(error) throw error;
            task.permission(SuperTask.ST_MINIMAL);
            // Clog the cargo
            TaskManager.cargo.payload = 10;
            for(var i=0; i<10; i++) {
                TaskManager.do('foreignDelayed');
            }
            setImmediate(function(){
                TaskManager.do('foreignFunc', function(){
                    done();
                });
                TaskManager.timeout(1000);
            });
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
    it('should set priority', function(done) {
        TaskManager.addLocal('localMFuncP', pow2, function(error, task) {
            expect(task).to.have.property('model');
            expect(task.priority()).to.be.equal(-1);
            task.priority(10);
            expect(task.priority()).to.be.equal(10);
            done();
        });
    });
    it('should set/unset sanbox', function(done) {
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
    it('should set/unset remote', function(done) {
        function handler() {}
        TaskManager.addLocal('localMFuncR', pow2, function(error, task) {
            expect(task).to.have.property('model');
            expect(task.remote()).to.be.equal(false);
            task.remote(true, handler);
            expect(task.remote()).to.be.equal(true);
            expect(task.model.remoteHandler).to.be.equal(handler);
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

describe('Optimizer Test Suite', function() {
    it('should oprimize based on AET', function() {
        var OptimizedArray = Optimizer.optimize(samples.o_basic);
        expect(OptimizedArray[0]).to.deep.equal({ name: 'e2', averageExecutionTime: 1200, value: 0 });
    });
    it('should retain original content of objects within array', function() {
        var OptimizedArray = Optimizer.optimize(samples.o_basic);
        expect(OptimizedArray[0]).to.have.property('averageExecutionTime', 1200);
        expect(OptimizedArray[0]).to.have.property('name', 'e2');
    });
    it('should allow ascending/descending order', function() {
        var OptimizedArray = Optimizer.optimize(samples.o_mixed, Optimizer.levels.ST_O2, Optimizer.flags.ST_O_AET_DSC);
        expect(OptimizedArray[0]).to.have.property('averageExecutionTime', 5300);
        expect(OptimizedArray[0]).to.have.property('name', 'e2');
    });
    it('should respect sorting algorithm selection & offer same results', function() {
        var OptimizedArray = Optimizer.optimize(samples.o_mixed, Optimizer.levels.ST_O2, Optimizer.flags.ST_O_AET_DSC | Optimizer.flags.ST_O_SORT_QUICKONLY);
        expect(OptimizedArray[0]).to.have.property('averageExecutionTime', 5300);
        expect(OptimizedArray[0]).to.have.property('name', 'e2');
    });
    it('should not optimize with level O0', function() {
        var Array = Optimizer.optimize(samples.o_mixed_2, Optimizer.levels.ST_O0);
        expect(Array[0]).to.have.property('name', 'e1');
        expect(Array[0]).to.not.have.property('value');
    });
    it('should optimize at optimization level', function() {
        var Array = Optimizer.optimize(samples.o_mixed_2, Optimizer.levels.ST_O1, Optimizer.flags.ST_O_ER_ASC);
        expect(Array[0]).to.have.property('name', 'e1');
    });
    it('should respect ER optimization', function() {
        var first = Optimizer.optimize(samples.o_advanced, Optimizer.levels.ST_O2, Optimizer.flags.ST_O_ER_DSC);
        expect(first[0]).to.have.property('name', 'e2');
        var second = Optimizer.optimize(samples.o_advanced, Optimizer.levels.ST_O2, Optimizer.flags.ST_O_ER_ASC);
        expect(second[0]).to.have.property('name', 'e1');
    });
    it('should sort with respect to priority', function() {
        var first = Optimizer.optimize(samples.o_advanced2, Optimizer.levels.ST_O1, Optimizer.flags.ST_O_PRIORITY_DSC);
        expect(first[0]).to.have.property('name', 'e3');
        var second = Optimizer.optimize(samples.o_advanced2, Optimizer.levels.ST_O1, Optimizer.flags.ST_O_PRIORITY_ASC);
        expect(second[0]).to.have.property('name', 'e2');
    });
    it('should gracefully handle a -1 priority', function() {
        var special_sample = samples.o_advanced2;
        special_sample[1].priority = -1;
        
        var first = Optimizer.optimize(special_sample, Optimizer.levels.ST_O1, Optimizer.flags.ST_O_PRIORITY_DSC);
        expect(first[0]).to.have.property('name', 'e3');
        var second = Optimizer.optimize(special_sample, Optimizer.levels.ST_O1, Optimizer.flags.ST_O_PRIORITY_ASC);
        expect(second[0]).to.have.property('name', 'e1');
    });
});