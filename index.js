import { characters, chat_metadata, sendSystemMessage } from '../../../../script.js';
import { extension_settings } from '../../../extensions.js';
import { findGroupMemberId, groups, selected_group } from '../../../group-chats.js';
import { executeSlashCommands, registerSlashCommand } from '../../../slash-commands.js';
import { isTrueBoolean } from '../../../utils.js';



/**
 * Parses boolean operands from command arguments.
 * @param {object} args Command arguments
 * @returns {{a: string | number, b: string | number, rule: string}} Boolean operands
 */
function parseBooleanOperands(args) {
    // Resolution order: numeric literal, local variable, global variable, string literal
    /**
     * @param {string} operand Boolean operand candidate
     */
    function getOperand(operand) {
        if (operand === undefined) {
            return '';
        }

        const operandNumber = Number(operand);

        if (!isNaN(operandNumber)) {
            return operandNumber;
        }

        if (chat_metadata?.variables?.[operand] !== undefined) {
            const operandLocalVariable = chat_metadata.variables[operand];
            return operandLocalVariable ?? '';
        }

        if (extension_settings?.variables?.[operand] !== undefined) {
            const operandGlobalVariable = extension_settings.variables[operand];
            return operandGlobalVariable ?? '';
        }

        const stringLiteral = String(operand);
        return stringLiteral || '';
    }

    const left = getOperand(args.a || args.left || args.first || args.x);
    const right = getOperand(args.b || args.right || args.second || args.y);
    const rule = args.rule;

    return { a: left, b: right, rule };
}

/**
 * Evaluates a boolean comparison rule.
 * @param {string} rule Boolean comparison rule
 * @param {string|number} a The left operand
 * @param {string|number} b The right operand
 * @returns {boolean} True if the rule yields true, false otherwise
 */
function evalBoolean(rule, a, b) {
    if (!rule) {
        toastr.warning('The rule must be specified for the boolean comparison.', 'Invalid command');
        throw new Error('Invalid command.');
    }

    let result = false;

    if (typeof a === 'string' && typeof b !== 'number') {
        const aString = String(a).toLowerCase();
        const bString = String(b).toLowerCase();

        switch (rule) {
            case 'in':
                result = aString.includes(bString);
                break;
            case 'nin':
                result = !aString.includes(bString);
                break;
            case 'eq':
                result = aString === bString;
                break;
            case 'neq':
                result = aString !== bString;
                break;
            default:
                toastr.error('Unknown boolean comparison rule for type string.', 'Invalid /if command');
                throw new Error('Invalid command.');
        }
    } else if (typeof a === 'number') {
        const aNumber = Number(a);
        const bNumber = Number(b);

        switch (rule) {
            case 'not':
                result = !aNumber;
                break;
            case 'gt':
                result = aNumber > bNumber;
                break;
            case 'gte':
                result = aNumber >= bNumber;
                break;
            case 'lt':
                result = aNumber < bNumber;
                break;
            case 'lte':
                result = aNumber <= bNumber;
                break;
            case 'eq':
                result = aNumber === bNumber;
                break;
            case 'neq':
                result = aNumber !== bNumber;
                break;
            default:
                toastr.error('Unknown boolean comparison rule for type number.', 'Invalid command');
                throw new Error('Invalid command.');
        }
    }

    return result;
}


function getListVar(local, global, literal) {
    let list;
    if (local) {
        try {
            list = JSON.parse(chat_metadata?.variables?.[local]);
        } catch { /* empty */ }
    }
    if (!list && global) {
        try {
            list = JSON.parse(extension_settings.variables?.global?.[global]);
        } catch { /* empty */ }
    }
    if (!list && literal) {
        if (typeof literal == 'string') {
            try {
                list = JSON.parse(literal);
            } catch { /* empty */ }
        } else if (typeof literal == 'object') {
            list = literal;
        }
    }
    return list;
}

function getVar(local, global, literal) {
    let value;
    if (local) {
        value = chat_metadata?.variables?.[local];
    }
    if (value === undefined && global) {
        value = extension_settings.variables?.global?.[global];
    }
    if (value === undefined && literal) {
        value = literal;
    }
    return value;
}


