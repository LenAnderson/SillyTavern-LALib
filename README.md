# LALib

Library of STScript commands.

```
/lalib?
 – Lists this library's slash commands.

/test left=val rule=rule right=val
 – Returns true or false, depending on whether left and right adhere to rule. Available rules: gt => a > b, gte => a >= b, lt => a < b, lte => a <= b, eq => a == b, neq => a != b, not => !a, in (strings) => a includes b, nin (strings) => a not includes b

/and left=val right=val
 – Returns true if both left and right are true, otherwise false.

/or left=val right=val
 – Returns true if at least one of left and right are true, false if both are false.

/not (value)
 – Returns true if value is false, otherwise true.

/foreach [optional list=[1,2,3]] [optional var=varname] [optional globalvar=globalvarname] (/command {{item}})
 – Executes command for each item of a list or dictionary.

/join [optional glue=", "] [optional var=varname] [optional globalvar=globalvarname] (optional list)
 – Joins the items of a list with glue into a single string. Use glue={{space}} to join with a space.

/split [optional find=","] [optional trim=true|false] (value)
 – Splits value into list at every occurrence of find. Supports regex find=/\s/

/slice start=int [optional end=int] [optional length=int] [optional var=varname] [optional globalvar=globalvarname] (optional value)
 – Retrieves a slice of a list or string.

/getat index=int|fieldname [optional var=varname] [optional globalvar=globalvarname] (optional value)
 – Retrieves an item from a list or a property from a dictionary.

/copy (value)
 – Copies value to clipboard.

/download [optional name=filename] [optional ext=extension] (value)
 – Downloads value as text file.
```
