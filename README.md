# LALib

Library of STScript commands.

```
/lalib? 
– Lists LALib commands

/test left=val rule=rule right=val
– Returns true or false, depending on whether left and right adhere to rule. Available rules: gt => a > b, gte => a >= b, lt => a < b, lte => a <= b, eq => a == b, neq => a != b, not => !a, in (strings) => a includes b, nin (strings) => a not includes b

/and left=val right=val
– Returns true if both left and right are true, otherwise false.

/or left=val right=val
– Returns true if at least one of left and right are true, false if both are false.

/not (value)
– Returns true if value is false, otherwise true.

/foreach [optional list=[1,2,3]] [optional var=varname] [optional globalvar=globalvarname] (/command {{item}} {{index}})
– Executes command for each item of a list or dictionary.

/map [optional list=[1,2,3]] [optional var=varname] [optional globalvar=globalvarname] (/command {{item}} {{index}})
– Executes command for each item of a list or dictionary and returns the list or dictionary of the command results.

/filter [optional list=[1,2,3]] [optional var=varname] [optional globalvar=globalvarname] (/command {{item}} {{index}})
– Executes command for each item of a list or dictionary and returns the list or dictionary of only those items where the command returned true.

/find [optional list=[1,2,3]] [optional var=varname] [optional globalvar=globalvarname] (/command {{item}} {{index}})
– Executes command for each item of a list or dictionary and returns the first item where the command returned true.

/join [optional glue=", "] [optional var=varname] [optional globalvar=globalvarname] (optional list)
– Joins the items of a list with glue into a single string. Use glue={{space}} to join with a space.

/split [optional find=","] [optional trim=true|false] [optional var=varname] [optional globalvar=globalvarname] (value)
– Splits value into list at every occurrence of find. Supports regex find=/\s/

/slice start=int [optional end=int] [optional length=int] [optional var=varname] [optional globalvar=globalvarname] (optional value)
– Retrieves a slice of a list or string.

/getat index=int|fieldname [optional var=varname] [optional globalvar=globalvarname] (optional value)
– Retrieves an item from a list or a property from a dictionary.

/setat index=int|fieldname|list [optional var=varname] [optional globalvar=globalvarname] [optional value=list|dictionary] (value)
– Sets an item in a list or a property in a dictionary. Example: /setat value=[1,2,3] index=1 X returns [1,"X",3], /setat var=myVariable index=[1,2,"somePropery"] foobar sets the value of myVariable[1][2].someProperty to "foobar" (the variable will be updated and the resulting value of myVariable will be returned). Can be used to create structures that do not already exist.

/try (command)
– try catch.

/catch [pipe={{pipe}}] (command)
– try catch. You must always set pipe={{pipe}} and /catch must always be called right after /try. Use {{exception}} or {{error}} to get the exception's message.

/copy (value)
– Copies value into clipboard.

/download [optional name=filename] [optional ext=extension] (value)
– Downloads value as a text file.

/fetch (url)
– UNDOCUMENTED

/$ [optional query=cssSelector] [optional take=property] [optional call=property] (html)
– UNDOCUMENTED

/$$ [optional query=cssSelector] [optional take=property] [optional call=property] (html)
– UNDOCUMENTED
```