class Command {
    /**@type {String} */ command;
    /**@type {String} */ args;
    /**@type {String} */ helpText;
    constructor(command, helpText) {
        this.command = command;
        this.args = helpText.split(' – ')[0];
        this.helpText = helpText.split(/(?=– )/)[1];
    }
}
/**@type {Command[]} */
const commandList = [];

/**
 * registerSlashCommand
 * @param {String} command
 * @param {Function} callback
 * @param {String[]} aliasList
 * @param {String} helpText
 * @param {Boolean} a
 * @param {Boolean} b
 */
const rsc = (command, callback, aliasList, helpText, a = true, b = true)=>{
    registerSlashCommand(command, callback, aliasList, helpText, a, b);
    commandList.push(new Command(command, helpText));
};




rsc('lalib?',
    ()=>{
        const cmds = commandList.map(it=>{
            const li = document.createElement('li'); {
                const code = document.createElement('code'); {
                    const cmd = it.command;
                    code.append('/');
                    code.append(cmd);
                    code.append(' ');
                    const q = document.createElement('q'); {
                        const args = document.createRange().createContextualFragment(it.args).textContent;
                        q.append(args);
                        code.append(q);
                    }
                    li.append(code);
                }
                const p = document.createElement('p'); {
                    p.innerHTML = it.helpText;
                    li.append(p);
                }
            }
            return li.outerHTML;
        });
        const message = `
            <ul style='text-align:left;'>
                ${cmds.join('\n')}
            </ul>
        `;
        sendSystemMessage('generic', message);
    },
    [],
    ' – Lists LALib commands',
);


rsc('test',
    (args)=>{
        const { a, b, rule } = parseBooleanOperands(args);
        return JSON.stringify(evalBoolean(rule, a, b));
    },
    [],
    '<span class="monospace">left=val rule=rule right=val</span> – Returns true or false, depending on whether left and right adhere to rule. Available rules: gt => a > b, gte => a >= b, lt => a < b, lte => a <= b, eq => a == b, neq => a != b, not => !a, in (strings) => a includes b, nin (strings) => a not includes b',
    true,
    true,
);

rsc('and',
    (args)=>{
        let left = args.left;
        try { left = JSON.parse(args.left); } catch { /* empty */ }
        let right = args.right;
        try { right = JSON.parse(args.right); } catch { /* empty */ }
        return (left && right) == true;
    },
    [],
    '<span class="monospace">left=val right=val</span> – Returns true if both left and right are true, otherwise false.',
    true,
    true,
);

rsc('or',
    (args)=>{
        let left = args.left;
        try { left = JSON.parse(args.left); } catch { /* empty */ }
        let right = args.right;
        try { right = JSON.parse(args.right); } catch { /* empty */ }
        return (left || right) == true;
    },
    [],
    '<span class="monospace">left=val right=val</span> – Returns true if at least one of left and right are true, false if both are false.',
    true,
    true,
);

rsc('not',
    (args, value)=>{
        return value != true;
    },
    [],
    '<span class="monospace">(value)</span> – Returns true if value is false, otherwise true.',
    true,
    true,
);


rsc('foreach',
    async(args, value)=>{
        let list = getListVar(args.var, args.globalvar, args.list);
        let result;
        const isList = Array.isArray(list);
        if (isList) {
            list = list.map((it,idx)=>[idx,it]);
        } else if (typeof list == 'object') {
            list = Object.entries(list);
        }
        if (Array.isArray(list)) {
            for (let [index,item] of list) {
                if (typeof item == 'object') {
                    item = JSON.stringify(item);
                }
                result = (await executeSlashCommands(value.replace(/{{item}}/ig, item).replace(/{{index}}/ig, index)))?.pipe;
            }
            return result;
        }

        if (typeof result == 'object') {
            result = JSON.stringify(result);
        }
        return result;
    },
    [],
    '<span class="monospace">[optional list=[1,2,3]] [optional var=varname] [optional globalvar=globalvarname] (/command {{item}} {{index}})</span> – Executes command for each item of a list or dictionary.',
    true,
    true,
);

