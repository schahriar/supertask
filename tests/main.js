var chai = require("chai");
var expect = chai.expect;
var inspect = require("util").inspect;

var SuperTask = require('../supertask');
var TaskManager;
var exec = 0;
var averager = { prev: 0, current: 0 };

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
});