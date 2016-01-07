## Classes

<dl>
<dt><a href="#SuperTask">SuperTask</a></dt>
<dd></dd>
<dt><a href="#Task">Task</a></dt>
<dd></dd>
</dl>

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
Set Cargo/Queue optimization level used to indicate which propertiesare used to sort the order of execution. Optimization levels areattached to the module as properties. Use [#SuperTask+setFlags](#SuperTask+setFlags)to set order and optimization flags individually.

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
Flag to set Average Execution Time (AET) to Ascending [setFlags](#SuperTask+setFlags)

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
Disables optimizations see [setOptimization](#SuperTask+setOptimization)

**Kind**: static property of <code>[SuperTask](#SuperTask)</code>  

-

<a name="SuperTask.ST_O1"></a>
### SuperTask.ST_O1
Enables priority only optimizations see [setOptimization](#SuperTask+setOptimization)

**Kind**: static property of <code>[SuperTask](#SuperTask)</code>  

-

<a name="SuperTask.ST_O2"></a>
### SuperTask.ST_O2
Enables AET, ER and priority optimizations see [setOptimization](#SuperTask+setOptimization)

**Kind**: static property of <code>[SuperTask](#SuperTask)</code>  

-

<a name="Task"></a>
## Task
**Kind**: global class  

* [Task](#Task)
    * [new Task()](#new_Task_new)
    * [.permission([permission])](#Task+permission) ⇒ <code>SuperTaskPermissionFlag</code>
    * [.context([context])](#Task+context) ⇒ <code>Object</code>
    * [.priority([priority])](#Task+priority) ⇒ <code>Number</code>
    * [.sandbox([sandboxed])](#Task+sandbox) ⇒ <code>Boolean</code>
    * [.call([...arguments], callback)](#Task+call)
    * [.apply(context, arguments, callback)](#Task+apply)
    * [.precompile(context)](#Task+precompile)


-

<a name="new_Task_new"></a>
### new Task()
Created through [addLocal](#SuperTask+addLocal), [addShared](#SuperTask+addShared) and [get](#SuperTask+get) methods.


-

<a name="Task+permission"></a>
### task.permission([permission]) ⇒ <code>SuperTaskPermissionFlag</code>
Gets/Sets permission of the Task based on the given SuperTaskPermissionFlagsuch as [SuperTask#ST_NONE](SuperTask#ST_NONE) or [SuperTask#ST_MINIMAL](SuperTask#ST_MINIMAL).

**Kind**: instance method of <code>[Task](#Task)</code>  
**Returns**: <code>SuperTaskPermissionFlag</code> - access  

| Param | Type | Description |
| --- | --- | --- |
| [permission] | <code>SuperTaskPermissionFlag</code> | Permission of the Task. |

**Example**  
```js
var SuperTask = require('supertask');var TaskManager = new SuperTask();TaskManager.addLocal('minimaltask', function(callback) { setTimeout(callback, 1000); }, function(error, task) {     task.permission(SuperTask.ST_MINIMAL);});
```

-

<a name="Task+context"></a>
### task.context([context]) ⇒ <code>Object</code>
Gets/Sets context of the Task. Context is not the same asa local function context (this). This context is the VM'scontext such as globals. Check out NodeJS's VM core modulefor more info.

**Kind**: instance method of <code>[Task](#Task)</code>  
**Returns**: <code>Object</code> - context  

| Param | Type | Description |
| --- | --- | --- |
| [context] | <code>Object</code> | Context of the Task. |

**Example**  
```js
var SuperTask = require('supertask');var TaskManager = new SuperTask();TaskManager.addLocal('ctask', function(callback) { callback(null, this.test); }, function(error, task) {     task.context({ test: 'yes' });     TaskManager.do('ctask', function(error, r1){         console.log(r1);         // Output: yes     })});
```

-

<a name="Task+priority"></a>
### task.priority([priority]) ⇒ <code>Number</code>
Gets/Sets Task's priority that determines order of executionin optimizations. To disable property set optimization levelto [SuperTask#ST_0](SuperTask#ST_0). To change order of priority use[SuperTask#ST_O_PRIORITY_ASC](SuperTask#ST_O_PRIORITY_ASC) & [SuperTask#ST_O_PRIORITY_DSC](SuperTask#ST_O_PRIORITY_DSC)with [setFlags](#SuperTask+setFlags) method.

**Kind**: instance method of <code>[Task](#Task)</code>  
**Returns**: <code>Number</code> - priority  

| Param | Type | Description |
| --- | --- | --- |
| [priority] | <code>Number</code> | Priority of the Task. |


-

<a name="Task+sandbox"></a>
### task.sandbox([sandboxed]) ⇒ <code>Boolean</code>
Gets/Sets Task's isSanboxed property. If a task is sandboxedit is determined to be likely for it to throw therefore it iswrapped around a try/catch block. By default all no local tasksare sandboxed. Error that is caught is passed to callback as thefirst argument.

**Kind**: instance method of <code>[Task](#Task)</code>  
**Returns**: <code>Boolean</code> - sandboxed  

| Param | Type | Description |
| --- | --- | --- |
| [sandboxed] | <code>Boolean</code> | Sandbox property of the Task. |


-

<a name="Task+call"></a>
### task.call([...arguments], callback)
An internal replacement for [do](#SuperTask+do) function.

**Kind**: instance method of <code>[Task](#Task)</code>  

| Param | Type |
| --- | --- |
| [...arguments] | <code>arguments</code> | 
| callback | <code>function</code> | 


-

<a name="Task+apply"></a>
### task.apply(context, arguments, callback)
An extension to [do](#SuperTask+do) function. Enables passingof context as the first argument and call arguments as an array

**Kind**: instance method of <code>[Task](#Task)</code>  

| Param | Type | Description |
| --- | --- | --- |
| context | <code>Object</code> | Context of the Task. |
| arguments | <code>Array</code> | An array of arguments. |
| callback | <code>function</code> |  |


-

<a name="Task+precompile"></a>
### task.precompile(context)
Allows for precompilation of the Task to save execution timeon the first call. Note that to change the context you'llneed to precompile the task again. Context is preserved.

**Kind**: instance method of <code>[Task](#Task)</code>  

| Param | Type |
| --- | --- |
| context | <code>Object</code> | 


-

