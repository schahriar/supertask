// Internal Modules
var Hybrid = require('./HybridSort.js');
// Optimization levels
var ST_O0 = 1, ST_O1 = 2, ST_O2 = 4, ST_O3 = 8;
// Optimization flags (note that reversed flags are flipped with ~)
var ST_O_AET_ASC = 1 << 0,
    ST_O_AET_DSC = 1 << 1,
    ST_O_PRIORITY_ASC = 1 << 2,
    ST_O_PRIORITY_DSC = 1 << 3,
    ST_O_ER_ASC = 1 << 4,
    ST_O_ER_DSC = 1 << 5,
    ST_O_SORT_BUCKETONLY = 1 << 6,
    ST_O_SORT_QUICKONLY = 1 << 7;
// Properties to Extract (Numbers only)
/* - Property n represents name
   - Property i represents importance in decimal range 0.00 to 1.00
*/
var PROP = [
    { n: "averageExecutionTime", i: 0.80, rule: { asc: ST_O_AET_ASC, dsc: ST_O_AET_DSC } },
    { n: "executionRounds", i: 0.20, rule: { asc: ST_O_ER_ASC, dsc: ST_O_ER_DSC } }
];

var Optimizer = function ST_OPTIMIZER(array, O_LEVEL, O_MASK) {
    // Check O_LEVEL
    if(O_LEVEL & ST_O0) {
        // Optimization not required
        return array;
    }
    
    // Set M1 (MAX) & M2 (MIN)
    var M1 = {}, M2 = {};
    // Set Min/Max
    array.forEach(function ST_OPTIMIZER_ARRAY_MIN_MAX_SETTER(o) {
        /* Precalculte (max - min) to save cycles */
        /* Replace Foreach with for */
        var i = 0;
        for (i = 0; i < PROP.length; i++) {
            if ((!M1[PROP[i].n]) || (M1[PROP[i].n] < o[PROP[i].n])) {
                M1[PROP[i].n] = o[PROP[i].n] * 1;
            } else if ((!M2[PROP[i].n]) || (M2[PROP[i].n] > o[PROP[i].n])) {
                M2[PROP[i].n] = o[PROP[i].n] * 1;
            }
        }
    });
    // Map Array to Reduce Objects
    var OPTIMIZER_MAPPED_ARRAY = array.map(function ST_OPTIMIZER_ARRAY_MAPPER(o, index) {
        // Reduce Objects by Mapping the array
        var REDUCED_VALUE = 0;
        var i = 0;
        for (i = 0; i < PROP.length; i++) {
            /*
             Find position in max/min range.
             -- Formula -- (M1/M2 are interchangeable based on order)
                (value - M2)/(M1 - M2) * PROP[i].i
                ||
                0
            */
            // O_MASK ASC/DSC ORDER
            if((PROP[i].rule) && (O_MASK & PROP[i].rule.dsc)) {
                // Reverse Max/Min order
                REDUCED_VALUE += 
                (
                    (
                        (o[PROP[i].n] * 1 - M1[PROP[i].n]) /
                        (M2[PROP[i].n] - M1[PROP[i].n])
                    ) * PROP[i].i
                ) || 0;
            }else{
                // Keep original order
                REDUCED_VALUE += 
                (
                    (
                        (o[PROP[i].n] * 1 - M2[PROP[i].n]) /
                        (M1[PROP[i].n] - M2[PROP[i].n])
                    ) * PROP[i].i
                ) || 0;
            }
        }
        // Rounding Operation (4 decimal points)
        // Round & Set
        o.value = Math.round(REDUCED_VALUE * 10000) / 10000;
        return o;
    });
    // Sort
    OPTIMIZER_MAPPED_ARRAY = Hybrid.sort(OPTIMIZER_MAPPED_ARRAY, function ST_OPTIMIZER_SORTING_FUNC(a, b) {
        /* Add Flag Checks to Sort function */
        return (a.value < b.value);
    }, (O_MASK & ST_O_SORT_BUCKETONLY)?Hybrid.BUCKETSORT:(O_MASK & ST_O_SORT_QUICKONLY)?Hybrid.QUICKSORT:null);

    return OPTIMIZER_MAPPED_ARRAY;
};

module.exports = {
    optimize: Optimizer,
    properties: PROP,
    flags: {
        ST_O_AET_ASC: ST_O_AET_ASC,
        ST_O_AET_DSC: ST_O_AET_DSC,
        ST_O_PRIORITY_ASC: ST_O_PRIORITY_ASC,
        ST_O_PRIORITY_DSC: ST_O_PRIORITY_DSC,
        ST_O_ER_ASC: ST_O_ER_ASC,
        ST_O_ER_DSC: ST_O_ER_DSC,
        ST_O_SORT_BUCKETONLY: ST_O_SORT_BUCKETONLY,
        ST_O_SORT_QUICKONLY: ST_O_SORT_QUICKONLY
    },
    levels: {
        ST_O0: ST_O0,
        ST_O1: ST_O1,
        ST_O2: ST_O2,
        ST_O3: ST_O3
    }
};
