# LALib

Library of STScript commands.




- [Help](#lalib-help-group-Help) ([lalib?](#lalib-help-cmd-lalib_))
- [Boolean Operations](#lalib-help-group-Boolean_Operations) ([=](#lalib-help-cmd-_), [test](#lalib-help-cmd-test), [and](#lalib-help-cmd-and), [or](#lalib-help-cmd-or), [not](#lalib-help-cmd-not))
- [List Operations and Loops](#lalib-help-group-List_Operations_and_Loops) ([pop](#lalib-help-cmd-pop), [push](#lalib-help-cmd-push), [shift](#lalib-help-cmd-shift), [unshift](#lalib-help-cmd-unshift), [foreach](#lalib-help-cmd-foreach), [map](#lalib-help-cmd-map), [whilee](#lalib-help-cmd-whilee), [reduce](#lalib-help-cmd-reduce), [sorte](#lalib-help-cmd-sorte), [flatten](#lalib-help-cmd-flatten), [filter](#lalib-help-cmd-filter), [find](#lalib-help-cmd-find), [slice](#lalib-help-cmd-slice), [splice](#lalib-help-cmd-splice), [shuffle](#lalib-help-cmd-shuffle), [pick](#lalib-help-cmd-pick), [reverse](#lalib-help-cmd-reverse), [dict](#lalib-help-cmd-dict), [keys](#lalib-help-cmd-keys))
- [Split & Join](#lalib-help-group-Split_Join) ([split](#lalib-help-cmd-split), [join](#lalib-help-cmd-join))
- [Text Operations](#lalib-help-group-Text_Operations) ([trim](#lalib-help-cmd-trim), [pad-start](#lalib-help-cmd-pad_start), [pad-end](#lalib-help-cmd-pad_end), [pad-both](#lalib-help-cmd-pad_both), [diff](#lalib-help-cmd-diff), [json-pretty](#lalib-help-cmd-json_pretty), [substitute](#lalib-help-cmd-substitute), [wordcount](#lalib-help-cmd-wordcount), [sentencecount](#lalib-help-cmd-sentencecount), [segment](#lalib-help-cmd-segment))
- [Regular Expressions](#lalib-help-group-Regular_Expressions) ([re-escape](#lalib-help-cmd-re_escape), [re-test](#lalib-help-cmd-re_test), [re-replace](#lalib-help-cmd-re_replace), [re-exec](#lalib-help-cmd-re_exec))
- [Accessing & Manipulating Structured Data](#lalib-help-group-Accessing_Manipulating_Structured_Data) ([getat](#lalib-help-cmd-getat), [setat](#lalib-help-cmd-setat))
- [Exception Handling](#lalib-help-group-Exception_Handling) ([try](#lalib-help-cmd-try), [catch](#lalib-help-cmd-catch))
- [Null Handling](#lalib-help-group-Null_Handling) ([ifempty](#lalib-help-cmd-ifempty), [ifnullish](#lalib-help-cmd-ifnullish))
- [Copy & Download](#lalib-help-group-Copy_Download) ([copy](#lalib-help-cmd-copy), [download](#lalib-help-cmd-download))
- [DOM Interaction](#lalib-help-group-DOM_Interaction) ([dom](#lalib-help-cmd-dom))
- [Characters](#lalib-help-group-Characters) ([char-get](#lalib-help-cmd-char_get))
- [Group Chats](#lalib-help-group-Group_Chats) ([memberpos](#lalib-help-cmd-memberpos), [group-get](#lalib-help-cmd-group_get))
- [Conditionals - switch](#lalib-help-group-Conditionals_switch) ([switch](#lalib-help-cmd-switch), [case](#lalib-help-cmd-case))
- [Conditionals - if](#lalib-help-group-Conditionals_if) ([ife](#lalib-help-cmd-ife), [elseif](#lalib-help-cmd-elseif), [else](#lalib-help-cmd-else), [then](#lalib-help-cmd-then))
- [World Info](#lalib-help-group-World_Info) ([wi-list-books](#lalib-help-cmd-wi_list_books), [wi-list-entries](#lalib-help-cmd-wi_list_entries), [wi-activate](#lalib-help-cmd-wi_activate))
- [Costumes / Sprites](#lalib-help-group-Costumes_Sprites) ([costumes](#lalib-help-cmd-costumes))
- [Quick Replies](#lalib-help-group-Quick_Replies) ([qr-edit](#lalib-help-cmd-qr_edit), [qr-add](#lalib-help-cmd-qr_add))
- [Chat Messages](#lalib-help-group-Chat_Messages) ([swipes-get](#lalib-help-cmd-swipes_get), [swipes-get](#lalib-help-cmd-swipes_get), [swipes-list](#lalib-help-cmd-swipes_list), [swipes-count](#lalib-help-cmd-swipes_count), [swipes-index](#lalib-help-cmd-swipes_index), [swipes-add](#lalib-help-cmd-swipes_add), [swipes-del](#lalib-help-cmd-swipes_del), [swipes-go](#lalib-help-cmd-swipes_go), [swipes-swipe](#lalib-help-cmd-swipes_swipe), [message-edit](#lalib-help-cmd-message_edit), [message-move](#lalib-help-cmd-message_move))
- [Chat Management](#lalib-help-group-Chat_Management) ([chat-list](#lalib-help-cmd-chat_list), [chat-parent](#lalib-help-cmd-chat_parent), [message-on](#lalib-help-cmd-message_on), [message-off](#lalib-help-cmd-message_off), [message-listeners](#lalib-help-cmd-message_listeners), [role-swap](#lalib-help-cmd-role_swap))
- [Time & Date](#lalib-help-group-Time_Date) ([timestamp](#lalib-help-cmd-timestamp))
- [Async](#lalib-help-group-Async) ([fireandforget](#lalib-help-cmd-fireandforget))
- [Logging](#lalib-help-group-Logging) ([console-log](#lalib-help-cmd-console_log), [console-warn](#lalib-help-cmd-console_warn), [console-error](#lalib-help-cmd-console_error))
- [Audio](#lalib-help-group-Audio) ([sfx](#lalib-help-cmd-sfx))
- [Miscellaneous](#lalib-help-group-Miscellaneous) ([fonts](#lalib-help-cmd-fonts))
- [Web Requests](#lalib-help-group-Web_Requests) ([fetch](#lalib-help-cmd-fetch), [$](#lalib-help-cmd-_), [$$](#lalib-help-cmd-_))




## Requirements

- *(optional)* [Costumes Plugin](https://github.com/LenAnderson/SillyTavern-Costumes.git) for `/costumes` command.





## Commands



### <a id="lalib-help-group-Help"></a>Help


#### <a id="lalib-help-cmd-lalib_"></a>`/lalib?`
- `(slash|expressions)? = slash`  
 *(optional)* help topic

Lists LALib commands

##### **Examples**
```stscript
/lalib? |
// command documentation |
```
```stscript
/lalib? expressions |
// expressions documentation |
```



### <a id="lalib-help-group-Boolean_Operations"></a>Boolean Operations


#### <a id="lalib-help-cmd-_"></a>`/=`
- `...[expression variables:bool|closure|dictionary|list|number|string]?`  
 *(optional)* named arguments assigned to scoped variables to be used in the expression
- `...(string)`  
 boolean / arithmetic expression


Evaluates a boolean or arithmetic expression

See <a data-lalib-exec="/lalib? expressions"><code>/lalib? expressions</code></a> for more details
on expressions.

##### **Examples**
```stscript
/= true or false |
```
```stscript
/= 1 < 2 and ('a' in x or 'b' not in y) and !z |
```
```stscript
/= 1 + 2 * 3 ** 4 |
```
```stscript
/= (1 + 2) * 3 ** 4 |
```
```stscript

/genraw say either foo or bar |
/= result={{pipe}} ('foo' in result) |
// use named arguments to provide variables to the expression |
```


#### <a id="lalib-help-cmd-test"></a>`/test`
- `[left:varname|number|string]`  
 the left operand value
- `[rule=gt|gte|lt|lte|eq|neq|not|in|nin]`  
 the boolean operation rule
- `[right:varname|number|string]`  
 the right operand value


Compares the value of the left operand <code>a</code> with the value of the right operand <code>b</code>,
and returns the result of the comparison (true or false).

Numeric values and string literals for left and right operands supported.

<strong>Available rules:</strong>
<ul>
    <li>gt =&gt; a &gt; b</li>
    <li>gte =&gt; a &gt;= b</li>
    <li>lt =&gt; a &lt; b</li>
    <li>lte =&gt; a &lt;= b</li>
    <li>eq =&gt; a == b</li>
    <li>neq =&gt; a != b</li>
    <li>not =&gt; !a</li>
    <li>in (strings) =&gt; a includes b</li>
    <li>nin (strings) =&gt; a not includes b</li>
</ul>

##### **Examples**
```stscript

/setvar key=i 0 | /test left=i rule=lte right=10 | /echo |
// returns true |
```


#### <a id="lalib-help-cmd-and"></a>`/and`
- `...(true|false)`  
 the values to evaluate


Returns true if all values are true, otherwise false.

##### **Examples**
```stscript

/and true true true |
// Returns true. |
```
```stscript

/and true false true |
// Returns false. |
```


#### <a id="lalib-help-cmd-or"></a>`/or`
- `...(true|false)`  
 the values to evaluate


Returns true if at least one of the values is true, false if all are false.

##### **Examples**
```stscript

/or true true true |
// Returns true. |
```
```stscript

/or true false true |
// Returns true. |
```
```stscript

/or false false false |
// Returns false. |
```


#### <a id="lalib-help-cmd-not"></a>`/not`
- `(true|false)`  
 the value to negate


Returns true if value is false, otherwise true.

##### **Examples**
```stscript

/not false |
// Returns true. |
```
```stscript

/not true |
// Returns false. |
```



### <a id="lalib-help-group-List_Operations_and_Loops"></a>List Operations and Loops


#### <a id="lalib-help-cmd-pop"></a>`/pop`
- `(varname|list)`  
 target list


Removes the last element from a list and returns it.

##### **Examples**
```stscript

/pop ["A", "B", "C"] |
// returns C |
```
```stscript

/let x [1, 2, 3, 4, 5] |
/pop x |
// returns 5 |
```


#### <a id="lalib-help-cmd-push"></a>`/push`
- `(varname|list)`  
 target list
- `...(bool|closure|dictionary|list|number|string)`  
 items to add


Appends new elements to the end of a list, and returns the list.

##### **Examples**
```stscript

/push ["A", "B", "C"] foo bar |
// returns ["A", "B", "C", "foo", "bar"] |
```
```stscript

/let x [1, 2, 3, 4, 5] |
/push x 10 |
// returns [1, 2, 3, 4, 5, 10] |
```


#### <a id="lalib-help-cmd-shift"></a>`/shift`
- `(varname|list)`  
 target list


Removes the first element from a list and returns it.

##### **Examples**
```stscript

/shift ["A", "B", "C"] |
// returns A |
```
```stscript

/let x [1, 2, 3, 4, 5] |
/shift x |
// returns 1 |
```


#### <a id="lalib-help-cmd-unshift"></a>`/unshift`
- `(varname|list)`  
 target list
- `...(bool|closure|dictionary|list|number|string)`  
 items to add


Inserts new elements at the start of a list, and returns the list.

##### **Examples**
```stscript

/unshift ["A", "B", "C"] foo bar |
// returns ["foo", "bar", "A", "B", "C"] |
```
```stscript

/let x [1, 2, 3, 4, 5] |
/unshift x 10 |
// returns [10, 1, 2, 3, 4, 5] |
```


#### <a id="lalib-help-cmd-foreach"></a>`/foreach`
- `(list|dictionary)`  
 the list or dictionary to iterate over
- `(closure|subcommand)`  
 the closure to execute for each item, with {{var::item}} and {{var::index}} (or the first two closure arguments) placeholders


Executes the provided command for each item of a list or dictionary, replacing {{var::item}} and {{var::index}} (or the first two closure arguments) with the current item and index.

Use <code>/break</code> to break out of the loop early.

##### **Examples**
```stscript

/foreach ["A", "B", "C"] {:
    /echo Item {{var::index}} is {{var::item}} |
    /delay 400 |
:} |
```
```stscript

/let x {"a":"foo","b":"bar"} |
/foreach {{var::x}} {:
    /echo Item {{var::index}} is {{var::item}} |
    /delay 400 |
:} |
```
```stscript

/foreach ["A", "B", "C"] {: it= i=
    /echo Item {{var::it}} is {{var::i}} |
    /delay 400 |
:} |
// uses custom closure arguments it and i instead of the default item and index. |
```
```stscript

/foreach ["A", "B", "C"] {: foo= bar=
    /echo Item {{var::foo}} is {{var::bar}} |
    /delay 400 |
:} |
// uses custom closure arguments foo and bar instead of the default item and index. |
```


#### <a id="lalib-help-cmd-map"></a>`/map`
- `[aslist=true|false]? = false`  
 *(optional)* whether to return the results of a dictionary as a list
- `(list|dictionary)`  
 the list or dictionary to iterate over
- `(closure|subcommand)`  
 the closure to execute for each item, with {{var::item}} and {{var::index}} (or the first two closure arguments) placeholders


Executes a command for each item of a list or dictionary and returns the list or dictionary of the command results.

Use <code>/break</code> to break out of the loop early.

##### **Examples**
```stscript

/map [1,2,3] {:
    /mul {{var::item}} {{var::item}}
:} |
// Calculates the square of each number. |
```
```stscript

/map [1,2,3] {: it= i=
    /mul {{var::it}} {{var::it}}
:} |
// Calculates the square of each number. |
```
```stscript

/map [1,2,3] {: foo= bar=
    /mul {{var::foo}} {{var::foo}}
:} |
// Calculates the square of each number. |
```
```stscript

/map {"a":1,"b":2,"c":3} {: /mul {{var::item}} {{var::item}} :} |
// Calculates the square of each number. |
```
```stscript

/map aslist= {"a":1,"b":2,"c":3} {: /mul {{var::item}} {{var::item}} :} |
// Calculates the square of each number. |
```


#### <a id="lalib-help-cmd-whilee"></a>`/whilee`
- `...[expression variables:bool|closure|dictionary|list|number|string]?`  
 *(optional)* named arguments assigned to scoped variables to be used in the expression
- `...(string|closure)`  
 the expression or closure to evaluate
- `(closure)`  
 the closure to execute


Creates a loop that executes a specified closure as long as the test condition (expression or closure) evaluates to true. The condition is evaluated before executing the closure.

Use <code>/break</code> to break out of the loop early.

See <a data-lalib-exec="/lalib? expressions"><code>/lalib? expressions</code></a> for more details on expressions.

##### **Examples**
```stscript

/whilee (i++ < 3) {:
    /echo i: {{var::i}} |
    /delay 400 |
:} |
```


#### <a id="lalib-help-cmd-reduce"></a>`/reduce`
- `[initial:bool|dictionary|list|number|string]?`  
 *(optional)* initial value
- `(list)`  
 the list to reduce
- `(closure)`  
 the closure to execute for each item, takes up to three arguments (accumulator, current value, current index)


Executes a "reducer" closure on each element of the list, in order, passing in
the return value from the calculation on the preceding element. The final result of running the reducer
across all elements of the list is a single value.

The first time that the closure is run there is no "return value of the previous calculation". If
supplied, an initial value may be used in its place. Otherwise the list element at index 0 is used as
the initial value and iteration starts from the next element (index 1 instead of index 0).

The reducer closure accepts up to three arguments:
<ul>
    <li>
        <code>accumulator</code><br>
        The value resulting from the previous call to closure. On the first call, its value is
        <code>initial=</code> if that argument is provided; otherwise its value is the first list item.
    </li>
    <li>
        <code>currentValue</code><br>
        The value of the current element. On the first call, its value is the first list item if
        <code>initial=</code> is specified; otherwise its value is the second list item.
    </li>
    <li>
        <code>currentIndex</code><br>
        The index position of currentValue in the list. On the first call, its value is 0 if
        <code>initial=</code> is specified, otherwise 1.
    </li>
</ul>

##### **Examples**
```stscript

/reduce [1,2,3] {: acc= cur= /= acc + cur :} |
// returns 6 (1+2 = 3 -> 3 + 3 = 6) |
```
```stscript

/reduce initial=10 [1,2,3] {: acc= cur= /= acc + cur :} |
// returns 16 (10+1 = 11 -> 11+2 = 13 -> 13 + 3 = 16) |
```
```stscript

/let x [["a",1],["b",2],["c",3]] |
/reduce initial={} {{var::x}} {: acc= cur=
    /var key=acc index={: /= cur.0 :}() {: /= cur.1 :}() |
    /return {{var::acc}} |
:} |
// returns {"a":"1","b":"2","c":"3"} |
```


#### <a id="lalib-help-cmd-sorte"></a>`/sorte`
- `[key:closure]?`  
 *(optional)* closure that returns the value to be used for sorting
- `(list|varname)`  
 the list to sort
- `...(string|closure)? = (a <=> b)`  
 *(optional)* the expression or closure used to compare two items <code>a</code> and <code>b</code>


Sorts a list.

The comparison closure must accept two named arguments which will be equivalent to <code>a</code>
and <code>b</code> in the expression.<br>
Using a comparison closure can be very performance and time intensive on longer lists.

If given a variable name, the variable will be modified.

See <a data-lalib-exec="/lalib? expressions"><code>/lalib? expressions</code></a> for more details on expressions.

##### **Examples**
```stscript

/sorte [5,3,-10,-99,0] |
// returns [-99,-10,0,3,5] |
```
```stscript

/let x [5,3,-10,-99,0] |
/sorte x |
/echo {{var::x}} |
// returns [-99,-10,0,3,5] |
```
```stscript

/let x [5,3,-10,-99,0] |
/sorte {{var::x}} |
/echo {{var::x}} |
// returns [5,3,-10,-99,0] |
```
```stscript

/sorte [5,3,-10,-99,0] (a <=> b) |
// returns [-99,-10,0,3,5] |
```
```stscript

/sorte [5,3,-10,-99,0] (b <=> a) |
// returns [5,3,0,-10,-99] |
```
```stscript

/sorte [5,3,-10,-99,0] {: a= b= /sub a b :} |
// returns [-99,-10,0,3,5] |
```


#### <a id="lalib-help-cmd-flatten"></a>`/flatten`
- `[depth:number]? = 1`  
 *(optional)* The depth level specifying how deep a nested list structure should be flattened. Defaults to 1. Use 0 to flatten all levels.
- `(list)`  
 the list to flatten


Creates a new list with all sub-list elements concatenated into it recursively up to the specified depth.

##### **Examples**
```stscript

/flatten [1, 2, 3, [4, 5, 6, [7, 8, 9]]] |
// returns [1, 2, 3, 4, 5, 6, [7, 8, 9]] |
```
```stscript

/flatten depth=0 [1, 2, 3, [4, 5, 6, [7, 8, 9]]] |
// returns [1, 2, 3, 4, 5, 6, 7, 8, 9] |
```


#### <a id="lalib-help-cmd-filter"></a>`/filter`
- `(list|dictionary)`  
 the list or dictionary to iterate over
- `...(closure|string)`  
 the closure or expression to execute for each item, with {{var::item}} and {{var::index}} placeholders


Executes command for each item of a list or dictionary and returns the list or dictionary of only those items where the command returned true.

See <a data-lalib-exec="/lalib? expressions"><code>/lalib? expressions</code></a> for more details on expressions.

##### **Examples**
```stscript

/filter [1,2,3,4,5] {:
    /test left={{var::item}} rule=gt right=2
:} |
// returns [3, 4, 5] |
```
```stscript

/filter [1,2,3,4,5] {: it=
    /test left={{var::it}} rule=gt right=2
:} |
// returns [3, 4, 5] |
```
```stscript

/filter [1,2,3,4,5] (item > 2) |
// returns [3, 4, 5] |
```


#### <a id="lalib-help-cmd-find"></a>`/find`
- `[index=true|false]? = false`  
 *(optional)* return the matching item's index instead of the item
- `[last=true|false]? = false`  
 *(optional)* return the last instead of the first matching item
- `(list|dictionary)`  
 the list or dictionary to iterate over
- `...(closure|subcommand)`  
 the command to execute for each item, using {{var::item}} and {{var::index}} as placeholders


Executes the provided closure or expression for each item of a list or dictionary and returns the first item where the command returned true.

See <a data-lalib-exec="/lalib? expressions"><code>/lalib? expressions</code></a> for more details on expressions.

##### **Examples**
```stscript

/find [1,2,3,4,5] {:
    /test left={{var::item}} rule=gt right=2
:} |
/echo |
// returns 3 |
```
```stscript

/find [1,2,3,4,5] {: it=
    /test left={{var::it}} rule=gt right=2
:} |
/echo |
// returns 3 |
```
```stscript

/find [1,2,3,4,5] (item > 2) | /echo |
// returns 3 |
```


#### <a id="lalib-help-cmd-slice"></a>`/slice`
- `[start:number]`  
 the starting index of the slice, negative numbers start from the back
- `[end:number]?`  
 *(optional)* the ending index of the slice (non-inclusive)
- `[length:number]?`  
 *(optional)* the length of the slice
- `(string|list)?`  
 *(optional)* the value to slice


Retrieves a slice of a list or string.

##### **Examples**
```stscript

/slice start=2 length=3 [1,2,3,4,5,6] | /echo |
// returns [3,4,5] |
```
```stscript

/slice start=-8 The quick brown fox jumps over the lazy dog | /echo |
// returns lazy dog |
```


#### <a id="lalib-help-cmd-splice"></a>`/splice`
- `[start:number]`  
 the starting index of the splice, negative numbers start from the back
- `[delete:number]?`  
 *(optional)* the number of elements to remove in the list from start (use delete= to remove everything)
- `[insert:list|string]?`  
 *(optional)* the elements to add at index start=
- `(string|number|bool|list|dictionary)?`  
 *(optional)* the list or string to operate on


Creates a new list with some elements removed and / or replaced at a given index.

##### **Examples**
```stscript

/splice insert=[30, 40, 50] start=3 delete=3 [0,1,2,3,4,5,6] |
/echo |
// returns [0,1,2,30,40,50,6] |
```
```stscript

/splice start=3 delete=3 [0,1,2,3,4,5,6] |
/echo |
// returns [0,1,2,6] |
```
```stscript

/splice insert=100 start=3 [0,1,2,3,4,5,6] |
/echo |
// returns [0,1,2,100,3,4,5,6] |
```
```stscript

/splice start=-1 delete=1 [0,1,2,3,4,5,6] |
/echo |
// returns [0,1,2,3,4,5] |
```


#### <a id="lalib-help-cmd-shuffle"></a>`/shuffle`
- `(list)`  
 the list to shuffle


Returns a shuffled list.

##### **Examples**
```stscript

/shuffle [1, 2, 3, 4] |
// could be [2, 4, 3, 1] |
```


#### <a id="lalib-help-cmd-pick"></a>`/pick`
- `[items:number]? = 1`  
 *(optional)* how many items to pick (if greater than one, will return a list)
- `[list=true|false]? = false`  
 *(optional)* whether to return a list, even if only one item is picked
- `(list)`  
 the list to pick from


Picks one random item or <code>items</code> number of random items from a list (no duplicates).

##### **Examples**
```stscript

/pick [1, 2, 3, 4] |
// could be 3 |
```
```stscript

/pick list= [1, 2, 3, 4] |
// could be [3] |
```
```stscript

/pick items=2 [1, 2, 3, 4] |
// could be [1, 4] |
```


#### <a id="lalib-help-cmd-reverse"></a>`/reverse`
- `(list)`  
 the list to reverse


Returns a reversed list.

##### **Examples**
```stscript

/reverse [1, 2, 3, 4] |
// returns [4, 3, 2, 1] |
```


#### <a id="lalib-help-cmd-dict"></a>`/dict`
- `[var:varname]?`  
 *(optional)* name of the chat variable to use as input
- `[globalvar:varname]?`  
 *(optional)* name of the global variable to use as input
- `(list)`  
 a list of lists, where each inner list has at least two elements


Takes a list of lists (each item must be a list of at least two items) and creates a dictionary by using each
items first item as key and each items second item as value.

##### **Examples**
```stscript

/let x [
    ["a", 1],
    ["b", 2],
    ["c", 3]
] |
/dict {{var::x}} |
/echo |
// returns {a:1, b:2, c:3} |
```


#### <a id="lalib-help-cmd-keys"></a>`/keys`
- `(dictionary)?`  
 *(optional)* the dictionary to get keys from


Return the list of keys of a dictionary.

##### **Examples**
```stscript

/let x {"a":1, "b":2, "c":3} |
/keys {{var::x}} |
// returns ["a", "b", "c"] |
```



### <a id="lalib-help-group-Split_Join"></a>Split & Join


#### <a id="lalib-help-cmd-split"></a>`/split`
- `[find:string]? = ,`  
 *(optional)* the text to split at
- `[trim=true|false]? = true`  
 *(optional)* whether to trim the resulting values
- `(string)?`  
 *(optional)* the value to split


Splits value into list at every occurrence of find. Supports regex <code>find="/\s/"</code>

##### **Examples**
```stscript

/split find="/\s/" The quick brown fox jumps over the lazy dog | /echo |
```


#### <a id="lalib-help-cmd-join"></a>`/join`
- `[glue:string]? = , `  
 *(optional)* the string to join the list items with
- `(list)?`  
 *(optional)* the list to join


Joins the items of a list with glue into a single string. Use <code>glue={{space}}</code> to join with a space.

##### **Examples**
```stscript

/join ["apple", "banana", "cherry"] |
// returns "apple, banana, cherry" |
```
```stscript

/join glue=" | " ["apple", "banana", "cherry"] |
// returns "apple | banana | cherry" |
```



### <a id="lalib-help-group-Text_Operations"></a>Text Operations


#### <a id="lalib-help-cmd-trim"></a>`/trim`
- `(string)`  
 text to trim


Removes whitespace at the start and end of the text.

##### **Examples**
```stscript

/let x "  foo " |
/trim {{var::x}} |
// return "foo" |
```


#### <a id="lalib-help-cmd-pad_start"></a>`/pad-start`
- `[fill:string]? =  `  
 *(optional)* the character to use to pad the text
- `(number)`  
 target length
- `(string)`  
 the text to pad


Pad the provided text at the start if it is shorter then the target length.

##### **Examples**
```stscript

/pad-start 5 foo |
// returns   foo |
```
```stscript

/pad-start fill=+ 5 foo |
// returns ++foo |
```


#### <a id="lalib-help-cmd-pad_end"></a>`/pad-end`
- `[fill:string]? =  `  
 *(optional)* the character to use to pad the text
- `(number)`  
 target length
- `(string)`  
 the text to pad


Pad the provided text at the end if it is shorter then the target length.

##### **Examples**
```stscript

/pad-end 5 foo |
// returns foo   |
```
```stscript

/pad-end fill=+ 5 foo |
// returns foo++ |
```


#### <a id="lalib-help-cmd-pad_both"></a>`/pad-both`
- `[fill:string]? =  `  
 *(optional)* the character to use to pad the text
- `(number)`  
 target length
- `(string)`  
 the text to pad


Pad the provided text at both ends if it is shorter then the target length.

If an odd number of characters needs to be added, the remaining character will be added
at the end of the text.

##### **Examples**
```stscript

/pad-both 5 foo |
// returns  foo  |
```
```stscript

/pad-both fill=+ 5 foo |
// returns +foo+ |
```
```stscript

/pad-both fill=+ 6 foo |
// returns +foo++ |
```


#### <a id="lalib-help-cmd-diff"></a>`/diff`
- `[all=true|false]? = true`  
 *(optional)* show new, old, and diff side by side
- `[buttons=true|false]? = true`  
 *(optional)* add buttons to pick which text to return
- `[stripcode=true|false]? = true`  
 *(optional)* remove all codeblocks before diffing
- `[notes:string]?`  
 *(optional)* show additional notes or comments above the comparison
- `[old:string]`  
 the old text to compare
- `[new:string]`  
 the new text to compare


Compares old text vs new text and displays the difference between the two. Use <code>all=true</code> to show new, old, and diff side by side. Use <code>buttons=true</code> to add buttons to pick which text to return. Use <code>stripcode=true</code> to remove all codeblocks before diffing. Use <code>notes="some text"</code> to show additional notes or comments above the comparison.

##### **Examples**
```stscript

/sub {{lastMessageId}} 1 |
/messages names=off |
/let old {{pipe}} |
/setvar key=old {{var::old}} |

/messages names=off {{lastMessageId}} |
/let new {{pipe}} |
/setvar key=new {{var::new}} |

/diff old={{var::old}} new={{var::new}} |
// compares the last two messages |
```


#### <a id="lalib-help-cmd-json_pretty"></a>`/json-pretty`
- `(string)`  
 JSON to pretty print


Pretty print JSON.

##### **Examples**
```stscript

/json-pretty {"a":1, "b":[1,2,3]} |
/send ```json{{newline}}{{pipe}}{{newline}}``` |
```


#### <a id="lalib-help-cmd-substitute"></a>`/substitute`
- `(string)`  
 text to substitute macros in


Substitute macros in text.

##### **Examples**
```stscript

/let x foo |
/substitute x is \{\{var::x\}\} |
```


#### <a id="lalib-help-cmd-wordcount"></a>`/wordcount`
- `[language:string]? = en`  
 *(optional)* Two character language code according to IETF BCP 47
- `(string)`  
 the text to count words in


Count the number of words in text. Language defaults to "en". Supply a two character language according to IETF BCP 47 language tags for other languages.

##### **Examples**
```stscript

/wordcount The quick brown fox jumps over the lazy dog. |
// returns 9 |
```


#### <a id="lalib-help-cmd-sentencecount"></a>`/sentencecount`
- `[language:string]? = en`  
 *(optional)* Two character language code according to IETF BCP 47
- `(string)`  
 the text to count sentences in


Count the number of sentences in text. Language defaults to "en". Supply a two character language according to IETF BCP 47 language tags for other languages.

##### **Examples**
```stscript

/sentencecount The quick brown fox jumps over the lazy dog. Does the quick brown fox jump over the lazy dog? |
// returns 2 |
```


#### <a id="lalib-help-cmd-segment"></a>`/segment`
- `[granularity=grapheme|word|sentence]? = word`  
 *(optional)* The unit to segment the text into: grapheme, word or sentence
- `[language:string]? = en`  
 *(optional)* Two character language code according to IETF BCP 47
- `(string)`  
 the text to segment


Return the graphemes (characters, basically), words or sentences found in the text. Supply a two character language according to IETF BCP 47 language tags for other languages.

##### **Examples**
```stscript

/segment granularity=sentence The fox. The dog. |
// returns ["The fox.", "The dog."] |
```
```stscript

/segment granularity=word The fox. The dog. |
// returns ["The", "fox", "The", "dog"] |
```



### <a id="lalib-help-group-Regular_Expressions"></a>Regular Expressions


#### <a id="lalib-help-cmd-re_escape"></a>`/re-escape`
- `(string)`  
 text to escape


Escapes text to be used literally inside a regex.

##### **Examples**
```stscript

/re-escape foo/bar foo.bar |
/echo |
// Will echo foo\/bar foo\.bar. |
```
```stscript

/re-escape {{char}} |
/re-replace find=/\b{{pipe}}\b/g replace=FOO {{lastMessage}} |
/echo |
```


#### <a id="lalib-help-cmd-re_test"></a>`/re-test`
- `[find:string]`  
 the regular expression to test against
- `(string)?`  
 *(optional)* the value to test


Tests if the provided variable or value matches a regular expression.

##### **Examples**
```stscript

/re-test find=/dog/i The quick brown fox jumps over the lazy dog. |
// returns true |
```
```stscript

// pipes in the regex must to be escaped |
/re-test find=/dog\|cat/i The quick brown fox jumps over the lazy dog. |
// returns true |
```
```stscript

// if you want to find a literal pipe, you have to also escape the backslash escaping it |
/re-test find=/dog\\\|cat/i The quick brown fox jumps over the lazy dog. |
// returns false |
```
```stscript

// or you can put quote around the regex and forget about escaping... |
/re-test find="/dog|cat/i" The quick brown fox jumps over the lazy dog. |
// returns true ("dog" or "cat") |
```
```stscript

/re-test find="/dog\|cat/i" The quick brown fox jumps over the lazy dog. |
// result will be false (only matching literally "dog|cat") |
```


#### <a id="lalib-help-cmd-re_replace"></a>`/re-replace`
- `[find:string]`  
 the regular expression (/pattern/flags)
- `[replace:string]?`  
 *(optional)* the replacement text
- `[cmd:closure|subcommand]?`  
 *(optional)* a closure or slash command to execute for each match
- `(string)?`  
 *(optional)* the value to perform the replacement on


Searches the provided variable or value with the regular expression and replaces matches with the replace value or the return value of the provided closure or slash command. For text replacements and slash commands, use <code>$1</code>, <code>$2</code>, ... to reference capturing groups. In closures use <code>{{$1}}</code>, <code>{{$2}}</code>, ... to reference capturing groups.

##### **Examples**
```stscript

/re-replace find=/\s+/ replace=" " The quick   brown  fox  jumps over the lazy dog | /echo |
// replaces multiple whitespace with a single space |
```
```stscript

/re-replace find=/([a-z]+) ([a-z]+)/ cmd="/echo $2 $1" the quick brown fox | /echo |
// swaps words using a slash command on each match |
```


#### <a id="lalib-help-cmd-re_exec"></a>`/re-exec`
- `[find:string]`  
 the regular expression (/pattern/flags)
- `[first=true|false]? = false`  
 *(optional)* return only the first match instead of a list
- `(string)?`  
 *(optional)* the value to execute the regex on


Searches the provided value with the regular expression and returns a list of all matches.

##### **Examples**
```stscript

/re-exec find=/\b(?\w+?(o+)\w+?)\b/g The quick brown fox jumps over the lazy fool dog. |
/json-pretty |
/comment ```{{newline}}{{pipe}}{{newline}}``` |
```
```stscript

/re-exec first= find=/\b(?\w+?(o+)\w+?)\b/g The quick brown fox jumps over the lazy fool dog. |
/json-pretty |
/comment ```{{newline}}{{pipe}}{{newline}}``` |
```



### <a id="lalib-help-group-Accessing_Manipulating_Structured_Data"></a>Accessing & Manipulating Structured Data


#### <a id="lalib-help-cmd-getat"></a>`/getat`
- `[index:string|number|list]`  
 the index, field name, or list of indices/field names to retrieve
- `(string)?`  
 *(optional)* the value to retrieve from (if not using a variable)


Retrieves an item from a list or a property from a dictionary.

##### **Examples**
```stscript

/setvar key=x {
    "a": [
        1,
        2,
        {
            "b": "foo",
            "c": "bar"
        }
    ],
    "d": "D"
} |
/getat var=x index=d |
// returns "D" |
```
```stscript

/return {
    "a": [
        1,
        2,
        {
            "b": "foo",
            "c": "bar"
        }
    ],
    "d": "D"
} |
/getat index=["a", 2, "b"] |
// returns "foo" |
```
```stscript

/return {
    "a": [
        1,
        2,
        {
            "b": "foo",
            "c": "bar"
        }
    ],
    "d": "D"
} |
/getat index=a |
/getat index=2 |
/getat index=c |
// returns "bar" |
```


#### <a id="lalib-help-cmd-setat"></a>`/setat`
- `[index:string|list]`  
 the index or key to set the value at
- `[value:list|dictionary]?`  
 *(optional)* the value to update
- `(string)`  
 the value to set


Sets an item in a list or a property in a dictionary.

##### **Examples**
```stscript

/setat value=[1,2,3] index=1 X |
// returns [1,"X",3] |
```
```stscript

/setat value={{var::myVariable}} index=[1,2,"someProperty"] foobar |
// sets the value of myVariable[1][2].someProperty to "foobar" (the variable will be updated and the resulting value of myVariable will be returned) |
```



### <a id="lalib-help-group-Exception_Handling"></a>Exception Handling


#### <a id="lalib-help-cmd-try"></a>`/try`
- `(closure|subcommand)`  
 the command to try


Attempts to execute the provided command and catches any exceptions thrown. Use with <code>/catch</code>.

##### **Examples**
```stscript

/try {: /var x :} |
/catch {: /echo An error occurred: {{exception}} :} |
```


#### <a id="lalib-help-cmd-catch"></a>`/catch`
- `(closure|subcommand)`  
 the command to execute if an exception occurred


Used with the `/try` command to handle exceptions. Use `{{exception}}` or `{{error}}` to get the exception's message.

##### **Examples**
```stscript

/try {: /var x :} |
/catch {: /echo An error occurred: {{exception}} :} |
```



### <a id="lalib-help-group-Null_Handling"></a>Null Handling


#### <a id="lalib-help-cmd-ifempty"></a>`/ifempty`
- `[value:string]`  
 the value to check
- `(string)`  
 the fallback value


Returns the fallback value if value is empty (empty string, empty list, empty dictionary).

##### **Examples**
```stscript

/ifempty value=[] [1,2,3] |
// returns [1, 2, 3] |
```
```stscript

/setvar key=x |
/setvar key=y bar |
/ifempty value={{getvar::x}} foo |
/setvar key=xx {{pipe}} |
/ifempty value={{getvar::y}} foo |
/setvar key=yy {{pipe}} |
// sets xx to "foo" and yy to "bar" |
```


#### <a id="lalib-help-cmd-ifnullish"></a>`/ifnullish`
- `[value:string]`  
 the value to check
- `(string)`  
 the fallback value


Returns the fallback value if value is nullish (empty string).

##### **Examples**
```stscript

/ifnullish value=[] [1,2,3] |
// returns [] |
```
```stscript

/setvar key=x |
/setvar key=y bar |
/ifnullish value={{getvar::x}} foo |
/setvar key=xx {{pipe}} |
/ifnullish value={{getvar::y}} foo |
/setvar key=yy {{pipe}} |
// sets xx to "foo" and yy to "bar" |
```



### <a id="lalib-help-group-Copy_Download"></a>Copy & Download


#### <a id="lalib-help-cmd-copy"></a>`/copy`
- `(string)`  
 the value to copy


Copies value into clipboard.

##### **Examples**
```stscript

/copy this text is now in your clipboard |
```
```stscript

/copy {{lastMessage}} |
// puts the last chat message in your clipboard |
```


#### <a id="lalib-help-cmd-download"></a>`/download`
- `[name:string]? = SillyTavern-2024-11-06T15:46:46.129Z`  
 *(optional)* the filename for the downloaded file
- `[ext:string]? = txt`  
 *(optional)* the file extension for the downloaded file
- `(string)`  
 the value to download as a text file


Downloads value as a text file.

##### **Examples**
```stscript

/download Let's download this text. |
// downloads a txt file containing "Let's download this text." |
```
```stscript

/download name=TheLastMessage ext=md {{lastMessage}} |
// downloads a file TheLastMessage.md containing the last chat message |
```



### <a id="lalib-help-group-DOM_Interaction"></a>DOM Interaction


#### <a id="lalib-help-cmd-dom"></a>`/dom`
- `[quiet=true|false]? = false`  
 *(optional)* true: don't show warnings
- `[multi=true|false]? = false`  
 *(optional)* true: target all matching elements; false: target first matching element
- `[target:number]?`  
 *(optional)* target the n-th matching element if multi=true (zero-based)
- `[action=click|value|property|attribute|call]`  
 the action to perform
- `[value:string]?`  
 *(optional)* new value to set (for action=value or action=property or action=attribute)
- `[property:string]?`  
 *(optional)* property name to get/set/call (for action=property or action=call)
- `[attribute:string]?`  
 *(optional)* attribute name to get/set (for action=attribute)
- `(string)`  
 CSS selector to target an element


Click on an element, change its value, retrieve a property, or retrieve an attribute. To select the targeted element, use CSS selectors.

##### **Examples**
```stscript

/dom action=click #expandMessageActions |
```
```stscript

/dom action=value value=0 #avatar_style |
```



### <a id="lalib-help-group-Characters"></a>Characters


#### <a id="lalib-help-cmd-char_get"></a>`/char-get`
- `[index:string]?`  
 *(optional)* the field to retrieve
- `(string)? = current character`  
 *(optional)* character avatar (filename) or name


Get a character object or one of its properties.

##### **Examples**
```stscript

/char-get Seraphina |
/getat index=description |
/echo |
```
```stscript

/char-get index=description Seraphina |
/echo |
```



### <a id="lalib-help-group-Group_Chats"></a>Group Chats


#### <a id="lalib-help-cmd-memberpos"></a>`/memberpos`
- `(string)`  
 name of the group member
- `(number)`  
 new position index for the member


Move group member to position (index starts with 0).

##### **Examples**
```stscript

/memberpos Alice 3 |
/echo Alice has been moved to position 3 |
```


#### <a id="lalib-help-cmd-group_get"></a>`/group-get`
- `[index:string]?`  
 *(optional)* the field to retrieve
- `[chars=true|false]? = false`  
 *(optional)* resolve characters
- `(string)? = current group`  
 *(optional)* group name


Get a group object or one of its properties.

##### **Examples**
```stscript

/group-get MyGroup |
/getat index=description |
/echo |
```
```stscript

/group-get index=description MyGroup |
/echo |
```
```stscript

/group-get index=members chars=true MyGroup |
/echo |
```



### <a id="lalib-help-group-Conditionals_switch"></a>Conditionals - switch


#### <a id="lalib-help-cmd-switch"></a>`/switch`
- `(string|number)`  
 the value to use as the switch value


Use with /case to conditionally execute commands based on a value.

##### **Examples**
```stscript

/let x foo |
/switch {{var::x}} |
    /case 1 {: /echo value is one :} |
    /case foo {: /echo value is foo :} |
    /case bar {: /echo value is bar :} |
    /case {: /echo value is something else :} |
// returns "value is foo" |
```


#### <a id="lalib-help-cmd-case"></a>`/case`
- `(string|number)`  
 the value to compare against the switch value
- `(closure|subcommand)`  
 the command to execute if the value matches the switch value


Execute a command if the provided value matches the switch value from /switch.

##### **Examples**
```stscript

// see /switch |
```



### <a id="lalib-help-group-Conditionals_if"></a>Conditionals - if


#### <a id="lalib-help-cmd-ife"></a>`/ife`
- `...[expression variables:bool|closure|dictionary|list|number|string]?`  
 *(optional)* named arguments assigned to scoped variables to be used in the expression
- `...(string|closure)`  
 the expression or closure to evaluate, followed by the closure to execute if true


Execute a closure if the expression or first closure returns <code>true</code>.

Use with <code>/elseif</code> and <code>/else</code>.

See <a data-lalib-exec="/lalib? expressions"><code>/lalib? expressions</code></a> for more details on expressions.

##### **Examples**
```stscript

/setvar key=x foo |
/ife (x == 1) {:
    /echo value is one
:} |
/elseif (x == 'foo') {:
    /echo value is foo
:} |
/elseif (x == 'bar') {:
    /echo value is bar
:} |
/else {:
    /echo value is something else
:} |
```
```stscript

/genraw say either foo or bar |
/ife result={{pipe}} ('foo' in result) {:
    /echo said "foo" |
:} |
/else {:
    /echo did not say "foo" |
:} |
// use named arguments to provide variables to the expression |
```


#### <a id="lalib-help-cmd-elseif"></a>`/elseif`
- `...[expression variables:bool|closure|dictionary|list|number|string]?`  
 *(optional)* named arguments assigned to scoped variables to be used in the expression
- `...(string|closure)`  
 the expression or closure to evaluate, followed by the closure to execute if true


Execute a closure if none of the preceeding <code>/ife</code> and <code>/elseif</code> executed and the expression or first closure returns <code>true</code>.

Use with <code>/ife</code> and <code>/else</code>.

See <a data-lalib-exec="/lalib? expressions"><code>/lalib? expressions</code></a> for more details on expressions.

##### **Examples**
```stscript

/setvar key=x foo |
/ife (x == 1) {:
    /echo value is one
:} |
/elseif (x == 'foo') {:
    /echo value is foo
:} |
/elseif (x == 'bar') {:
    /echo value is bar
:} |
/else {:
    /echo value is something else
:} |
```


#### <a id="lalib-help-cmd-else"></a>`/else`
- `(closure|subcommand)`  
 the command to execute


Execute a closure if none of the preceeding <code>/ife</code> and <code>/elseif</code> executed.

Use with <code>/ife</code> and <code>/elseif</code>.

See <a href="javascript:;" data-lalib-exec="/lalib? expressions"><code>/lalib? expressions</code></a> for more details on expressions.

##### **Examples**
```stscript

/setvar key=x foo |
/ife (x == 1) {:
    /echo value is one
:} |
/elseif (x == 'foo') {:
    /echo value is foo
:} |
/elseif (x == 'bar') {:
    /echo value is bar
:} |
/else {:
    /echo value is something else
:} |
```


#### <a id="lalib-help-cmd-then"></a>`/then`
- `(closure|subcommand)`  
 the command to execute


<div><strong>DEPRECATED</strong></div>

##### **Examples**
```stscript
// DEPRECATED |
```



### <a id="lalib-help-group-World_Info"></a>World Info


#### <a id="lalib-help-cmd-wi_list_books"></a>`/wi-list-books`
- `[source=true|false]? = false`  
 *(optional)* whether to include the activation source for each book


Get a list of currently active World Info books. Use <code>source=</code> to get a dictionary of lists where the keys are the activation sources.

##### **Examples**
```stscript

/wi-list-books |
// returns a list of active books |
```
```stscript

/wi-list-books source= |
/json-pretty |
/comment Currently active WI books:{{newline}}```json{{newline}}{{pipe}}{{newline}}``` |
```


#### <a id="lalib-help-cmd-wi_list_entries"></a>`/wi-list-entries`
- `[flat=true|false]? = false`  
 *(optional)* whether to list all entries in a flat list
- `(string)?`  
 *(optional)* the name of the book to list entries from


Get a list of World Info entries from currently active books or from the book with the provided name. Use <code>flat=</code> to list all entries in a flat list instead of a dictionary with entries per book.

##### **Examples**
```stscript

/wi-list-entries |
/map {{pipe}} {:
    /getat index=entries {{var::item}} |
    /map {{pipe}} {:
        /getat index=comment {{var::item}}
    :}
:} |
/echo Overview of WI entries in currently active books: {{pipe}} |
```


#### <a id="lalib-help-cmd-wi_activate"></a>`/wi-activate`


Activate World Info entries based on the current chat and trigger their Automation IDs.

##### **Examples**
```stscript

/wi-activate |
```



### <a id="lalib-help-group-Costumes_Sprites"></a>Costumes / Sprites


#### <a id="lalib-help-cmd-costumes"></a>`/costumes`
- `[recurse=true|false]? = true`  
 *(optional)* whether to recurse into subfolders (SillyTavern can only load expressions from the first subfolder level)
- `(string)?`  
 *(optional)* the folder to list costumes from


Get a list of costume / sprite folders, recursive by default.

##### **Examples**
```stscript

/costumes Alice |
/echo Alice's costumes: {{pipe}} |
```



### <a id="lalib-help-group-Quick_Replies"></a>Quick Replies


#### <a id="lalib-help-cmd-qr_edit"></a>`/qr-edit`
- `[set:string]?`  
 *(optional)* the name of the quick reply set
- `[label:string]?`  
 *(optional)* the label of the quick reply
- `(string)?`  
 *(optional)* the label of the quick reply


Show the Quick Reply editor. If no QR set is provided, tries to find a QR in one of the active sets.

##### **Examples**
```stscript

/qr-edit My QR From An Active Set |
```
```stscript

/qr-edit set=MyQrSet label=MyQr |
```


#### <a id="lalib-help-cmd-qr_add"></a>`/qr-add`
- `[set:string]?`  
 *(optional)* the name of the quick reply set
- `[label:string]?`  
 *(optional)* the label of the quick reply
- `(string)?`  
 *(optional)* the label of the quick reply


Create a new Quick Reply and open its editor. If no QR set is provided, tries to find a QR in one of the active sets.

##### **Examples**
```stscript

/qr-add New QR In Active Set |
```
```stscript

/qr-add set=MyQrSet label=MyNewQr |
```



### <a id="lalib-help-group-Chat_Messages"></a>Chat Messages


#### <a id="lalib-help-cmd-swipes_get"></a>`/swipes-get`
- `[message:number]?`  
 *(optional)* the message ID to get swipes from
- `(number)`  
 the index of the swipe to get


Get the n-th swipe (zero-based index) from the last message or the message with the given message ID.

##### **Examples**
```stscript

/swipes-get 5 |
/echo Swipe number five: {{pipe}} |
```
```stscript

/sub {{lastMessageId}} 2 |
/swipes-get message={{pipe}} 5 |
/echo swipe number five: {{pipe}} |
```


#### <a id="lalib-help-cmd-swipes_get"></a>`/swipes-get`
- `[message:number]?`  
 *(optional)* the message ID to get swipes from
- `(number)`  
 the index of the swipe to get


Get the n-th swipe (zero-based index) from the last message or the message with the given message ID.

##### **Examples**
```stscript

/swipes-get 5 |
/echo Swipe number five: {{pipe}} |
```
```stscript

/sub {{lastMessageId}} 2 |
/swipes-get message={{pipe}} 5 |
/echo swipe number five: {{pipe}} |
```


#### <a id="lalib-help-cmd-swipes_list"></a>`/swipes-list`
- `[message:number]?`  
 *(optional)* the message ID to get swipes from


Get a list of all swipes from the last message or the message with the given message ID.

##### **Examples**
```stscript

/swipes-list |
/echo |
```
```stscript

/sub {{lastMessageId}} 2 |
/swipes-list message={{pipe}} |
/echo |
```


#### <a id="lalib-help-cmd-swipes_count"></a>`/swipes-count`
- `[message:number]?`  
 *(optional)* the message ID to get swipes from


Get the number of all swipes from the last message or the message with the given message ID.

##### **Examples**
```stscript

/swipes-count |
/echo |
```
```stscript

/sub {{lastMessageId}} 2 |
/swipes-count message={{pipe}} |
/echo |
```


#### <a id="lalib-help-cmd-swipes_index"></a>`/swipes-index`
- `[message:number]?`  
 *(optional)* the message ID to get the swipe index from


Get the current swipe index from the last message or the message with the given message ID.

##### **Examples**
```stscript

/swipes-index |
/echo |
```
```stscript

/sub {{lastMessageId}} 2 |
/swipes-index message={{pipe}} |
/echo |
```


#### <a id="lalib-help-cmd-swipes_add"></a>`/swipes-add`
- `[message:number]?`  
 *(optional)* the ID of the message to add the swipe to
- `(string)`  
 the text to add as a new swipe


Add a new swipe to the last message or the message with the provided messageId.

##### **Examples**
```stscript

/sendas name=Alice foo |
/delay 1000 |
/swipes-add bar |
// creates a new message "foo", then addes a swipe "bar" |
```


#### <a id="lalib-help-cmd-swipes_del"></a>`/swipes-del`
- `[message:number]?`  
 *(optional)* the id of the message to delete the swipe from
- `[filter:string|closure]?`  
 *(optional)* expression or closure accepting a swipe dictionary as argument returning true or false
- `(number)?`  
 *(optional)* the index of the swipe to delete (0-based)


Delete the current swipe or the swipe at the specified index (0-based).

Use <code>filter={: swipe= /return true :}</code> to remove multiple swipes.

See <a data-lalib-exec="/lalib? expressions"><code>/lalib? expressions</code></a> for more details on expressions.

##### **Examples**
```stscript

/swipes-del |
// delete current swipe of last message |
```
```stscript

/swipes-del 5 |
// delete swipe number 5 (0-based index) of last message |
```
```stscript

/swipes-del message=20 |
// delete current swipe of message #20 |
```
```stscript

/swipes-del filter="swipe.index % 2" |
// delete all odd swipes (0-based index) of last message |
```
```stscript

/swipes-del filter="swipe.index != 5" |
// delete all but swipe at idnex 5 (0-based index) of last message |
```
```stscript

/swipes-del filter="'bad word' in swipe.mes" |
// delete all swipes with "bad word" in their message text of last message |
```
```stscript

/swipes-del filter={: swipe=
    /var key=swipe index=mes |
    /test left={{pipe}} rule=in right="bad word" |
:} |
// delete all swipes with "bad word" in their message text of last message |
```


#### <a id="lalib-help-cmd-swipes_go"></a>`/swipes-go`
- `[message:number]?`  
 *(optional)* the message ID to go to the swipe for
- `(number)`  
 the index of the swipe to go to


Go to the swipe. 0-based index.

##### **Examples**
```stscript

/sendas name=Alice foo |
/delay 1000 |
/swipes-add bar |
/delay 1000 |
/swipes-add foobar |
/delay 1000 |
/swipes-go 0 |
```


#### <a id="lalib-help-cmd-swipes_swipe"></a>`/swipes-swipe`


Trigger a new swipe on the last message.

##### **Examples**
```stscript

/swipes-swipe |
/echo swiping has finished |
```


#### <a id="lalib-help-cmd-message_edit"></a>`/message-edit`
- `[message:number]?`  
 *(optional)* the message ID to edit
- `[append=true|false]? = false`  
 *(optional)* whether to append the new text to the end of the message
- `(string)`  
 the new text for the message


Edit the current message or the message at the provided message ID. Use <code>append=</code> to add the provided text at the end of the message. Use <code>{{space}}</code> to add space at the beginning of the text.

##### **Examples**
```stscript

/sendas name=Alice foo |
/delay 1000 |
/message-edit bar |
// adds a new message "foo" then changes it to "bar" |
```
```stscript

/sendas name=Alice foo |
/delay 1000 |
/message-edit append= bar |
// adds a new message "foo" then changes it to "foobar" |
```


#### <a id="lalib-help-cmd-message_move"></a>`/message-move`
- `[from:number]`  
 the message ID to move
- `[to:number]?`  
 *(optional)* where to move the message
- `[up:number]?`  
 *(optional)* number of slots to move the message up (decrease message ID)
- `[down:number]?`  
 *(optional)* number of slots to move the message down (increase message ID)


Move a message up or down in the chat.

##### **Examples**
```stscript

/message-move from={{lastMessageId}} to=10 |/message-move from={{lastMessageId}} up=2 |/message-move from=3 down=10 |
```



### <a id="lalib-help-group-Chat_Management"></a>Chat Management


#### <a id="lalib-help-cmd-chat_list"></a>`/chat-list`
- `[char:string]? = current char`  
 *(optional)* avatar name of the char


Get a list of all chats of the current or provided character.

##### **Examples**
```stscript

/chat-list |/chat-list char=default_Seraphina.png |
```


#### <a id="lalib-help-cmd-chat_parent"></a>`/chat-parent`


returns the name of the parent chat

##### **Examples**
```stscript

/chat-parent |
// returns name of the parent chat (if this is a branch) |
```


#### <a id="lalib-help-cmd-message_on"></a>`/message-on`
- `[event:string]`  
 event type to listen for
- `[callback:closure]`  
 closure to run when triggered
- `[quiet=true|false]? = true`  
 *(optional)* whether to show toast messages when event listeners are attached
- `(string)`  
 CSS selector to target an element in the last message


Add event listeners to the last chat message.

Stops listening when changing to another chat.

##### **Examples**
```stscript

/message-on event=click quiet=false callback={:
    /$ take=textContent {{target}} |
    /let prompt Continue by weaving the following suggestion into your next response: {{pipe}} |
    /inputhistory-add {{var::prompt}} |
    /send {{var::prompt}} |
    /trigger
:} .custom-suggestion |
/setvar key=listenerId |
```


#### <a id="lalib-help-cmd-message_off"></a>`/message-off`
- `[id:string]?`  
 *(optional)* listener ID
- `[event:string]?`  
 *(optional)* event type to listen for
- `[query:string]?`  
 *(optional)* CSS selector to target an element in the last message
- `[quiet=true|false]? = true`  
 *(optional)* whether to show toast messages when event listeners are attached


Remove an event listener added with /message-on.

##### **Examples**
```stscript

/message-off id={{getvar::listenerId}} |
// All messages: |
```


#### <a id="lalib-help-cmd-message_listeners"></a>`/message-listeners`


Lists all currently active listeners.

##### **Examples**
```stscript

/message-listeners |
```


#### <a id="lalib-help-cmd-role_swap"></a>`/role-swap`
- `(number|range)?`  
 *(optional)* message id or range to swap


Swap roles (user/AI) for all messages in the chat, or for a selected message or range of messages.

##### **Examples**
```stscript

/role-swap |
// All messages: |
```
```stscript

/role-swap {{lastMessageId}} |
// Last message: |
```
```stscript

/role-swap -1 |
// Last message: |
```
```stscript

/role-swap -2 |
// Second to last message: |
```
```stscript

/role-swap 0-10 |
// First 10 messages: |
```
```stscript

/role-swap -10- |
// Last 10 messages: |
```
```stscript

/role-swap 0--10 |
// All messages except last 10: |
```



### <a id="lalib-help-group-Time_Date"></a>Time & Date


#### <a id="lalib-help-cmd-timestamp"></a>`/timestamp`


Returns the number of milliseconds midnight at the beginning of January 1, 1970, UTC.

##### **Examples**
```stscript

/timestamp |
```



### <a id="lalib-help-group-Async"></a>Async


#### <a id="lalib-help-cmd-fireandforget"></a>`/fireandforget`
- `(closure|subcommand)`  
 the closure or command to execute


Execute a closure or command without waiting for it to finish.

##### **Examples**
```stscript

/fireandforget {:
    /delay 1000 |
    /echo firing |
    /delay 1000 |
    /echo fired script is done
:} |
/echo main script is done |
// will show "main script is done", then "firing", then "fired script is done" |
```



### <a id="lalib-help-group-Logging"></a>Logging


#### <a id="lalib-help-cmd-console_log"></a>`/console-log`
- `(string)`  
 the value to log


logs a value to the browser console

##### **Examples**
```stscript

/console-log Hello, World! |
```


#### <a id="lalib-help-cmd-console_warn"></a>`/console-warn`
- `(string)`  
 the value to log


logs a value to the browser console as a warning

##### **Examples**
```stscript

/console-warn This is a warning! |
```


#### <a id="lalib-help-cmd-console_error"></a>`/console-error`
- `(string)`  
 the value to log


logs a value to the browser console as an error

##### **Examples**
```stscript

/console-error OOPS! |
```



### <a id="lalib-help-group-Audio"></a>Audio


#### <a id="lalib-help-cmd-sfx"></a>`/sfx`
- `[volume:number]? = 1.0`  
 *(optional)* playback volume
- `[await=true|false]? = false`  
 *(optional)* whether to wait for the sound to finish playing before continuing
- `(string)`  
 url to audio file


Plays an audio file.

##### **Examples**
```stscript

/sfx volume=1.5 await=true /user/files/mySound.wav | /echo finished playing sound |
```



### <a id="lalib-help-group-Miscellaneous"></a>Miscellaneous


#### <a id="lalib-help-cmd-fonts"></a>`/fonts`


returns a list of all system fonts available to you

##### **Examples**
```stscript

/fonts |
/comment |
```



### <a id="lalib-help-group-Web_Requests"></a>Web Requests


#### <a id="lalib-help-cmd-fetch"></a>`/fetch`
- `(string)`  
 the url to fetch


Fetch the contents of the provided URL.

##### **Examples**
```stscript

/fetch http://example.com |
/echo |
```


#### <a id="lalib-help-cmd-_"></a>`/$`
- `[query:string]?`  
 *(optional)* css selector to query the provided html
- `[take:string]? = outerHTML`  
 *(optional)* property to take from the resulting element
- `[call:string]?`  
 *(optional)* method to call on the resulting element
- `(string)`  
 the html to operate on


Retrieve the first matching element from the provided HTML or call a method on the first
matching element and return the resulting HTML.

##### **Examples**
```stscript

/fetch http://example.com |
/$ query=h1 take=textContent |
/echo |
```


#### <a id="lalib-help-cmd-_"></a>`/$$`
- `[query:string]?`  
 *(optional)* css selector to query the provided html
- `[take:string]? = outerHTML`  
 *(optional)* property to take from the resulting elements
- `[call:string]?`  
 *(optional)* method to call on the resulting elements
- `(string)`  
 the html to operate on


Retrieve all matching elements from the provided HTML or call a method on all
matching elements and return the resulting HTML.

##### **Examples**
```stscript

/fetch http://example.com |
/$$ query=h1 take=textContent |
/echo |
```
