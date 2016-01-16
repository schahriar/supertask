var async = require('async');
var chalk = require('chalk');
var mocha = require('mocha');
var chai = require("chai");
var expect = chai.expect;
var inspect = require("util").inspect;

function noop() { return; }
function m(a, b, callback) { callback(null, a * b); }
function r(callback) { callback(null, 'r'); }

function SIGN_COLOR(value, threshold, inverse) {
    var scavenge = value, color = "black";
    // If value is string account for single character pre/postfix (very specific/awful implementation)
    if (typeof value === 'string') {
        // Ignore First & Last Chars
        if (typeof value[0] === 'string') value = value.substring(1);
        if (typeof value[value.length - 1] === 'string') value = value.substr(0, scavenge.length - 2);
        // Ends with MS
        if (value.slice(-2) === 'ms') value = value.substr(0, scavenge.length - 3);
        value = parseFloat(value);
    }
    if (!threshold) threshold = 0;
    if (inverse) color = (value > threshold) ? 'red' : ((value < threshold) ? 'green' : 'yellow');
    else color = (value > threshold) ? 'green' : ((value < threshold) ? 'red' : 'yellow');

    return chalk[color](scavenge);
}

function NANO_TO_MS(val, decimals) {
    var m = Math.pow(10, (decimals || 3));
    return Math.round((val / 1e+6) * m) / m;
}

function REDUCE_STATS(array) {
    var MIN = Math.min.apply(Math, array), MAX = Math.max.apply(Math, array);
    var SUM = array.reduce(function (a, b) { return a + b; });
    var AVG = SUM / array.length;
    for (var i = 0; i < array.length; i++) {

    }
    return {
        min: MIN,
        max: MAX,
        average: AVG,
        error: Math.round((Math.abs(AVG - MIN) / Math.abs(MIN) + Math.abs(AVG - MAX) / Math.abs(MAX)) / 2 * 100000) / 1000,
        sum: SUM,
        total: array.length
    };
}

function _BENCH(func, options, stats) {
    return function _BENCHMARK(callback) {
        function BENCHMARK_CALLBACK(unique_callback) {
            var started = process.hrtime();
            return function BENCHMARK_CALLBACK__FUNC(error) {
                var finished = process.hrtime(started);
                // Calculate Time Difference
                var diff = finished[0] * 1e9 + finished[1];
                // Push difference to stats
                stats.push(diff);
                setImmediate(function () {
                    unique_callback(error, stats);
                });
            };
        }
        if (options.parallel) {
            // Parallelize on all cores
            async.times(options.parallel, function (n, parallel_callback) {
                func(BENCHMARK_CALLBACK(parallel_callback));
            }, callback);
        } else {
            func(BENCHMARK_CALLBACK(callback));
        }
    };
}

function MAKE_COMPARE() {
    var args = Array.prototype.slice.call(arguments);
    var callback = args.pop();
    var options = args.pop();
    var prepare = args.shift();
    var count = 0;
    var stats = new Map();
    var fns = args;
    for (var i = 0; i < args.length; i++) {
        stats.set(i, []);
    }
    var Total_Started = process.hrtime();
    async.doWhilst(function BENCHMARK_WRAPPER(callback) {
        count++;
        var i = 0;
        // Alternate
        async.each(fns, function(fn, cb) {
            prepare(i);
            _BENCH(fn, options, stats.get(i))(cb);
            i++;
        }, callback);
    }, function BENCHMARK_ITERATOR() {
        return count < (options.iterations || 10);
    }, function BENCHMARK_RESULTS(error) {
        var Reduced = [];
        for(var i = 0; i < stats.size; i++) {
            Reduced.push({
                name: fns[i].name,
                stats: REDUCE_STATS(stats.get(i))
            });
        }
        var Total_Finished = process.hrtime(Total_Started);
        // Calculate Time Difference
        var overall = [(Total_Finished[0] * 1e9 + Total_Finished[1]), Reduced[0].stats.total];
        var args = [error, overall];
        args = args.concat(Reduced);
        callback.apply(null, args);
    });
}

