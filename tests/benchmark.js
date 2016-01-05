var async = require('async');
var chalk = require('chalk');
var mocha = require('mocha');
var chai = require("chai");
var expect = chai.expect;
var inspect = require("util").inspect;

function m(a, b, callback){ callback(null, a*b); }
function r(callback) { callback(null, 'r'); }

function SIGN_COLOR(value, threshold, inverse) {
    var scavenge = value, color = "black";
    // If value is string account for single character pre/postfix (very specific/awful implementation)
    if(typeof value === 'string') {
        // Ignore First & Last Chars
        if(typeof value[0] === 'string') value = value.substring(1);
        if(typeof value[value.length - 1] === 'string') value = value.substr(0, scavenge.length - 2);
        // Ends with MS
        if(value.slice(-2) === 'ms') value = value.substr(0, scavenge.length - 3);
        value = parseFloat(value);
    }
    if(!threshold) threshold = 0;
    if(inverse) color = (value > threshold)?'red':((value < threshold)?'green':'yellow');
    else color = (value > threshold)?'green':((value < threshold)?'red':'yellow');
    
    return chalk[color](scavenge);
}

function NANO_TO_MS(val, decimals) {
    var m = Math.pow(10, (decimals || 3));
    return Math.round((val/1e+6) * m)/m;
}

function REDUCE_STATS(array) {
    var MIN = Math.min.apply(Math, array), MAX = Math.max.apply(Math, array);
    var SUM = array.reduce(function(a, b) { return a + b; });
    var AVG = SUM / array.length;
    for(var i=0; i<array.length; i++) {
        
    }
    return {
        min: MIN,
        max: MAX,
        average: AVG,
        error: Math.round((Math.abs(AVG - MIN)/Math.abs(MIN) + Math.abs(AVG - MAX)/Math.abs(MAX))/2 * 100000)/1000,
        sum: SUM,
        total: array.length
    };
}

function MAKE_BENCHMARK(func, options, callback) {
    var count = 0;
    var stats = [];
    var Total_Started = process.hrtime();
    async.doWhilst(function BENCHMARK_WRAPPER(callback){
        count++;
        function BENCHMARK_CALLBACK(unique_callback){
            var started = process.hrtime();
            return function BENCHMARK_CALLBACK__FUNC(error) {
                var finished = process.hrtime(started);
                // Calculate Time Difference
                var diff = finished[0] * 1e9 + finished[1];
                // Push difference to stats
                stats.push(diff);
                unique_callback(error, stats);
            };
        }
        if(options.parallel) {
            // Parallelize on all cores
            async.times(options.parallel, function(n, parallel_callback){
                func(BENCHMARK_CALLBACK(parallel_callback));
            }, callback);
        }else{
            func(BENCHMARK_CALLBACK(callback));
        }
    }, function BENCHMARK_ITERATOR(){
        return count < (options.iterations || 10);
    }, function BENCHMARK_RESULTS(error){
        var Reduced = REDUCE_STATS(stats);
        var Total_Finished = process.hrtime(Total_Started);
        // Calculate Time Difference
        Reduced.overall = Total_Finished[0] * 1e9 + Total_Finished[1];
        callback(error, Reduced);
    });
}

function BENCHMARK(func, options) {
    function LOG() {
        // Mocha ident
        var prepend = "    ";
        var args = Array.prototype.slice.call(arguments);
        args.unshift(prepend);
        args = args.map(function(v){
            // Add prepend after all new lines created with \n\r ...
            if(typeof v === 'string') v = v.replace(/(?:\r\n|\r|\n)/g, "\n" + prepend);
            return chalk.gray(v);
        });
        console.log.apply(console, args);
    }
    return function(callback) {
        MAKE_BENCHMARK(func, options, function(error, stats) {
            LOG("\n" + chalk.green('-'),chalk.white("BENCHMARK RESULTS FOR"), chalk.cyan(func.name || 'Unknown'));
            if(error) {
            LOG(chalk.red("> BENCHMARK FAILED <"));
            console.trace(error);
            }else{
                if(options.realParallel) LOG("\t" + chalk.cyan("PARALLEL @" + options.parallel));
                LOG("\tAveraged at", NANO_TO_MS(stats.average) + 'ms', SIGN_COLOR("±" + stats.error + '%', options.threshold || ERROR_THRESHOLD, true));
                LOG("\tWorst Case:", NANO_TO_MS(stats.max) + 'ms', "Best Case:", NANO_TO_MS(stats.min) + 'ms');
                LOG("\tTotal time:", NANO_TO_MS(stats.overall) + 'ms', "for", stats.total, "rounds");
            }
            LOG();
            callback();
        });
    };
}

var SuperTask = require('../supertask');
var HybridSort = require('../lib/HybridSort');
var TaskManager;
var BenchmarkArrays = [];

var ERROR_THRESHOLD = 10;

describe("Benchmark Suite", function() {
    this.timeout(20000);
    after(function(done) {
        var CompareFunction = function(a,b) { return (a.value < b.value); };
        async.waterfall([
        BENCHMARK(function V8_Sort(callback){
            BenchmarkArrays[0].sort(CompareFunction);
            callback();
        }, { iterations: 50, threshold: 400 }),
        BENCHMARK(function Hybrid_Sort(callback){
            HybridSort.sort(BenchmarkArrays[1], CompareFunction);
            callback();
        }, { iterations: 50, threshold: 400 }),
        BENCHMARK(function Hybrid_Bucket_Only_Sort(callback){
            HybridSort.sort(BenchmarkArrays[2], CompareFunction, HybridSort.BUCKETSORT);
            callback();
        }, { iterations: 50, threshold: 400 }),
        BENCHMARK(function DO(callback){
            TaskManager.do('benchMath', 8, 12); 
            callback();
        }, { iterations: 10, threshold: 400, parallel: 12000 })
        
        ], function(){
            setTimeout(done, 1000);
        });
    });
    it('should init', function() {
        TaskManager = new SuperTask();
    });
    it('should add a new local task', function(done) {
        TaskManager.addLocal('benchMath', function(a, b, callback) {
            callback(null, a*b);
        }, done);
    });
    it('should fill benchmark array', function() {
        for(i=0; i<5; i++) {
            BenchmarkArrays[i] = Array.apply(null, Array(10000)).map(function(v, i) {
                return { value: Math.round(Math.random() * 100000) }; // Random up to 100k
            });
        }
    });
});