rsc('map',
    async(args, value)=>{
        let list = getListVar(args.var, args.globalvar, args.list);
        let result;
        const isList = Array.isArray(list);
        if (isList) {
            list = list.map((it,idx)=>[idx,it]);
        } else if (typeof list == 'object') {
            list = Object.entries(list);
        }
        if (Array.isArray(list)) {
            for (let [index,item] of list) {
                if (typeof item == 'object') {
                    item = JSON.stringify(item);
                }
                list[index] = (await executeSlashCommands(value.replace(/{{item}}/ig, item).replace(/{{index}}/ig, index)))?.pipe;
            }
            return list;
        }

        if (typeof result == 'object') {
            result = JSON.stringify(result);
        }
        return list;
    },
    [],
    '<span class="monospace">[optional list=[1,2,3]] [optional var=varname] [optional globalvar=globalvarname] (/command {{item}} {{index}})</span> – Executes command for each item of a list or dictionary and returns the list or dictionary of the command results.',
);

rsc('filter',
    async(args, value)=>{
        let list = getListVar(args.var, args.globalvar, args.list);
        let result;
        const isList = Array.isArray(list);
        if (isList) {
            list = list.map((it,idx)=>[idx,it]);
            result = [];
        } else if (typeof list == 'object') {
            list = Object.entries(list);
            result = {};
        }
        if (Array.isArray(list)) {
            for (let [index,item] of list) {
                if (typeof item == 'object') {
                    item = JSON.stringify(item);
                }
                if (isTrueBoolean((await executeSlashCommands(value.replace(/{{item}}/ig, item).replace(/{{index}}/ig, index)))?.pipe)) {
                    if (isList) {
                        result.push(item);
                    } else {
                        result[index] = item;
                    }
                }
            }
        } else {
            result = list;
        }

        if (typeof result == 'object') {
            result = JSON.stringify(result);
        }
        return result;
    },
    [],
    '<span class="monospace">[optional list=[1,2,3]] [optional var=varname] [optional globalvar=globalvarname] (/command {{item}} {{index}})</span> – Executes command for each item of a list or dictionary and returns the list or dictionary of only those items where the command returned true.',
);

rsc('find',
    async(args, value)=>{
        let list = getListVar(args.var, args.globalvar, args.list);
        let result;
        const isList = Array.isArray(list);
        if (isList) {
            list = list.map((it,idx)=>[idx,it]);
            result = [];
        } else if (typeof list == 'object') {
            list = Object.entries(list);
            result = {};
        }
        if (Array.isArray(list)) {
            for (let [index,item] of list) {
                if (typeof item == 'object') {
                    item = JSON.stringify(item);
                }
                if (isTrueBoolean((await executeSlashCommands(value.replace(/{{item}}/ig, item).replace(/{{index}}/ig, index)))?.pipe)) {
                    if (typeof result == 'object') {
                        return JSON.stringify(item);
                    }
                    return item;
                }
            }
            return undefined;
        }
        return undefined;
    },
    [],
    '<span class="monospace">[optional list=[1,2,3]] [optional var=varname] [optional globalvar=globalvarname] (/command {{item}} {{index}})</span> – Executes command for each item of a list or dictionary and returns the first item where the command returned true.',
);


rsc('join',
    (args, value)=>{
        let list = getListVar(args.var, args.globalvar, value);
        if (Array.isArray(list)) {
            const glue = (args.glue ?? ', ')
                .replace(/{{space}}/g, ' ')
            ;
            return list.join(glue);
        }
    },
    [],
    '<span class="monospace">[optional glue=", "] [optional var=varname] [optional globalvar=globalvarname] (optional list)</span> – Joins the items of a list with glue into a single string. Use <code>glue={{space}}</code> to join with a space.',
    true,
    true,
);

rsc('split',
    (args, value)=>{
        value = getListVar(args.var, args.globalvar, value) ?? getVar(args.var, args.globalvar, value);
        let find = args.find ?? ',';
        if (find.match(/^\/.+\/[a-z]*$/)) {
            find = new RegExp(find.replace(/^\/(.+)\/([a-z]*)$/, '$1'), find.replace(/^\/(.+)\/([a-z]*)$/, '$2'));
        }
        return JSON.stringify(value.split(find).map(it=>isTrueBoolean(args.trim ?? 'true') ? it.trim() : it));
    },
    [],
    '<span class="monospace">[optional find=","] [optional trim=true|false] [optional var=varname] [optional globalvar=globalvarname] (value)</span> – Splits value into list at every occurrence of find. Supports regex <code>find=/\\s/</code>',
    true,
    true,
);


