## Classes

<dl>
<dt><a href="#SuperTask">SuperTask</a></dt>
<dd></dd>
<dt><a href="#Task">Task</a></dt>
<dd><p>Created through <a href="#SuperTask+addLocal">addLocal</a>, <a href="#SuperTask+addForeign">addForeign</a> and <a href="#SuperTask+get">get</a> methods.</p>
</dd>
</dl>

<a name="SuperTask"></a>
## SuperTask
**Kind**: global class  

* [SuperTask](#SuperTask)
    * [new SuperTask()](#new_SuperTask_new)
    * _instance_
        * [.addLocal(name, taskFunction)](#SuperTask+addLocal) ⇒
        * [.addForeign(name, taskFunction)](#SuperTask+addForeign) ⇒
        * [.do(taskName, ...arguments, callback)](#SuperTask+do)
        * [.apply(taskName, context, arguments, callback)](#SuperTask+apply)
        * [.remove(name)](#SuperTask+remove) ⇒ <code>Boolean</code>
        * [.has(name)](#SuperTask+has) ⇒ <code>Boolean</code>
        * [.get(name)](#SuperTask+get) ⇒ <code>Object</code>
    * _static_
        * [.ST_NONE](#SuperTask.ST_NONE)
        * [.ST_RESTRICTED](#SuperTask.ST_RESTRICTED)
        * [.ST_MINIMAL](#SuperTask.ST_MINIMAL)
        * [.ST_UNRESTRICTED](#SuperTask.ST_UNRESTRICTED)


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
### superTask.addLocal(name, taskFunction) ⇒
Creates a new local Task. A local task is a task that is notshared by any outside entity and usually performs slightlyfaster than shared or foreign tasks as there is no compilationor try/catch involved.

**Kind**: instance method of <code>[SuperTask](#SuperTask)</code>  
**Returns**: [Task](#Task)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | A unique name for this Task. |
| taskFunction | <code>function</code> | The JS function of the Task. |


-

<a name="SuperTask+addForeign"></a>
### superTask.addForeign(name, taskFunction) ⇒
Creates a new foreign Task. A local task is a task that is notshared by any outside entity and usually performs slightlyfaster than shared or foreign tasks as there is no compilationor try/catch involved.

**Kind**: instance method of <code>[SuperTask](#SuperTask)</code>  
**Returns**: [Task](#Task)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | A unique name for this Task. |
| taskFunction | <code>function</code> | The JS function or source with module.exports to be used as the function. Note that sources are compiled to a function before use with about a 30ms overhead on the first call unless precompile method of task is called beforehand. |


-

<a name="SuperTask+do"></a>
### superTask.do(taskName, ...arguments, callback)
Run a task with the given arguments

**Kind**: instance method of <code>[SuperTask](#SuperTask)</code>  

| Param | Type | Description |
| --- | --- | --- |
| taskName | <code>String</code> | Unique name of the task |
| ...arguments | <code>\*</code> | Arguments that are passed to the Task. You can call this function with any number of arguments so long as the last argument is the callback. |
| callback | <code>function</code> | The callback that handles the response. Note that the callback parameters are based on what the function calls the callback with but will include `error` as the first parameter as per usual NodeJS async calls. |


-

<a name="SuperTask+apply"></a>
### superTask.apply(taskName, context, arguments, callback)
Run a task with the given arguments and context (this)

**Kind**: instance method of <code>[SuperTask](#SuperTask)</code>  

| Param | Type | Description |
| --- | --- | --- |
| taskName | <code>String</code> | Unique name of the task |
| context | <code>Object</code> | Passes as (this.property). Note that `call`, `apply`, `name`, `recurse` are reserved properties. |
| arguments | <code>Array</code> | An array of arguments that are passed to the Task. |
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

<a name="Task"></a>
## Task
Created through [addLocal](#SuperTask+addLocal), [addForeign](#SuperTask+addForeign) and [get](#SuperTask+get) methods.

**Kind**: global class  

* [Task](#Task)
    * [.do](#Task+do)
    * [.permission([permission])](#Task+permission) ⇒ <code>SuperTaskPermissionFlag</code>
    * [.globals([globals])](#Task+globals) ⇒ <code>Object</code>
    * [.sandbox([sandboxed])](#Task+sandbox) ⇒ <code>Boolean</code>
    * [.call([...arguments], callback)](#Task+call)
    * [.apply(context, arguments, callback)](#Task+apply)
    * [.precompile(context)](#Task+precompile)


-

<a name="Task+do"></a>
### task.do
An alias for [call](#Task+call) function.

**Kind**: instance property of <code>[Task](#Task)</code>  

| Param | Type |
| --- | --- |
| [...arguments] | <code>arguments</code> | 
| callback | <code>function</code> | 


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

<a name="Task+globals"></a>
### task.globals([globals]) ⇒ <code>Object</code>
Gets/Sets global variables available to a the Task.

**Kind**: instance method of <code>[Task](#Task)</code>  
**Returns**: <code>Object</code> - globals  

| Param | Type | Description |
| --- | --- | --- |
| [globals] | <code>Object</code> | Globals of the Task. |

**Example**  
```js
var SuperTask = require('supertask');var TaskManager = new SuperTask();TaskManager.addLocal('ctask', function(callback) { callback(null, this.test); }, function(error, task) {     task.globals({ test: 'yes' });     TaskManager.do('ctask', function(error, r1){         console.log(r1);         // Output: yes     })});
```

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
An extension to [do](#SuperTask+do) function. Enables passingof call context (this) as the first argument followed by thecall arguments as an array

**Kind**: instance method of <code>[Task](#Task)</code>  

| Param | Type | Description |
| --- | --- | --- |
| context | <code>Object</code> | Context of the Task (this). |
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

