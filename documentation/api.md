<a name="SuperTask"></a>
## SuperTask
**Kind**: global class  

* [SuperTask](#SuperTask)
    * [new SuperTask()](#new_SuperTask_new)
    * _instance_
        * [.addLocal(name, taskFunction, callback)](#SuperTask+addLocal)
        * [.addForeign(name, taskFunction, callback)](#SuperTask+addForeign)
        * [.addShared(name, taskFunction, handler, callback)](#SuperTask+addShared)
        * [.do(...arguments, callback)](#SuperTask+do)
        * [.remove(name)](#SuperTask+remove) ⇒ <code>Boolean</code>
        * [.has(name)](#SuperTask+has) ⇒ <code>Boolean</code>
        * [.get(name)](#SuperTask+get) ⇒ <code>Object</code>
        * [.setOptimization(O_LEVEL)](#SuperTask+setOptimization)
        * [.setFlags(O_MASK)](#SuperTask+setFlags)
        * [.timeout([duration])](#SuperTask+timeout) ⇒ <code>Number</code>
    * _static_
        * [.ST_NONE](#SuperTask.ST_NONE)
        * [.ST_RESTRICTED](#SuperTask.ST_RESTRICTED)
        * [.ST_MINIMAL](#SuperTask.ST_MINIMAL)
        * [.ST_UNRESTRICTED](#SuperTask.ST_UNRESTRICTED)
        * [.ST_O_AET_ASC](#SuperTask.ST_O_AET_ASC)
        * [.ST_O_AET_DSC](#SuperTask.ST_O_AET_DSC)
        * [.ST_O_PRIORITY_ASC](#SuperTask.ST_O_PRIORITY_ASC)
        * [.ST_O_PRIORITY_DSC](#SuperTask.ST_O_PRIORITY_DSC)
        * [.ST_O_ER_ASC](#SuperTask.ST_O_ER_ASC)
        * [.ST_O_ER_DSC](#SuperTask.ST_O_ER_DSC)
        * [.ST_O_SORT_BUCKETONLY](#SuperTask.ST_O_SORT_BUCKETONLY)
        * [.ST_O_SORT_QUICKONLY](#SuperTask.ST_O_SORT_QUICKONLY)
        * [.ST_O0](#SuperTask.ST_O0)
        * [.ST_O1](#SuperTask.ST_O1)
        * [.ST_O2](#SuperTask.ST_O2)


-

<a name="new_SuperTask_new"></a>
### new SuperTask()
Creates new instance.

**Returns**: <code>Instance</code> - Returns a new instance of the module.  
**Example**  
```js
var SuperTask = require('supertask');var TaskManager = new SuperTask();
```

-

<a name="SuperTask+addLocal"></a>
### superTask.addLocal(name, taskFunction, callback)
Creates a new local Task. A local task is a task that is notshared by any outside entity and usually performs slightlyfaster than shared or foreign tasks as there is no compilationor try/catch involved.

**Kind**: instance method of <code>[SuperTask](#SuperTask)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | A unique name for this Task. |
| taskFunction | <code>function</code> | The JS function of the Task. |
| callback | <code>function</code> | Called once the task is added with parameters `error` and `task`. |


-

<a name="SuperTask+addForeign"></a>
### superTask.addForeign(name, taskFunction, callback)
Creates a new foreign Task. A local task is a task that is notshared by any outside entity and usually performs slightlyfaster than shared or foreign tasks as there is no compilationor try/catch involved.

**Kind**: instance method of <code>[SuperTask](#SuperTask)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | A unique name for this Task. |
| taskFunction | <code>function</code> | The JS function or source with module.exports to be used as the function. Note that sources are compiled to a function before use with about a 30ms overhead on the first call unless precompile method of task is called beforehand. |
| callback | <code>function</code> | Called once the task is added with parameters `error` and `task`. |


-

<a name="SuperTask+addShared"></a>
### superTask.addShared(name, taskFunction, handler, callback)
Creates a shared Task. By default this is merely a directivebut can be used with a function handler to build shared taskson top of this module.

**Kind**: instance method of <code>[SuperTask](#SuperTask)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | A unique name for this Task. |
| taskFunction | <code>String</code> &#124; <code>function</code> | The JS function or source with module.exports to be used as the function. |
| handler | <code>function</code> | A function that is called to execute this Task. |
| callback | <code>function</code> | Called once the task is added with parameters `error` and `task`. |


-

<a name="SuperTask+do"></a>
### superTask.do(...arguments, callback)
Run a task with the given arguments

**Kind**: instance method of <code>[SuperTask](#SuperTask)</code>  

| Param | Type | Description |
| --- | --- | --- |
| ...arguments | <code>\*</code> | Arguments that are passed to the Task. You can call this function with any number of arguments so long as the last argument is the callback. |
| callback | <code>function</code> | The callback that handles the response. Note that the callback parameters are based on what the function calls the callback with but will include `error` as the first parameter as per usual NodeJS async calls. |


-

<a name="SuperTask+remove"></a>
### superTask.remove(name) ⇒ <code>Boolean</code>
Remove a task.

**Kind**: instance method of <code>[SuperTask](#SuperTask)</code>  
**Returns**: <code>Boolean</code> - - Returns true if taskexisted and was removed or false if task did not exist  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | Name of the task. |


-

<a name="SuperTask+has"></a>
### superTask.has(name) ⇒ <code>Boolean</code>
Check if task exists.

**Kind**: instance method of <code>[SuperTask](#SuperTask)</code>  
**Returns**: <code>Boolean</code> - exists  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | Name of the task. |


-

<a name="SuperTask+get"></a>
### superTask.get(name) ⇒ <code>Object</code>
Get a wrapped version of the task.

**Kind**: instance method of <code>[SuperTask](#SuperTask)</code>  
**Returns**: <code>Object</code> - task  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | Name of the task. |


-

<a name="SuperTask+setOptimization"></a>
### superTask.setOptimization(O_LEVEL)
Set Cargo/Queue optimization level used to indicate which propertiesare used to sort the order of execution. Optimization levels areattached to the module as properties. Use [SuperTaskCluster#setFlags](SuperTaskCluster#setFlags)to set order and optimization flags individually.

**Kind**: instance method of <code>[SuperTask](#SuperTask)</code>  

| Param | Type | Description |
| --- | --- | --- |
| O_LEVEL | <code>Enum</code> | Optimization Level |

**Example**  
```js
var SuperTask = require('supertask');var TaskManager = new SuperTask();TaskManager.setOptimization(SuperTask.ST_O0); // No OptimizationsTaskManager.setOptimization(SuperTask.ST_O1); // Sort based on priorityTaskManager.setOptimization(SuperTask.ST_O2); // Additonally Sort based on averageExecutionTime & executionRounds
```

-

<a name="SuperTask+setFlags"></a>
### superTask.setFlags(O_MASK)
Set Cargo/Queue optimization flags used to indicate the order of properties.Optimization flags are attached to the module as properties.

**Kind**: instance method of <code>[SuperTask](#SuperTask)</code>  

| Param | Type | Description |
| --- | --- | --- |
| O_MASK | <code>Enum</code> | Optimization Bitwise Mask |

**Example**  
```js
var SuperTask = require('supertask');var TaskManager = new SuperTask();TaskManager.setFlags(ST_O_PRIORITY_ASC | ST_O_AET_DSC); // Priority Ascendng & (bitwise OR) averageExecutionTime descending
```

-

<a name="SuperTask+timeout"></a>
### superTask.timeout([duration]) ⇒ <code>Number</code>
Sets/Gets timeout value. A timeout indicates the maximumamount of time that the Cargo/Queue will stop before movingforward for an async function. This does not halt theexecution but will rather call the callback with a timeouterror.

**Kind**: instance method of <code>[SuperTask](#SuperTask)</code>  
**Returns**: <code>Number</code> - timeout  

| Param | Type | Description |
| --- | --- | --- |
| [duration] | <code>Number</code> | Timeout duration in m/s (defaults to 1000) |


-

<a name="SuperTask.ST_NONE"></a>
### SuperTask.ST_NONE
No permissions. Code runs JS only.

**Kind**: static property of <code>[SuperTask](#SuperTask)</code>  

-

<a name="SuperTask.ST_RESTRICTED"></a>
### SuperTask.ST_RESTRICTED
Some permissions. Allows streams, Buffer, setTimeout, setInterval only

**Kind**: static property of <code>[SuperTask](#SuperTask)</code>  

-

<a name="SuperTask.ST_MINIMAL"></a>
### SuperTask.ST_MINIMAL
Minimal permissions. Allows all restricted permissions and __dirname, __filename, console globals.Includes a limited require('*') function with access to 'http', 'https', 'util', 'os', 'path', 'events', 'stream', 'string_decoder', 'url', 'zlib'

**Kind**: static property of <code>[SuperTask](#SuperTask)</code>  

-

<a name="SuperTask.ST_UNRESTRICTED"></a>
### SuperTask.ST_UNRESTRICTED
UNSAFE, All permissions. Copies global scope.

**Kind**: static property of <code>[SuperTask](#SuperTask)</code>  

-

<a name="SuperTask.ST_O_AET_ASC"></a>
### SuperTask.ST_O_AET_ASC
Flag to set Average Execution Time (AET) to Ascending see [SuperTaskCluster#setFlags](SuperTaskCluster#setFlags)

**Kind**: static property of <code>[SuperTask](#SuperTask)</code>  

-

<a name="SuperTask.ST_O_AET_DSC"></a>
### SuperTask.ST_O_AET_DSC
Flag to set Average Execution Time (AET) to Descending

**Kind**: static property of <code>[SuperTask](#SuperTask)</code>  

-

<a name="SuperTask.ST_O_PRIORITY_ASC"></a>
### SuperTask.ST_O_PRIORITY_ASC
Flag to set Priority to Ascending

**Kind**: static property of <code>[SuperTask](#SuperTask)</code>  

-

<a name="SuperTask.ST_O_PRIORITY_DSC"></a>
### SuperTask.ST_O_PRIORITY_DSC
Flag to set Priority to Descending

**Kind**: static property of <code>[SuperTask](#SuperTask)</code>  

-

<a name="SuperTask.ST_O_ER_ASC"></a>
### SuperTask.ST_O_ER_ASC
Flag to set Execution Rounds (ER) to Ascending

**Kind**: static property of <code>[SuperTask](#SuperTask)</code>  

-

<a name="SuperTask.ST_O_ER_DSC"></a>
### SuperTask.ST_O_ER_DSC
Flag to set Execution Rounds (ER) to Descending

**Kind**: static property of <code>[SuperTask](#SuperTask)</code>  

-

<a name="SuperTask.ST_O_SORT_BUCKETONLY"></a>
### SuperTask.ST_O_SORT_BUCKETONLY
Flag to use BucketSort as the only sorting method. (UNSAFE, can cause buffer overflow)

**Kind**: static property of <code>[SuperTask](#SuperTask)</code>  

-

<a name="SuperTask.ST_O_SORT_QUICKONLY"></a>
### SuperTask.ST_O_SORT_QUICKONLY
Flag to use QuickSort as the only sorting method. (Slower than default but uses less memory)

**Kind**: static property of <code>[SuperTask](#SuperTask)</code>  

-

<a name="SuperTask.ST_O0"></a>
### SuperTask.ST_O0
Disables optimizations see [SuperTaskCluster#setLevel](SuperTaskCluster#setLevel)

**Kind**: static property of <code>[SuperTask](#SuperTask)</code>  

-

<a name="SuperTask.ST_O1"></a>
### SuperTask.ST_O1
Enables priority only optimizations see [SuperTaskCluster#setLevel](SuperTaskCluster#setLevel)

**Kind**: static property of <code>[SuperTask](#SuperTask)</code>  

-

<a name="SuperTask.ST_O2"></a>
### SuperTask.ST_O2
Enables AET, ER and priority optimizations see [SuperTaskCluster#setLevel](SuperTaskCluster#setLevel)

**Kind**: static property of <code>[SuperTask](#SuperTask)</code>  

-