rsc('slice',
    (args, value)=>{
        const list = getListVar(args.var, args.globalvar, value) ?? getVar(args.var, args.globalvar, value);
        let end = args.end ?? (args.length ? Number(args.start) + Number(args.length) : undefined);
        const result = list.slice(args.start, end);
        if (typeof result == 'object') {
            return JSON.stringify(result);
        }
        return result;
    },
    [],
    '<span class="monospace">start=int [optional end=int] [optional length=int] [optional var=varname] [optional globalvar=globalvarname] (optional value)</span> – Retrieves a slice of a list or string.',
);


rsc('getat',
    (args, value)=>{
        let index = getListVar(null, null, args.index) ?? [args.index];
        if (!Array.isArray(index)) {
            index = [index];
        }
        const list = getListVar(args.var, args.globalvar, value);
        let result = list;
        while (index.length > 0 && result !== undefined) {
            const ci = index.shift();
            result = Array.isArray(result) ? result.slice(ci)[0] : result[ci];
            try { result = JSON.parse(result); } catch { /* empty */ }
        }
        if (typeof result == 'object') {
            return JSON.stringify(result);
        }
        return result;
    },
    [],
    '<span class="monospace">index=int|fieldname|list [optional var=varname] [optional globalvar=globalvarname] (optional value)</span> – Retrieves an item from a list or a property from a dictionary.',
);

rsc('setat',
    async(args, value)=>{
        try { value = JSON.parse(value); } catch { /* empty */ }
        let index = getListVar(null, null, args.index) ?? [args.index];
        const list = getListVar(args.var, args.globalvar, args.value) ?? (Number.isNaN(Number(index[0])) ? {} : []);
        if (!Array.isArray(index)) {
            index = [index];
        }
        let current = list;
        while (index.length > 0) {
            const ci = index.shift();
            if (index.length > 0 && current[ci] === undefined) {
                if (Number.isNaN(Number(index[0]))) {
                    current[ci] = {};
                } else {
                    current[ci] = [];
                }
            }
            if (index.length == 0) {
                current[ci] = value;
            }
            const prev = current;
            current = current[ci];
            try {
                current = JSON.parse(current);
                prev[ci] = current;
            } catch { /* empty */ }
        }
        if (list !== undefined) {
            let result = (typeof list == 'object') ? JSON.stringify(list) : list;
            if (args.var) {
                await executeSlashCommands(`/setvar key="${args.var}" ${result.replace(/\|/g, '\\|')}`);
            }
            if (args.globalvar) {
                await executeSlashCommands(`/setglobalvar key="${args.globalvar}" ${result.replace(/\|/g, '\\|')}`);
            }
            return result;
        }
    },
    [],
    '<span class="monospace">index=int|fieldname|list [optional var=varname] [optional globalvar=globalvarname] [optional value=list|dictionary] (value)</span> – Sets an item in a list or a property in a dictionary. Example: <code>/setat value=[1,2,3] index=1 X</code> returns <code>[1,"X",3]</code>, <code>/setat var=myVariable index=[1,2,"somePropery"] foobar</code> sets the value of <code>myVariable[1][2].someProperty</code> to "foobar" (the variable will be updated and the resulting value of myVariable will be returned). Can be used to create structures that do not already exist.',
);


rsc('try',
    async(args, value)=>{
        try {
            const result = await executeSlashCommands(value);
            return JSON.stringify({
                isException: false,
                result: result.pipe,
            });
        } catch (ex) {
            return JSON.stringify({
                isException: true,
                exception: ex?.message ?? ex,
            });
        }
    },
    [],
    '<span class="monospace">(command)</span> – try catch.',
);

rsc('catch',
    async(args, value)=>{
        if (args.pipe) {
            let data;
            try {
                data = JSON.parse(args.pipe);
            } catch (ex) {
                console.warn('[LALIB]', '[CATCH]', 'failed to parse args.pipe', args.pipe, ex);
            }
            if (data?.isException) {
                const result = await executeSlashCommands(value.replace(/{{(exception|error)}}/ig, data.exception));
                return result.pipe;
            } else {
                return data?.result;
            }
        }
    },
    [],
    '<span class="monospace">[pipe={{pipe}}] (command)</span> – try catch. You must always set <code>pipe={{pipe}}</code> and /catch must always be called right after /try. Use <code>{{exception}}</code> or <code>{{error}}</code> to get the exception\'s message.',
);


