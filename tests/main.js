var chai = require("chai");
var expect = chai.expect;
var inspect = require("util").inspect;

var SuperTask = require('../supertask');
var TaskManager;
var exec = 0;
var averager = { prev: 0, current: 0 };

var ftasks = {
    t1: "var exec = 0; module.exports = function(a1, callback){ setTimeout(function(){callback(null, a1, ++exec);}, 10) };",
    t2: "module.exports = function(callback) { callback(); console.log('hey'); };"
};

describe('Test Suite', function(){
    it('should create a new instance', function() {
        TaskManager = new SuperTask();
    });
    it('should add a local task', function(done) {
        TaskManager.addLocal('test', function(callback) {
            exec++;
            callback(null, 'hey');
        }, function(error, task) {
            if(error) throw error;
            expect(task).to.have.property('local');
            done();
        });
    });
    it('should run a task', function(done) {
        TaskManager.do('test', {}, [], function(error, result) {
            if(error) throw error;
            expect(result).to.equal('hey');
            expect(exec).to.be.gte(1);
            averager.prev = this.lastDiff;
            done();
        });
    });
    it('should calculate average execution time', function(done) {
        TaskManager.do('test', {}, [], function(error, result) {
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
    it('should add a foreign task', function(done) {
        TaskManager.addForeignWithContext('foreign', ftasks.t1, { setTimeout: setTimeout }, function(error, task) {
            if(error) throw error;
            expect(task).to.have.property('sandboxed');
            done();
        });
    });
    it('should run a foreign task', function(done) {
        TaskManager.do('foreign', {}, ['HelloWorld'], function(error, a1, count) {
            if(error) throw error;
            expect(a1).to.equal('HelloWorld');
            expect(count).to.equal(1);
  
            done();
        });
    });
    it('should compile and cache a foreign task', function(done) {
        TaskManager.do('foreign', {}, ['HelloWorld'], function(error, a1, count) {
            if(error) throw error;
            expect(a1).to.equal('HelloWorld');
            expect(count).to.equal(2);
            expect(this.isCompiled).to.equal(true);
            done();
        });
    });
    it('should run a foreign task with unique context', function(done) {
        TaskManager.addForeign('foreignUnique', ftasks.t2, function(error, task) {
            if(error) throw error;
            TaskManager.do('foreignUnique', { console: { log: function(m){
                expect(m).to.equal("hey");
                done();
            }}});
        });
    });
    it('should allow foreign tasks as JS functions', function(done) {
        TaskManager.addForeign('foreignFunc', function(callback) {
            console.log('hey');
            callback();
        }, function(error, task) {
            if(error) throw error;
            TaskManager.do('foreignFunc', { console: { log: function(m){
                expect(m).to.equal("hey");
                done();
            }}});
        });
    });
    it('should queue tasks', function() {
        TaskManager.do('foreign', {}, ['HelloWorld']);
        expect(TaskManager.queue.length()).to.be.gte(1);
    });
    it('should queue tasks in parallel', function() {
        // Queue 5 times
        var i = 0;
        for(i=0; i<5; i++) {
            TaskManager.do('foreign', {}, ['HelloWorld']);
        }
        expect(TaskManager.queue.length()).to.be.gte(5);
    });
    it('should handle large parallel tasks', function(done) {
        this.timeout(10000);
        // Set max parallel to 5000
        TaskManager.queue.concurrency = 5000;
        // Queue 5000 times
        var i = 0;
        for(i=0; i<5000; i++) {
            TaskManager.do('foreign', {}, ['HelloWorld']);
        }
        expect(TaskManager.queue.length()).to.be.gte(5000);
        TaskManager.queue.drain = done;
    });
    it('should respect maximum parallel execution limit', function(done) {
        TaskManager.queue.concurrency = 10;
        var saturated = false;
        TaskManager.queue.saturated = function(){
            saturated = true;
        };
        // Queue 30 times
        var i = 0;
        for(i=0; i<30; i++) {
            TaskManager.do('foreign', {}, ['HelloWorld']);
        }
        expect(saturated).to.be.equal(true);
        TaskManager.queue.drain = done;
    });
});