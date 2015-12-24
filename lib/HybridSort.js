// - Sorting algorithm -

// This is essentially a bucket sort and quicksort hybrid
// whereby the best algorithm is set based on the size
// of the array.
// (further optimizationa are possible outside this function)

var T_BUCKETSORT = 0, T_QUICKSORT = 1;
var rounds = 0;

var BUCKETSORT = function METHOD_BUCKETSORT(array, func) {
    if (array.length === 0) return array;
    
    var left = [];
    var right = [];

    var current = 0;
    var next = array.pop();
    
    for (var i = 0; i < array.length; i++) {
        current = array[i];
        if (func(current, next)) left.push(current);
        else right.push(current);
    }
    
    return METHOD_BUCKETSORT(left, func).concat(next, METHOD_BUCKETSORT(right, func));
};

var QUICKSORT = function METHOD_QUICKSORT(array, func) {
    // V8 Internal Array#sort uses QuickSort
    return array.sort(func);
};

var HYBRIDSORT = function HYBRID_SORT(array, func, algorithm) {
    // Return Array if it doesn't require sorting
    if (array.length <= 1) return array;

    /* Repetitively running the bucket sort implemented
        above will cause high memory usage as the recursive
        function creates two arrays on every call which may
        be neglected by the GC to save CPU cycles thus
        increasing memory usage if tasks pushed to the Cargo
        are fully sync.
        
        Note that this can be directly overridden 
    */
    // Determine best sorting algorithm
    algorithm = algorithm || ((array.length > 800)?T_QUICKSORT:T_BUCKETSORT);
    // Run Sort
    if (algorithm === T_QUICKSORT) return QUICKSORT(array, func);
    if (algorithm === T_BUCKETSORT) return BUCKETSORT(array, func);
    
    // Algorithm not determined (WARN)
    console.warn('Algorithm not determined');
    return array;
};

module.exports = {
    sort: HYBRIDSORT,
    BUCKETSORT: T_BUCKETSORT,
    QUICKSORT: T_QUICKSORT
};