rsc('copy',
    (args, value)=>{
        const ta = document.createElement('textarea'); {
            ta.value = value;
            ta.style.position = 'fixed';
            ta.style.inset = '0';
            document.body.append(ta);
            ta.focus();
            ta.select();
            try {
                document.execCommand('copy');
            } catch (err) {
                console.error('Unable to copy to clipboard', err);
            }
            ta.remove();
        }
    },
    [],
    '<span class="monospace">(value)</span> – Copies value into clipboard.',
    true,
    true,
);

rsc('download',
    (args, value)=>{
        const blob = new Blob([value], { type:'text' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); {
            a.href = url;
            const name = args.name ?? `SillyTavern-${new Date().toISOString()}`;
            const ext = args.ext ?? 'txt';
            a.download = `${name}.${ext}`;
            a.click();
        }
    },
    [],
    '<span class="monospace">[optional name=filename] [optional ext=extension] (value)</span> – Downloads value as a text file.',
    true,
    true,
);


rsc('dom',
    (args, query)=>{
        /**@type {HTMLElement} */
        let target;
        try {
            target = document.querySelector(query);
        } catch (ex) {
            toastr.error(ex?.message ?? ex);
        }
        if (!target) {
            toastr.warning(`No element found for query: ${query}`);
            return;
        }
        switch (args.action) {
            case 'click': {
                target.click();
                break;
            }
            case 'value': {
                if (target.value === undefined) {
                    toastr.warning(`Cannot set value on ${target.tagName}`);
                    return;
                }
                target.value = args.value;
                target.dispatchEvent(new Event('change', { bubbles:true }));
                return;
            }
            case 'property': {
                if (target[args.property] === undefined) {
                    toastr.warning(`Property does not exist: ${target.tagName}`);
                    return;
                }
                return target[args.property];
            }
            case 'attribute': {
                return target.getAttribute(args.attribute);
            }
        }
    },
    [],
    '<span class="monospace">[action=click|value|property] [optional value=newValue] [optional property=propertyName] [optional attribute=attributeName] (CSS selector)</span> – Click on an element, change its value, retrieve a property, or retrieve an attribute. To select the targeted element, use CSS selectors. Example: <code>/dom action=click #expandMessageActions</code> or <code>/dom action=value value=0 #avatar_style</code>',
);


rsc('memberpos',
    async(args, value)=>{
        if (!selected_group) {
            toastr.warning('Cannot run /memberpos command outside of a group chat.');
            return '';
        }
        const group = groups.find(it=>it.id == selected_group);
        const name = value.replace(/^(.+?)(\s+(\d+))?$/, '$1');
        const char = characters[findGroupMemberId(name)];
        let index = value.replace(/^(.+?)(\s+(\d+))?$/, '$2');
        let currentIndex = group.members.findIndex(it=>it == char.avatar);
        if (index === null) {
            return currentIndex;
        }
        index = Math.min(group.members.length - 1, parseInt(index));
        while (currentIndex < index) {
            await executeSlashCommands(`/memberdown ${name}`);
            currentIndex++;
        }
        while (currentIndex > index) {
            await executeSlashCommands(`/memberup ${name}`);
            currentIndex--;
        }
        return currentIndex;
    },
    [],
    '<span class="monospace">(name) (position)</span> – Move group member to position (index starts with 0).</code>',
);


rsc('switch',
    (args, value)=>{
        const val = getVar(args.var, args.globalvar, value);
        return JSON.stringify({
            switch: val,
        });
    },
    [],
    '<span class="monospace">[optional var=varname] [optional globalvar=globalvarname] (optional value)</span> – Use with /case.',
);

rsc('case',
    async (args, value)=>{
        if (args.pipe) {
            let data;
            try {
                data = JSON.parse(args.pipe);
            } catch (ex) {
                console.warn('[LALIB]', '[CASE]', 'failed to parse args.pipe', args.value, ex);
            }
            if (data?.switch !== undefined) {
                if (data.switch == args.value) {
                    return (await executeSlashCommands(value.replace(/{{value}}/ig, data.switch)))?.pipe;
                }
            }
            return args.pipe;
        }
    },
    [],
    '<span class="monospace">[pipe={{pipe}}] [value=comparisonValue] (/command)</span> – Execute command and break out of the switch if the value given in /switch matches the value given here.',
);


rsc('ife',
    async(args, value)=>{
        const result = await executeSlashCommands(value);
        return JSON.stringify({
            if: isTrueBoolean(result?.pipe),
        });
    },
    [],
    '<span class="monospace">(/command)</span> – Use with /then, /elseif, and /else. The provided command must return true or false.',
);

rsc('elseif',
    async(args, value)=>{
        if (args.pipe) {
            let data;
            try {
                data = JSON.parse(args.pipe);
            } catch (ex) {
                console.warn('[LALIB]', '[ELSEIF]', 'failed to parse args.pipe', args.value, ex);
            }
            if (data?.if !== undefined) {
                if (!data.if) {
                    const result = await executeSlashCommands(value);
                    return JSON.stringify({
                        if: isTrueBoolean(result?.pipe),
                    });
                }
            }
        }
        return args.pipe;
    },
    [],
    '<span class="monospace">[pipe={{pipe}}] (/command)</span> – Use with /ife, /then, and /else. The provided command must return true or false.',
);

rsc('else',
    async(args, value)=>{
        if (args.pipe) {
            let data;
            try {
                data = JSON.parse(args.pipe);
            } catch (ex) {
                console.warn('[LALIB]', '[ELSE]', 'failed to parse args.pipe', args.value, ex);
            }
            if (data?.if !== undefined) {
                if (!data.if) {
                    const result = await executeSlashCommands(value);
                    return result.pipe;
                }
            }
        }
        return args.pipe;
    },
    [],
    '<span class="monospace">[pipe={{pipe}}] (/command)</span> – Use with /ife, /elseif, and /then. The provided command will be executed if the previous /if or /elseif was false.',
);

rsc('then',
    async(args, value)=>{
        if (args.pipe) {
            let data;
            try {
                data = JSON.parse(args.pipe);
            } catch (ex) {
                console.warn('[LALIB]', '[THEN]', 'failed to parse args.pipe', args.value, ex);
            }
            if (data?.if !== undefined) {
                if (data.if) {
                    const result = await executeSlashCommands(value);
                    return result.pipe;
                }
            }
        }
        return args.pipe;
    },
    [],
    '<span class="monospace">[pipe={{pipe}}] (/command)</span> – Use with /ife, /elseif, and /else. The provided command will be executed if the previous /if or /elseif was true.',
);


rsc('fetch',
    async(args, value)=>{
        if (!window.stfetch) {
            toastr.error('Userscript missing: SillyTavern - Fetch');
            throw new Error('Userscript missing: SillyTavern - Fetch');
        }
        try {
            const response = await window.stfetch({ url:value });
            return response.responseText;
        }
        catch (ex) {
            console.warn('[LALIB]', '[FETCH]', ex);
        }
    },
    [],
    '<span class="monospace">(url)</span> – UNDOCUMENTED',
);

rsc('$',
    (args, value)=>{
        const dom = document.createRange().createContextualFragment(value);
        let el;
        if (args.query) {
            el = dom.querySelector(args.query);
        } else if (dom.children.length == 1) {
            el = dom.children[0];
        } else {
            el = document.createElement('div');
            el.append(...dom.children);
        }
        if (args.call) {
            el[args.call]();
            return [...dom.children].map(it=>it.outerHTML).join('\n');
        } else {
            const result = el?.[args.take ?? 'outerHTML'];
            if (typeof result == 'object') {
                return JSON.stringify(result);
            }
            return result;
        }
    },
    [],
    '<span class="monospace">[optional query=cssSelector] [optional take=property] [optional call=property] (html)</span> – UNDOCUMENTED',
);

rsc('$$',
    (args, value)=>{
        const dom = document.createRange().createContextualFragment(value);
        let els;
        if (args.query) {
            els = Array.from(dom.querySelectorAll(args.query));
        } else {
            els = Array.from(dom.children);
        }
        if (args.call) {
            els.forEach(el=>el[args.call]());
            return [...dom.children].map(it=>it.outerHTML).join('\n');
        } else {
            const result = els.map(el=>el?.[args.take ?? 'outerHTML']);
            if (typeof result == 'object') {
                return JSON.stringify(result);
            }
            return result;
        }
    },
    [],
    '<span class="monospace">[optional query=cssSelector] [optional take=property] [optional call=property] (html)</span> – UNDOCUMENTED',
);