function BENCHMARK() {
    var args = Array.prototype.slice.call(arguments);
    var options = args[args.length - 1];
    var name = args.shift();
    return function (callback) {
        args.push(function () {
            var args = Array.prototype.slice.call(arguments);
            var error = args.shift();
            var overall = args.shift();
            LOG("\n" + chalk.green('-'), chalk.white("BENCHMARK ::"), chalk.cyan(name), '\n');
            if (error) {
                LOG(chalk.red("> BENCHMARKS FAILED <"));
                console.trace(error);
            } else {
                if (options.realParallel) LOG("\t" + chalk.cyan("PARALLEL @" + options.parallel));
                var best = { v: Infinity, name: 'Unknown' };
                for(var i = 0; i < args.length; i++) {
                    var func = args[i];
                    LOG("\t" + chalk.white(func.name), "averaged at", Math.round(1e9/func.stats.average) + ' ops/sec', SIGN_COLOR("±" + func.stats.error + '%', options.threshold || ERROR_THRESHOLD, true));
                    LOG("\tWorst Case:", NANO_TO_MS(func.stats.max) + 'ms', "Best Case:", NANO_TO_MS(func.stats.min) + 'ms');
                    LOG();
                    if(func.stats.average < best.v) {
                        best.v = func.stats.average;
                        best.name = func.name;
                    }
                }
                LOG('Best', chalk.green(best.name));
                LOG("Total time:", NANO_TO_MS(overall[0]) + 'ms', "for", overall[1], "rounds");
            }
            LOG();
            callback();
        });
        MAKE_COMPARE.apply(null, args);
    };
}

function LOG() {
    // Mocha ident
    var prepend = "    ";
    var args = Array.prototype.slice.call(arguments);
    args.unshift(prepend);
    args = args.map(function (v) {
        // Add prepend after all new lines created with \n\r ...
        if (typeof v === 'string') v = v.replace(/(?:\r\n|\r|\n)/g, "\n" + prepend);
        return chalk.gray(v);
    });
    console.log.apply(console, args);
}

var Benchmark = require('benchmark');
var SYNC_BENCHER = function () {
    var args = Array.prototype.slice.call(arguments);
    var name = args.shift();
    var setup = args.shift();
    var suite = new Benchmark.Suite({
        setup: setup
    });
    for (var i = 0; i < args.length; i++) {
        if (typeof args[i] === 'function') suite.add(args[i].name, { defer: (args[i].toString().indexOf("deferred.resolve") !== -1), fn: args[i] });
    }
    return function (callback) {
        LOG("\n" + chalk.green('-'), chalk.white("BENCHMARK ::"), chalk.cyan(name || 'Unknown'));
        suite.on('cycle', function (event) {
            LOG('\t' + String(event.target));
        })
        .on('error', function () {
            LOG(chalk.red(" Error"), arguments);
        })
        .on('complete', function () {
            LOG('Best ' + chalk.green(this.filter('fastest').map('name')));
            callback();
        })
        .run({ async: true });
    };
};

var SuperTask = require('../interface');
var HybridSort = require('../lib/HybridSort');
var TaskManager;
var BenchmarkArray = [];

var ERROR_THRESHOLD = 10;

describe("Benchmark Suite", function () {
    this.timeout(200000);
    after(function (done) {
        var CompareFunction = function (a, b) { return (a.value < b.value); };
        async.series([
            SYNC_BENCHER('Sort Compare', function () {
                BenchmarkArray = Array.apply(null, Array(10000)).map(function (v, i) {
                    return { value: Math.round(Math.random() * 100000) }; // Random up to 100k
                });
            }, function V8_SORT() {
                BenchmarkArray.sort(CompareFunction);
            }, function Hybrid_Sort() {
                HybridSort.sort(BenchmarkArray, CompareFunction);
            }, function Hybrid_Bucket_Only() {
                HybridSort.sort(BenchmarkArray, CompareFunction, HybridSort.BUCKETSORT);
            }),
            BENCHMARK('Optimization Levels', function(LEVEL) {
                TaskManager.setOptimization(SuperTask['ST_O' + LEVEL]);
            }, function OPTIMIZATION_LEVEL_0(callback) { 
                TaskManager.do('benchMath', 8, 12, function(error, r){
                    if(r!==96) error = new Error("Bad Math");
                    callback(error);
                });
            }, function OPTIMIZATION_LEVEL_1(callback) {
                TaskManager.do('benchMath', 8, 12, function(error, r){
                    if(r!==96) error = new Error("Bad Math");
                    callback(error);
                });
            }, function OPTIMIZATION_LEVEL_2(callback) {
                TaskManager.do('benchMath', 8, 12, function(error, r){
                    if(r!==96) error = new Error("Bad Math");
                    callback(error);
                });
            }, { iterations: 400, threshold: 100, parallel: 40 }),
        ], done);
    });
    it('should init', function () {
        TaskManager = new SuperTask();
    });
    it('should add a new local task', function (done) {
        TaskManager.addLocal('benchMath', function (a, b, callback) {
            callback(null, a * b);
        }, function(error, task) {
            done(error);
        });
    });
});