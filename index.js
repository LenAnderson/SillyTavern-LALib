import { characters, chat, chat_metadata, eventSource, event_types, extractMessageBias, getRequestHeaders, messageFormatting, reloadMarkdownProcessor, saveChatConditional, saveChatDebounced, saveSettingsDebounced, sendSystemMessage, showSwipeButtons, this_chid } from '../../../../script.js';
import { getMessageTimeStamp } from '../../../RossAscends-mods.js';
import { extension_settings, getContext, saveMetadataDebounced } from '../../../extensions.js';
import { findGroupMemberId, getGroupPastChats, groups, selected_group } from '../../../group-chats.js';
import { Popup, POPUP_TYPE } from '../../../popup.js';
import { executeSlashCommands, executeSlashCommandsWithOptions } from '../../../slash-commands.js';
import { SlashCommand } from '../../../slash-commands/SlashCommand.js';
import { SlashCommandAbortController } from '../../../slash-commands/SlashCommandAbortController.js';
import { ARGUMENT_TYPE, SlashCommandArgument, SlashCommandNamedArgument } from '../../../slash-commands/SlashCommandArgument.js';
import { SlashCommandBreakController } from '../../../slash-commands/SlashCommandBreakController.js';
import { SlashCommandClosure } from '../../../slash-commands/SlashCommandClosure.js';
import { SlashCommandClosureResult } from '../../../slash-commands/SlashCommandClosureResult.js';
import { enumIcons } from '../../../slash-commands/SlashCommandCommonEnumsProvider.js';
import { enumTypes, SlashCommandEnumValue } from '../../../slash-commands/SlashCommandEnumValue.js';
import { SlashCommandNamedArgumentAssignment } from '../../../slash-commands/SlashCommandNamedArgumentAssignment.js';
import { SlashCommandParser } from '../../../slash-commands/SlashCommandParser.js';
import { debounce, delay, escapeRegex, isFalseBoolean, isTrueBoolean, uuidv4 } from '../../../utils.js';
import { evalBoolean, parseBooleanOperands } from '../../../variables.js';
import { getWorldInfoPrompt, world_info } from '../../../world-info.js';
import { quickReplyApi } from '../../quick-reply/index.js';
import { QuickReplySet } from '../../quick-reply/src/QuickReplySet.js';
import { BoolParser } from './src/BoolParser.js';


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
                const parsed = JSON.parse(literal);
                if (Array.isArray(parsed) || typeof parsed == 'object') {
                    list = parsed;
                }
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
    if (value === undefined && literal != null) {
        value = literal;
    }
    return value;
}

function getRange(text, value) {
    const re = /^(-?\d+)(?:(-)(-?\d+)?)?$/;
    if (!re.test(text)) {
        throw new Error(`Invalid range: "${text}"`);
    }
    let [_, start, isRange, end] = re.exec(text);
    start = Number(start);
    if (!isRange) {
        if (start == -1) {
            return value.slice(start);
        }
        return value.slice(start, start + 1);
    }
    if (end === undefined) {
        return value.slice(start);
    }
    return value.slice(start, Number(end) + 1);
}

function isTrueFlag(value) {
    return isTrueBoolean((value ?? 'false') || 'true');
}

function makeBoolEnumProvider() {
    return (executor, scope)=>[
        new SlashCommandEnumValue('bool', 'true  |  false', enumTypes.enum, enumIcons.boolean, (input)=>true, (input)=>input),
        new SlashCommandEnumValue('string', '\'...\' ← single quotes!', enumTypes.enum, enumIcons.boolean, (input)=>true, (input)=>input),
        new SlashCommandEnumValue('number', '1.23', enumTypes.enum, enumIcons.boolean, (input)=>true, (input)=>input),
        new SlashCommandEnumValue('variable', 'a  |  a.property  |  a*.property', enumTypes.enum, enumIcons.boolean, (input)=>true, (input)=>input),
        new SlashCommandEnumValue('macro', '{...} ← single curlies!', enumTypes.enum, enumIcons.boolean, (input)=>true, (input)=>input),
        new SlashCommandEnumValue('negation', '!a', enumTypes.enum, enumIcons.boolean, (input)=>true, (input)=>input),
        new SlashCommandEnumValue('logical operator', 'a and b  |  a xor b  |  a or b', enumTypes.enum, enumIcons.boolean, (input)=>true, (input)=>input),
        new SlashCommandEnumValue('sub-expression', '(...)', enumTypes.enum, enumIcons.boolean, (input)=>true, (input)=>input),
        new SlashCommandEnumValue('comparison operator', 'a == b  |  a != b  |  a &gt; b  |  a &gt;= b  |  a &lt; b  |  a &lt;= b  |  a in b  |  a not in b  | a <=> b', enumTypes.enum, enumIcons.boolean, (input)=>true, (input)=>input),
        new SlashCommandEnumValue('type check', 'a is string  |  a is number  |  a is boolean  |  a is list  |  a is dictionary  |  a is closure', enumTypes.enum, enumIcons.boolean, (input)=>true, (input)=>input),
        new SlashCommandEnumValue('regex', '/pattern/flags ← escape pipes! \\|', enumTypes.enum, enumIcons.boolean, (input)=>true, (input)=>input),
        new SlashCommandEnumValue('arithmetic operator', 'a + b  |  a - b  |  a * b  |  a / b  |  a // b  |  a % b  |  a ** b', enumTypes.enum, enumIcons.boolean, (input)=>true, (input)=>input),
        new SlashCommandEnumValue('assignment', 'only at start:  a = b  |  a += b  |  a -= b  |  a *= b  |  a /= b  |  a //= b  |  a %= b  |  a **= b', enumTypes.enum, enumIcons.boolean, (input)=>true, (input)=>input),
        new SlashCommandEnumValue('pre / post increment / decrement', '++a  |  a++  |  --a  |  a--', enumTypes.enum, enumIcons.boolean, (input)=>true, (input)=>input),
    ];
}
function makeBoolArgument() {
    return SlashCommandArgument.fromProps({ description: 'boolean / arithmetic expression',
        enumProvider: makeBoolEnumProvider(),
        isRequired: true,
        acceptsMultiple: true,
    });
}
function makeBoolOrClosureEnumProvider(offset = 0) {
    return (executor, scope)=>{
        // no args
        //  -> start expression, start bool closure
        if (executor.unnamedArgumentList.length == 0 + offset || executor.unnamedArgumentList.at(0 + offset).value == '') {
            return [
                ...makeBoolEnumProvider()(),
                new SlashCommandEnumValue('Closure', 'Closure returning true or false', enumTypes.command, enumIcons.closure, (input)=>true, (input)=>input),
            ];
        }
        // 1 arg, starts with {:
        //  -> continue bool closure
        if (executor.unnamedArgumentList.length == 1 + offset && executor.unnamedArgumentList.at(0 + offset).value.toString().startsWith('{:')) {
            return [
                new SlashCommandEnumValue('Closure', 'Closure returning true or false', enumTypes.command, enumIcons.closure, (input)=>true, (input)=>input),
            ];
        }
        // 1+ arg
        //  -> continue expression
        if (executor.unnamedArgumentList.length >= 1 + offset) {
            return [
                ...makeBoolEnumProvider()(),
            ];
        }
        return [
            new SlashCommandEnumValue('What?', 'What?', enumTypes.enum, enumIcons.undefined, (input)=>true, (input)=>input),
        ];
    };
}
function makeIfWhileEnumProvider(type) {
    return (executor, scope)=>{
        // no args
        //  -> start expression, start bool closure
        if (executor.unnamedArgumentList.length == 0 || executor.unnamedArgumentList.at(0).value == '') {
            return [
                ...makeBoolEnumProvider()(),
                new SlashCommandEnumValue('Closure', 'Closure returning true or false', enumTypes.command, enumIcons.closure, (input)=>true, (input)=>input),
            ];
        }
        // 1 arg, starts curly
        //  -> continue bool closure
        if (executor.unnamedArgumentList.length == 1 && executor.unnamedArgumentList.at(0).value.toString().startsWith('{:')) {
            return [
                new SlashCommandEnumValue('Closure', 'Closure returning true or false', enumTypes.command, enumIcons.closure, (input)=>true, (input)=>input),
            ];
        }
        // 1 arg, closure
        //  -> start then closure
        if (executor.unnamedArgumentList.length == 1 && executor.unnamedArgumentList.at(0).value instanceof SlashCommandClosure && !executor.unnamedArgumentList.at(0).value.executeNow) {
            return [
                new SlashCommandEnumValue('Closure', `Closure to execute ${type} true`, enumTypes.command, enumIcons.closure, (input)=>true, (input)=>input),
            ];
        }
        // 1 arg, whitespace after
        //  -> continue expression, start then closure
        // if (executor.unnamedArgumentList.length == 1 && executor.unnamedArgumentList.at(0).end < executor.endUnnamedArgs) {
        if (executor.unnamedArgumentList.length == 1 && executor.unnamedArgumentList.at(0).end > executor.unnamedArgumentList.at(0).start + executor.unnamedArgumentList.at(0).value.length) {
            return [
                ...makeBoolEnumProvider()(),
                new SlashCommandEnumValue('Closure', `Closure to execute ${type} true`, enumTypes.command, enumIcons.closure, (input)=>true, (input)=>input),
            ];
        }
        // 1 arg
        //  -> continue expression
        if (executor.unnamedArgumentList.length == 1) {
            return [
                ...makeBoolEnumProvider()(),
            ];
        }
        // >1 args, 2 closures
        //  -> nothing
        if (executor.unnamedArgumentList.length > 1 && executor.unnamedArgumentList.filter(it=>it.value instanceof SlashCommandClosure && !it.value.executeNow).length >= 2) {
            return [
            ];
        }
        // >1 args, [>1] is closure
        //  -> nothing
        if (executor.unnamedArgumentList.length > 1 && executor.unnamedArgumentList.slice(1).find(it=>it.value instanceof SlashCommandClosure && !it.value.executeNow)) {
            return [
            ];
        }
        // >1 args, [0] is closure
        //  -> continue then closure
        if (executor.unnamedArgumentList.length > 1 && executor.unnamedArgumentList.at(0).value instanceof SlashCommandClosure && !executor.unnamedArgumentList.at(0).value.executeNow) {
            return [
                new SlashCommandEnumValue('Closure', `Closure to execute ${type} true`, enumTypes.command, enumIcons.closure, (input)=>true, (input)=>input),
            ];
        }
        // >1 args, [-1] starts curly
        //  -> continue then closure
        if (executor.unnamedArgumentList.length > 1 && executor.unnamedArgumentList.at(-1).value.toString().startsWith('{:')) {
            return [
                new SlashCommandEnumValue('Closure', `Closure to execute ${type} true`, enumTypes.command, enumIcons.closure, (input)=>true, (input)=>input),
            ];
        }
        // >1 args, whitespace after
        //  -> continue expression, start then closure
        if (executor.unnamedArgumentList.length > 1 && executor.unnamedArgumentList.at(-1).end > executor.unnamedArgumentList.at(-1).start + executor.unnamedArgumentList.at(-1).value.length) {
            return [
                ...makeBoolEnumProvider()(),
                new SlashCommandEnumValue('Closure', `Closure to execute ${type} true`, enumTypes.command, enumIcons.closure, (input)=>true, (input)=>input),
            ];
        }
        // >1 args
        //  -> continue expression
        if (executor.unnamedArgumentList.length > 1) {
            return [
                ...makeBoolEnumProvider()(),
            ];
        }
        return [
            new SlashCommandEnumValue('What?', 'What?', enumTypes.enum, enumIcons.undefined, (input)=>true, (input)=>input),
        ];
    };
}



const trim = (txt)=>{
    if (txt.split('\n').length < 2) return txt;
    const indent = /^([     ]*)\S/m.exec(txt)?.[1] ?? '';
    const re = new RegExp(`^${indent}`, 'mg');
    return txt.replace(re, '').replace(/\s*$/s, '');
};
let help = (text, ex)=>{
    const converter = new showdown.Converter({
        emoji: true,
        literalMidWordUnderscores: true,
        parseImgDimensions: true,
        tables: true,
        underline: true,
        simpleLineBreaks: false,
        strikethrough: true,
        disableForced4SpacesIndentedSublists: true,
    });
    return [
        text ? converter.makeHtml(trim(text)) : '# HELP MISSING',
        ex ? examples(ex) : '# EXAMPLES MISSING',
    ].filter(it=>it).join('\n\n');
};
/**
 *
 * @param {[code:string, comment:string][]} list
 */
let examples = (list)=>{
    const dom = document.createElement('div'); {
        const title = document.createElement('strong'); {
            title.textContent = 'Examples:';
            dom.append(title);
        }
        const ul = document.createElement('ul'); {
            for (const [code, comment] of list) {
                const li = document.createElement('li'); {
                    const pre = document.createElement('pre'); {
                        const c = document.createElement('code'); {
                            c.classList.add('language-stscript');
                            c.textContent = trim(code).trim();
                            pre.append(c);
                        }
                        li.append(pre);
                    }
                    const comm = document.createElement('span'); {
                        comm.innerHTML = comment;
                        li.append(comm);
                    }
                    ul.append(li);
                }
            }
            dom.append(ul);
        }
    }
    return dom.outerHTML;
};

document.body.addEventListener('click', (evt)=>{
    const exec = /**@type {HTMLElement}*/(evt.target).closest?.('[data-lalib-exec]')?.getAttribute('data-lalib-exec');
    if (exec) {
        executeSlashCommandsWithOptions(exec);
    }
});




// GROUP: Help
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'lalib?',
    callback: async(args, value)=>{
        const converter = reloadMarkdownProcessor();
        let file;
        switch (value) {
            case 'expressions': {
                file = '/expressions';
                break;
            }
            default: {
                file = '';
                break;
            }
        }
        const readme = await (await fetch(`/scripts/extensions/third-party/SillyTavern-LALib/README${file}.md`)).text();
        const html = converter.makeHtml(readme).replace(/<br\s*\/?>/g, '<br style="display:block;">');
        sendSystemMessage('generic', html);
        [...document.querySelectorAll('#chat .mes.last_mes [target="_blank"]')].forEach(it=>it.target='');
        return '';
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'help topic',
            typeList: [ARGUMENT_TYPE.STRING],
            enumList: [
                new SlashCommandEnumValue('slash', '(default) documentation of all slash commands'),
                new SlashCommandEnumValue('expressions', 'boolean / arithmetic expressions'),
            ],
            defaultValue: 'slash',
        }),
    ],
    helpString: help(
        'Lists LALib commands',
        [
            ['/lalib?', 'command documentation'],
            ['/lalib? expressions', 'expressions documentation'],
        ],
    ),
}));



// GROUP: Boolean Operations
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: '=',
    /**
     *
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments} args
     * @param {string} value
     * @returns {string}
     */
    callback: (args, value)=>{
        const parser = new BoolParser(args._scope, args);
        const result = parser.parse(value);
        const resultValue = result();
        if (typeof resultValue == 'string') return resultValue;
        if (resultValue === undefined || resultValue === null) return '';
        return JSON.stringify(resultValue);
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'expression variables',
            description: 'named arguments assigned to scoped variables to be used in the expression',
            acceptsMultiple: true,
            typeList: [ARGUMENT_TYPE.BOOLEAN, ARGUMENT_TYPE.CLOSURE, ARGUMENT_TYPE.DICTIONARY, ARGUMENT_TYPE.LIST, ARGUMENT_TYPE.NUMBER, ARGUMENT_TYPE.STRING],
        }),
    ],
    unnamedArgumentList: [
        makeBoolArgument(),
    ],
    // splitUnnamedArgument: true,
    returns: 'result of the expression',
    helpString: help(
        `
            Evaluates a boolean or arithmetic expression

            See <a data-lalib-exec="/lalib? expressions"><code>/lalib? expressions</code></a> for more details
            on expressions.
        `,
        [
            ['/= true or false', ''],
            ['/= 1 < 2 and (\'a\' in x or \'b\' not in y) and !z', ''],
            ['/= 1 + 2 * 3 ** 4', ''],
            ['/= (1 + 2) * 3 ** 4', ''],
            [
                `
                    /genraw say either foo or bar |
                    /= result={{pipe}} ('foo' in result) |
                `,
                'use named arguments to provide variables to the expression',
            ],
        ],
    ),
}));


SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'test',
    callback: (args) => {
        const { a, b, rule } = parseBooleanOperands(args);
        return JSON.stringify(evalBoolean(rule, a, b));
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'left',
            description: 'the left operand value',
            typeList: [ARGUMENT_TYPE.VARIABLE_NAME, ARGUMENT_TYPE.NUMBER, ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
        SlashCommandNamedArgument.fromProps({ name: 'rule',
            description: 'the boolean operation rule',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
            enumList: [
                new SlashCommandEnumValue('gt',  'a > b'),
                new SlashCommandEnumValue('gte', 'a >= b'),
                new SlashCommandEnumValue('lt',  'a < b'),
                new SlashCommandEnumValue('lte', 'a <= b'),
                new SlashCommandEnumValue('eq',  'a == b'),
                new SlashCommandEnumValue('neq', 'a !== b'),
                new SlashCommandEnumValue('not', '!a'),
                new SlashCommandEnumValue('in',  'a includes b'),
                new SlashCommandEnumValue('nin', 'a not includes b'),
            ],
        }),
        SlashCommandNamedArgument.fromProps({ name: 'right',
            description: 'the right operand value',
            typeList: [ARGUMENT_TYPE.VARIABLE_NAME, ARGUMENT_TYPE.NUMBER, ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    helpString: help(
        `
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
        `,
        [
            [
                `
                    /setvar key=i 0 | /test left=i rule=lte right=10 | /echo
                `,
                'returns <code>true</code>',
            ],
        ],
    ),
    returns: 'true or false',
}));


SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'and',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  left:string,
     *  right:string
     * }} args
     * @param {string[]} value
     * @returns
     */
    callback: (args, value) => {
        if (args.left !== undefined && args.right !== undefined) {
            toastr.warning('Using left= and right= in /and is deprecated, please update your script to use unnamed arguments instead.', '/and (LALib)', { preventDuplicates:true });
            /**@type {string|boolean} */
            let left = args.left;
            try { left = isTrueBoolean(args.left); } catch { /*empty*/ }
            /**@type {string|boolean} */
            let right = args.right;
            try { right = isTrueBoolean(args.right); } catch { /*empty*/ }
            return JSON.stringify((left && right) == true);
        }
        for (let v of value) {
            let vv;
            try { vv = isTrueBoolean(v); } catch { /*empty*/ }
            if (!(vv ?? v)) return JSON.stringify(false);
        }
        return JSON.stringify(true);
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'the values to evaluate',
            typeList: [ARGUMENT_TYPE.BOOLEAN],
            acceptsMultiple: true,
            isRequired: true,
        }),
    ],
    splitUnnamedArgument: true,
    returns: 'true or false',
    helpString: help(
        `
            Returns true if all values are true, otherwise false.
        `,
        [
            [
                `
                    /and true true true
                `,
                'Returns true.',
            ],
            [
                `
                    /and true false true
                `,
                'Returns false.',
            ],
        ],
    ),
}));


SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'or',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  left:string,
     *  right:string
     * }} args
     * @param {string[]} value
     * @returns
     */
    callback: (args, value) => {
        if (args.left !== undefined && args.right !== undefined) {
            toastr.warning('Using left= and right= in /or is deprecated, please update your script to use unnamed arguments instead.', '/or (LALib)', { preventDuplicates:true });
            /**@type {string|boolean} */
            let left = args.left;
            try { left = isTrueBoolean(args.left); } catch { /*empty*/ }
            /**@type {string|boolean} */
            let right = args.right;
            try { right = isTrueBoolean(args.right); } catch { /*empty*/ }
            return JSON.stringify((left || right) == true);
        }
        for (let v of value) {
            let vv;
            try { vv = isTrueBoolean(v); } catch { /*empty*/ }
            if ((vv ?? v)) return JSON.stringify(true);
        }
        return JSON.stringify(false);
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'the values to evaluate',
            typeList: [ARGUMENT_TYPE.BOOLEAN],
            acceptsMultiple: true,
            isRequired: true,
        }),
    ],
    splitUnnamedArgument: true,
    returns: 'true or false',
    helpString: help(
        `
            Returns true if at least one of the values is true, false if all are false.
        `,
        [
            [
                `
                    /or true true true
                `,
                'Returns true.',
            ],
            [
                `
                    /or true false true
                `,
                'Returns true.',
            ],
            [
                `
                    /or false false false
                `,
                'Returns false.',
            ],
        ],
    ),
}));


SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'not',
    callback: (args, value) => {
        return JSON.stringify(isTrueBoolean(value) != true);
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the value to negate',
            typeList: [ARGUMENT_TYPE.BOOLEAN],
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            Returns true if value is false, otherwise true.
        `,
        [
            [
                `
                    /not false
                `,
                'Returns true.',
            ],
            [
                `
                    /not true
                `,
                'Returns false.',
            ],
        ],
    ),
    returns: 'true or false',
}));



// GROUP: List Operations and Loops
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'pop',
    /**
     *
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments} args
     * @param {string} target
     * @returns {string}
     */
    callback: (args, target)=>{
        /**@type {()=>[]} */
        let get;
        let set;
        if (args._scope.existsVariable(target)) {
            get = ()=>JSON.parse(args._scope.getVariable(target));
            set = ()=>args._scope.setVariable(target, JSON.stringify(list));
        } else if (chat_metadata.variables && chat_metadata.variables[target] !== undefined) {
            get = ()=>JSON.parse(chat_metadata.variables[target]);
            set = ()=>{
                chat_metadata.variables[target] = list;
                saveMetadataDebounced();
            };
        } else if (extension_settings.variables.global && extension_settings.variables.global[target] !== undefined) {
            get = ()=>JSON.parse(extension_settings.variables.global[target]);
            set = ()=>{
                extension_settings.variables.global[target] = list;
                saveSettingsDebounced();
            };
        } else {
            get = ()=>JSON.parse(target);
            set = ()=>{};
        }
        const list = get();
        const value = list.pop();
        set();
        if (typeof value == 'string') {
            return value;
        }
        return JSON.stringify(value);
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'target list',
            typeList: [ARGUMENT_TYPE.VARIABLE_NAME, ARGUMENT_TYPE.LIST],
            isRequired: true,
        }),
    ],
    returns: 'The removed element',
    helpString: help(
        `
            Removes the last element from a list and returns it.
        `,
        [
            [
                `
                    /pop ["A", "B", "C"] |
                `,
                'returns <code>C</code>',
            ],
            [
                `
                    /let x [1, 2, 3, 4, 5] |
                    /pop x |
                `,
                'returns <code>5</code>',
            ],
        ],
    ),
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'push',
    /**
     *
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments} args
     * @param {[target:string, ...items:string]} param1
     * @returns {string}
     */
    callback: (args, [target, ...items])=>{
        /**@type {()=>Array} */
        let get;
        let set;
        if (args._scope.existsVariable(target)) {
            get = ()=>JSON.parse(args._scope.getVariable(target));
            set = ()=>args._scope.setVariable(target, JSON.stringify(list));
        } else if (chat_metadata.variables && chat_metadata.variables[target] !== undefined) {
            get = ()=>JSON.parse(chat_metadata.variables[target]);
            set = ()=>{
                chat_metadata.variables[target] = list;
                saveMetadataDebounced();
            };
        } else if (extension_settings.variables.global && extension_settings.variables.global[target] !== undefined) {
            get = ()=>JSON.parse(extension_settings.variables.global[target]);
            set = ()=>{
                extension_settings.variables.global[target] = list;
                saveSettingsDebounced();
            };
        } else {
            get = ()=>JSON.parse(target);
            set = ()=>{};
        }
        const list = get();
        list.push(...items);
        set();
        return JSON.stringify(list);
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'target list',
            typeList: [ARGUMENT_TYPE.VARIABLE_NAME, ARGUMENT_TYPE.LIST],
            isRequired: true,
        }),
        SlashCommandArgument.fromProps({ description: 'items to add',
            typeList: [ARGUMENT_TYPE.BOOLEAN, ARGUMENT_TYPE.CLOSURE, ARGUMENT_TYPE.DICTIONARY, ARGUMENT_TYPE.LIST, ARGUMENT_TYPE.NUMBER, ARGUMENT_TYPE.STRING],
            isRequired: true,
            acceptsMultiple: true,
        }),
    ],
    splitUnnamedArgument: true,
    returns: 'The updated list',
    helpString: help(
        `
            Appends new elements to the end of a list, and returns the list.
        `,
        [
            [
                `
                    /push ["A", "B", "C"] foo bar |
                `,
                'returns <code>["A", "B", "C", "foo", "bar"]</code>',
            ],
            [
                `
                    /let x [1, 2, 3, 4, 5] |
                    /push x 10 |
                `,
                'returns <code>[1, 2, 3, 4, 5, 10]</code>',
            ],
        ],
    ),
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'shift',
    /**
     *
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments} args
     * @param {string} target
     * @returns {string}
     */
    callback: (args, target)=>{
        /**@type {()=>[]} */
        let get;
        let set;
        if (args._scope.existsVariable(target)) {
            get = ()=>JSON.parse(args._scope.getVariable(target));
            set = ()=>args._scope.setVariable(target, JSON.stringify(list));
        } else if (chat_metadata.variables && chat_metadata.variables[target] !== undefined) {
            get = ()=>JSON.parse(chat_metadata.variables[target]);
            set = ()=>{
                chat_metadata.variables[target] = list;
                saveMetadataDebounced();
            };
        } else if (extension_settings.variables.global && extension_settings.variables.global[target] !== undefined) {
            get = ()=>JSON.parse(extension_settings.variables.global[target]);
            set = ()=>{
                extension_settings.variables.global[target] = list;
                saveSettingsDebounced();
            };
        } else {
            get = ()=>JSON.parse(target);
            set = ()=>{};
        }
        const list = get();
        const value = list.shift();
        set();
        if (typeof value == 'string') {
            return value;
        }
        return JSON.stringify(value);
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'target list',
            typeList: [ARGUMENT_TYPE.VARIABLE_NAME, ARGUMENT_TYPE.LIST],
            isRequired: true,
        }),
    ],
    returns: 'The removed element',
    helpString: help(
        `
            Removes the first element from a list and returns it.
        `,
        [
            [
                `
                    /shift ["A", "B", "C"] |
                `,
                'returns <code>A</code>',
            ],
            [
                `
                    /let x [1, 2, 3, 4, 5] |
                    /shift x |
                `,
                'returns <code>1</code>',
            ],
        ],
    ),
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'unshift',
    /**
     *
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments} args
     * @param {[target:string, ...items:string]} param1
     * @returns {string}
     */
    callback: (args, [target, ...items])=>{
        /**@type {()=>Array} */
        let get;
        let set;
        if (args._scope.existsVariable(target)) {
            get = ()=>JSON.parse(args._scope.getVariable(target));
            set = ()=>args._scope.setVariable(target, JSON.stringify(list));
        } else if (chat_metadata.variables && chat_metadata.variables[target] !== undefined) {
            get = ()=>JSON.parse(chat_metadata.variables[target]);
            set = ()=>{
                chat_metadata.variables[target] = list;
                saveMetadataDebounced();
            };
        } else if (extension_settings.variables.global && extension_settings.variables.global[target] !== undefined) {
            get = ()=>JSON.parse(extension_settings.variables.global[target]);
            set = ()=>{
                extension_settings.variables.global[target] = list;
                saveSettingsDebounced();
            };
        } else {
            get = ()=>JSON.parse(target);
            set = ()=>{};
        }
        const list = get();
        list.unshift(...items);
        set();
        return JSON.stringify(list);
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'target list',
            typeList: [ARGUMENT_TYPE.VARIABLE_NAME, ARGUMENT_TYPE.LIST],
            isRequired: true,
        }),
        SlashCommandArgument.fromProps({ description: 'items to add',
            typeList: [ARGUMENT_TYPE.BOOLEAN, ARGUMENT_TYPE.CLOSURE, ARGUMENT_TYPE.DICTIONARY, ARGUMENT_TYPE.LIST, ARGUMENT_TYPE.NUMBER, ARGUMENT_TYPE.STRING],
            isRequired: true,
            acceptsMultiple: true,
        }),
    ],
    splitUnnamedArgument: true,
    returns: 'The updated list',
    helpString: help(
        `
            Inserts new elements at the start of a list, and returns the list.
        `,
        [
            [
                `
                    /unshift ["A", "B", "C"] foo bar |
                `,
                'returns <code>["foo", "bar", "A", "B", "C"]</code>',
            ],
            [
                `
                    /let x [1, 2, 3, 4, 5] |
                    /unshift x 10 |
                `,
                'returns <code>[10, 1, 2, 3, 4, 5]</code>',
            ],
        ],
    ),
}));


SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'foreach',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  var:string,
     *  globalvar:string,
     *  list:string,
     * }} args
     * @param {[string|SlashCommandClosure, SlashCommandClosure|string]} value
     */
    callback: async (args, value) => {
        /**@type {Array} */
        let list;
        /**@type {string} */
        let command;
        /**@type {SlashCommandClosure} */
        let closure;
        if (args.var !== undefined || args.globalvar !== undefined || args.list !== undefined) {
            toastr.warning('Using var= or globalvar= or list= in /foreach is deprecated, please update your script to use unnamed arguments instead.', '/foreach (LALib)', { preventDuplicates:true });
            const err = new Error();
            console.warn('[LALIB]', '[DEPRECATED]', err.stack);
            list = getListVar(args.var, args.globalvar, args.list);
            if (value[0] instanceof SlashCommandClosure) {
                closure = /**@type {SlashCommandClosure}*/(value[0]);
            } else {
                command = value.join(' ');
            }
        } else {
            list = getListVar(null, null, value[0]);
            if (value[1] instanceof SlashCommandClosure) {
                closure = /**@type {SlashCommandClosure}*/(value[1]);
                if (/\{\{(item|index)\}\}/.test(closure.rawText)) {
                    toastr.warning('Using macros ({{item}} and {{index}}) to access the loop variables is deprecated. Please use variables / closure arguments instead.', '/foreach (LALib)', { preventDuplicates:true });
                }
            } else {
                command = value[1];
            }
        }
        let result;
        const isList = Array.isArray(list);
        if (isList) {
            list = list.map((it, idx) => [idx, it]);
        } else if (typeof list == 'object') {
            list = Object.entries(list);
        }
        if (!Array.isArray(list)) {
            throw new Error('/foreach requires a list or dictionary to operate on.');
        } else {
            /**@type {SlashCommandClosureResult}*/
            let commandResult;
            if (closure) {
                if (closure.argumentList.length == 0) {
                    const arg = new SlashCommandNamedArgumentAssignment();
                    arg.name = 'item';
                    closure.argumentList.push(arg);
                }
                if (closure.argumentList.length == 1) {
                    const arg = new SlashCommandNamedArgumentAssignment();
                    arg.name = 'index';
                    closure.argumentList.push(arg);
                }
                if (closure.argumentList.length > 0) {
                    const ass = new SlashCommandNamedArgumentAssignment();
                    ass.name = closure.argumentList[0].name;
                    closure.providedArgumentList[0] = ass;
                }
                if (closure.argumentList.length > 1) {
                    const ass = new SlashCommandNamedArgumentAssignment();
                    ass.name = closure.argumentList[1].name;
                    closure.providedArgumentList[1] = ass;
                }
            }
            for (let [index, item] of list) {
                if (typeof item == 'object') {
                    item = JSON.stringify(item);
                }
                if (closure) {
                    closure.scope.setMacro('item', item, true);
                    closure.scope.setMacro('index', index, true);
                    if (closure.argumentList.length > 0) {
                        closure.providedArgumentList[0].value = typeof item == 'string' ? item : JSON.stringify(item);
                    }
                    if (closure.argumentList.length > 1) {
                        closure.providedArgumentList[1].value = index.toString();
                    }
                    closure.breakController = new SlashCommandBreakController();
                    commandResult = (await closure.execute());
                    if (commandResult.isAborted) break;
                    if (commandResult.isBreak) break;
                } else if (command) {
                    commandResult = (await executeSlashCommandsWithOptions(
                        command.replace(/{{item}}/ig, item).replace(/{{index}}/ig, index),
                        {
                            handleExecutionErrors: false,
                            handleParserErrors: false,
                            parserFlags: args._parserFlags,
                            scope: args._scope,
                            abortController: args._abortController,
                        },
                    ));
                    if (commandResult.isAborted) {
                        args._abortController.abort(commandResult.abortReason, true);
                        break;
                    }
                }
                result = commandResult.pipe;
            }
            return result;
        }
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the list or dictionary to iterate over',
            typeList: [ARGUMENT_TYPE.LIST, ARGUMENT_TYPE.DICTIONARY],
            isRequired: true,
        }),
        SlashCommandArgument.fromProps({
            description: 'the closure to execute for each item, with {{var::item}} and {{var::index}} (or the first two closure arguments) placeholders',
            typeList: [ARGUMENT_TYPE.CLOSURE, ARGUMENT_TYPE.SUBCOMMAND],
            isRequired: true,
        }),
    ],
    splitUnnamedArgument: true,
    helpString: help(
        `
            Executes the provided command for each item of a list or dictionary, replacing {{var::item}} and {{var::index}} (or the first two closure arguments) with the current item and index.

            Use <code>/break</code> to break out of the loop early.
        `,
        [
            [
                `
                    /foreach ["A", "B", "C"] {:
                        /echo Item {{var::index}} is {{var::item}} |
                        /delay 400 |
                    :}
                `,
                '',
            ],
            [
                `
                    /let x {"a":"foo","b":"bar"} |
                    /foreach {{var::x}} {:
                        /echo Item {{var::index}} is {{var::item}} |
                        /delay 400 |
                    :}
                `,
                '',
            ],
            [
                `
                    /foreach ["A", "B", "C"] {: it= i=
                        /echo Item {{var::it}} is {{var::i}} |
                        /delay 400 |
                    :}
                `,
                'uses custom closure arguments <code>it</code> and <code>i</code> instead of the default <code>item</code> and <code>index</code>.',
            ],
            [
                `
                    /foreach ["A", "B", "C"] {: foo= bar=
                        /echo Item {{var::foo}} is {{var::bar}} |
                        /delay 400 |
                    :}
                `,
                'uses custom closure arguments <code>foo</code> and <code>bar</code> instead of the default <code>item</code> and <code>index</code>.',
            ],
        ],
    ),
    returns: 'result of executing the command on the last item',
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'map',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  var:string,
     *  globalvar:string,
     *  list:string,
     *  aslist:string,
     *  asList:string,
     * }} args
     * @param {[string|SlashCommandClosure, SlashCommandClosure|string]} value
     */
    callback: async (args, value) => {
        /**@type {Array} */
        let list;
        /**@type {string} */
        let command;
        /**@type {SlashCommandClosure} */
        let closure;
        if (args.var !== undefined || args.globalvar !== undefined || args.list !== undefined) {
            toastr.warning('Using var= or globalvar= or list= in /map is deprecated, please update your script to use unnamed arguments instead.', '/map (LALib)', { preventDuplicates:true });
            list = getListVar(args.var, args.globalvar, args.list);
            if (value[0] instanceof SlashCommandClosure) {
                closure = /**@type {SlashCommandClosure}*/(value[0]);
            } else {
                command = value.join(' ');
            }
        } else {
            list = getListVar(null, null, value[0]);
            if (value[1] instanceof SlashCommandClosure) {
                closure = /**@type {SlashCommandClosure}*/(value[1]);
                if (/\{\{(item|index)\}\}/.test(closure.rawText)) {
                    toastr.warning('Using macros ({{item}} and {{index}}) to access the loop variables is deprecated. Please use variables / closure arguments instead.', '/map (LALib)', { preventDuplicates:true });
                }
            } else {
                command = value[1];
            }
        }
        let result;
        const isList = Array.isArray(list);
        if (isList) {
            list = list.map((it, idx) => [idx, it]);
            result = [];
        } else if (typeof list == 'object') {
            list = Object.entries(list);
            result = {};
        }
        if (!Array.isArray(list)) {
            throw new Error('/map requires a list or dictionary to operate on.');
        } else {
            /**@type {SlashCommandClosureResult}*/
            let commandResult;
            if (closure) {
                if (closure.argumentList.length == 0) {
                    const arg = new SlashCommandNamedArgumentAssignment();
                    arg.name = 'item';
                    closure.argumentList.push(arg);
                }
                if (closure.argumentList.length == 1) {
                    const arg = new SlashCommandNamedArgumentAssignment();
                    arg.name = 'index';
                    closure.argumentList.push(arg);
                }
                if (closure.argumentList.length > 0) {
                    const ass = new SlashCommandNamedArgumentAssignment();
                    ass.name = closure.argumentList[0].name;
                    closure.providedArgumentList[0] = ass;
                }
                if (closure.argumentList.length > 1) {
                    const ass = new SlashCommandNamedArgumentAssignment();
                    ass.name = closure.argumentList[1].name;
                    closure.providedArgumentList[1] = ass;
                }
            }
            for (let [index, item] of list) {
                if (typeof item == 'object') {
                    item = JSON.stringify(item);
                }
                if (closure) {
                    closure.scope.setMacro('item', item, true);
                    closure.scope.setMacro('index', index, true);
                    if (closure.argumentList.length > 0) {
                        closure.providedArgumentList[0].value = typeof item == 'string' ? item : JSON.stringify(item);
                    }
                    if (closure.argumentList.length > 1) {
                        closure.providedArgumentList[1].value = index.toString();
                    }
                    closure.breakController = new SlashCommandBreakController();
                    commandResult = (await closure.execute());
                    if (commandResult.isAborted) break;
                    if (commandResult.isBreak) break;
                } else {
                    commandResult = (await executeSlashCommandsWithOptions(
                        command.replace(/{{item}}/ig, item).replace(/{{index}}/ig, index),
                        {
                            handleExecutionErrors: false,
                            handleParserErrors: false,
                            parserFlags: args._parserFlags,
                            scope: args._scope,
                            abortController: args._abortController,
                        },
                    ));
                    if (commandResult.isAborted) {
                        args._abortController.abort(commandResult.abortReason, true);
                        break;
                    }
                }
                result[index] = commandResult.pipe;
                try { result[index] = JSON.parse(result[index]); } catch { /*empty*/ }
            }
        }
        if (isTrueFlag(args.aslist ?? args.asList) && !isList) {
            result = Object.keys(result).map(it => result[it]);
        }
        if (typeof result != 'string') {
            result = JSON.stringify(result);
        }
        return result;
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'aslist',
            description: 'whether to return the results of a dictionary as a list',
            typeList: [ARGUMENT_TYPE.BOOLEAN],
            defaultValue: 'false',
            enumList: ['true', 'false'],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the list or dictionary to iterate over',
            typeList: [ARGUMENT_TYPE.LIST, ARGUMENT_TYPE.DICTIONARY],
            isRequired: true,
        }),
        SlashCommandArgument.fromProps({
            description: 'the closure to execute for each item, with {{var::item}} and {{var::index}} (or the first two closure arguments) placeholders',
            typeList: [ARGUMENT_TYPE.CLOSURE, ARGUMENT_TYPE.SUBCOMMAND],
            isRequired: true,
        }),
    ],
    splitUnnamedArgument: true,
    returns: 'list or dictionary of the command results',
    helpString: help(
        `
            Executes a command for each item of a list or dictionary and returns the list or dictionary of the command results.

            Use <code>/break</code> to break out of the loop early.
        `,
        [
            [
                `
                    /map [1,2,3] {:
                        /mul {{var::item}} {{var::item}}
                    :}
                `,
                'Calculates the square of each number.',
            ],
            [
                `
                    /map [1,2,3] {: it= i=
                        /mul {{var::it}} {{var::it}}
                    :}
                `,
                'Calculates the square of each number.',
            ],
            [
                `
                    /map [1,2,3] {: foo= bar=
                        /mul {{var::foo}} {{var::foo}}
                    :}
                `,
                'Calculates the square of each number.',
            ],
            [
                `
                    /map {"a":1,"b":2,"c":3} {: /mul {{var::item}} {{var::item}} :}
                `,
                'Calculates the square of each number.',
            ],
            [
                `
                    /map aslist= {"a":1,"b":2,"c":3} {: /mul {{var::item}} {{var::item}} :}
                `,
                'Calculates the square of each number.',
            ],
        ],
    ),
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'whilee',
    callback: async(args, value)=>{
        /**@type {SlashCommandClosure} */
        let runClosure;
        /**@type {SlashCommandClosure} */
        let closure;
        /**@type {()=>boolean} */
        let expression;
        if (value) {
            if (value[0] instanceof SlashCommandClosure) {
                closure = value[0];
            } else {
                const text = value.slice(0, -1).join(' ');
                const parser = new BoolParser(args._scope, args);
                expression = /**@type {()=>boolean]*/(parser.parse(text));
            }
            runClosure = value.at(-1);
        }
        const test = async()=>{
            if (closure) return isTrueBoolean((await closure.execute()).pipe);
            return expression();
        };
        runClosure.breakController = new SlashCommandBreakController();
        let commandResult;
        while (await test()) {
            commandResult = await runClosure.execute();
            if (commandResult.isAborted) break;
            if (commandResult.isBreak) break;
        }
        if (commandResult) return commandResult.pipe;
        return '';
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'expression variables',
            description: 'named arguments assigned to scoped variables to be used in the expression',
            acceptsMultiple: true,
            typeList: [ARGUMENT_TYPE.BOOLEAN, ARGUMENT_TYPE.CLOSURE, ARGUMENT_TYPE.DICTIONARY, ARGUMENT_TYPE.LIST, ARGUMENT_TYPE.NUMBER, ARGUMENT_TYPE.STRING],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the expression or closure to evaluate',
            typeList: [ARGUMENT_TYPE.STRING, ARGUMENT_TYPE.CLOSURE],
            isRequired: true,
            acceptsMultiple: true,
            enumProvider: makeIfWhileEnumProvider('while'),
        }),
        SlashCommandArgument.fromProps({
            description: 'the closure to execute',
            typeList: [ARGUMENT_TYPE.CLOSURE],
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            Creates a loop that executes a specified closure as long as the test condition (expression or closure) evaluates to true. The condition is evaluated before executing the closure.

            Use <code>/break</code> to break out of the loop early.

            See <a data-lalib-exec="/lalib? expressions"><code>/lalib? expressions</code></a> for more details on expressions.
        `,
        [
            [
                `
                    /whilee (i++ < 3) {:
                        /echo i: {{var::i}} |
                        /delay 400 |
                    :}
                `,
                '',
            ],
        ],
    ),
    returns: 'result of executing the last iteration of the closure',
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'reduce',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  initial:string?
     * }} args
     * @param {[string|SlashCommandClosure, SlashCommandClosure]} value
     */
    callback: async (args, value) => {
        /**@type {Array} */
        let list;
        /**@type {SlashCommandClosure} */
        let closure;
        list = getListVar(null, null, value[0]);
        if (!Array.isArray(list)) {
            throw new Error('/reduce requires a list to operate on.');
        }
        closure = value[1];
        if (closure.argumentList.length > 0) {
            const ass = new SlashCommandNamedArgumentAssignment();
            ass.name = closure.argumentList[0].name;
            closure.providedArgumentList[0] = ass;
        }
        if (closure.argumentList.length > 1) {
            const ass = new SlashCommandNamedArgumentAssignment();
            ass.name = closure.argumentList[1].name;
            closure.providedArgumentList[1] = ass;
        }
        if (closure.argumentList.length > 2) {
            const ass = new SlashCommandNamedArgumentAssignment();
            ass.name = closure.argumentList[2].name;
            closure.providedArgumentList[2] = ass;
        }
        let func = async(accumulator, current, index)=>{
            accumulator = await accumulator;
            if (closure.argumentList.length > 0) {
                closure.providedArgumentList[0].value = typeof accumulator == 'string' ? accumulator : JSON.stringify(accumulator);
            }
            if (closure.argumentList.length > 1) {
                closure.providedArgumentList[1].value = typeof current == 'string' ? current : JSON.stringify(current);
            }
            if (closure.argumentList.length > 2) {
                closure.providedArgumentList[2].value = index.toString();
            }
            return (await closure.execute()).pipe;
        };
        let result;
        if (args.initial !== undefined) {
            result = await list.reduce(func, Promise.resolve(args.initial));
        } else {
            result = await list.reduce(func);
        }
        return result;
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name:'initial',
            description: 'initial value',
            typeList: [ARGUMENT_TYPE.BOOLEAN, ARGUMENT_TYPE.DICTIONARY, ARGUMENT_TYPE.LIST, ARGUMENT_TYPE.NUMBER, ARGUMENT_TYPE.STRING],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the list to reduce',
            typeList: [ARGUMENT_TYPE.LIST],
            isRequired: true,
        }),
        SlashCommandArgument.fromProps({
            description: 'the closure to execute for each item, takes up to three arguments (accumulator, current value, current index)',
            typeList: [ARGUMENT_TYPE.CLOSURE],
            isRequired: true,
        }),
    ],
    splitUnnamedArgument: true,
    helpString: help(
        `
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
        `,
        [
            [
                `
                    /reduce [1,2,3] {: acc= cur= /= acc + cur :}
                `,
                'returns 6 (1+2 = 3 -&gt; 3 + 3 = 6)',
            ],
            [
                `
                    /reduce initial=10 [1,2,3] {: acc= cur= /= acc + cur :}
                `,
                'returns 16 (10+1 = 11 -&gt; 11+2 = 13 -&gt; 13 + 3 = 16)',
            ],
            [
                `
                    /let x [["a",1],["b",2],["c",3]] |
                    /reduce initial={} {{var::x}} {: acc= cur=
                        /var key=acc index={: /= cur.0 :}() {: /= cur.1 :}() |
                        /return {{var::acc}} |
                    :} |
                `,
                'returns <code>{"a":"1","b":"2","c":"3"}</code>',
            ],
        ],
    ),
    returns: 'reduced value',
}));


SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'sorte',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  key:SlashCommandClosure,
     * }} args
     * @param {[string, string|SlashCommandClosure]} value
     */
    callback: async (args, value) => {
        /**@type {string} */
        let varType;
        /**@type {Array} */
        let list;
        /**@type {SlashCommandClosure} */
        let closure;
        /**@type {string} */
        let expression;
        if (args._scope.existsVariable(value[0])) {
            list = JSON.parse(args._scope.getVariable(value[0]));
            varType = 'scoped';
        } else {
            try {
                list = JSON.parse(chat_metadata?.variables?.[value[0]]);
                varType = 'chat';
            } catch { /* empty */ }
            if (!list) {
                try {
                    list = JSON.parse(extension_settings.variables?.global?.[value[0]]);
                    varType = 'global';
                } catch { /* empty */ }
            }
            if (!list) {
                if (typeof value[0] == 'string') {
                    try {
                        const parsed = JSON.parse(value[0]);
                        if (Array.isArray(parsed)) {
                            list = parsed;
                        }
                    } catch { /* empty */ }
                }
            }
        }
        if (!Array.isArray(list)) {
            throw new Error('/sorte requires a list to operate on.');
        }
        if (value.length > 1) {
            if (value[1] instanceof SlashCommandClosure) {
                closure = value[1];
            } else {
                expression = value.slice(1).join(' ');
            }
        }
        list = list.map(it=>{
            if (typeof it == 'string' && it.length > 0) {
                const num = Number(it);
                if (!Number.isNaN(num)) {
                    return num;
                }
            }
            return it;
        });
        const sortList = [];
        let index = 0;
        for (const item of list) {
            if (args.key && args.key instanceof SlashCommandClosure) {
                let macroItem = item;
                if (typeof item != 'string') {
                    macroItem = JSON.stringify(item);
                }
                args.key.scope.setMacro('item', macroItem, true);
                args.key.scope.setMacro('index', index, true);
                sortList.push({
                    key: (await args.key.execute()).pipe,
                    item,
                    index,
                });
            } else {
                sortList.push({
                    key: item,
                    item,
                    index,
                });
            }
            index++;
        }
        if (closure) {
            const start = performance.now();
            const aAss = new SlashCommandNamedArgumentAssignment();
            aAss.name = closure.argumentList[0].name;
            closure.providedArgumentList[0] = aAss;
            const bAss = new SlashCommandNamedArgumentAssignment();
            bAss.name = closure.argumentList[1].name;
            closure.providedArgumentList[1] = bAss;
            const lookup = [];
            for (let a = 0; a < sortList.length; a++) {
                lookup[a] = [];
                for (let b = 0; b < sortList.length; b++) {
                    if (a == b) continue;
                    let aa = sortList[a].key;
                    let bb = sortList[b].key;
                    if (typeof aa != 'string') aa = JSON.stringify(aa);
                    if (typeof bb != 'string') bb = JSON.stringify(bb);
                    aAss.value = aa;
                    bAss.value = bb;
                    lookup[a][b] = (await closure.execute()).pipe;
                }
            }
            const end = performance.now();
            console.log('[LALIB]', '[/sorte]', 'custom comparison closure cross join:', end - start);
            sortList.sort((a,b)=>lookup[a.index][b.index]);
        } else {
            if (!expression) {
                expression = 'a <=> b';
            }
            const parser = new BoolParser(args._scope, args);
            parser.scope.letVariable('a');
            parser.scope.letVariable('b');
            const exp = parser.parse(expression);
            sortList.sort((aa,bb)=>{
                let a = aa.key;
                let b = bb.key;
                if (typeof a != 'string') a = JSON.stringify(a);
                if (typeof b != 'string') b = JSON.stringify(b);
                parser.scope.setVariable('a', a);
                parser.scope.setVariable('b', b);
                return Number(exp());
            });
        }
        list = sortList.map(it=>it.item);
        const result = JSON.stringify(list);
        switch (varType) {
            case 'scoped': {
                args._scope.setVariable(value[0], result);
                break;
            }
            case 'chat': {
                chat_metadata.variables[value[0]] = result;
                saveMetadataDebounced();
                break;
            }
            case 'global': {
                extension_settings.variables.global[value[0]] = result;
                saveSettingsDebounced();
                break;
            }
        }
        return result;
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'key',
            description: 'closure that returns the value to be used for sorting',
            typeList: [ARGUMENT_TYPE.CLOSURE],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the list to sort',
            typeList: [ARGUMENT_TYPE.LIST, ARGUMENT_TYPE.VARIABLE_NAME],
            isRequired: true,
        }),
        SlashCommandArgument.fromProps({
            description: 'the expression or closure used to compare two items <code>a</code> and <code>b</code>',
            typeList: [ARGUMENT_TYPE.STRING, ARGUMENT_TYPE.CLOSURE],
            defaultValue: '(a <=> b)',
            acceptsMultiple: true,
            enumProvider: makeBoolOrClosureEnumProvider(1),
        }),
    ],
    splitUnnamedArgument: true,
    helpString: help(
        `
            Sorts a list.

            The comparison closure must accept two named arguments which will be equivalent to <code>a</code>
            and <code>b</code> in the expression.<br>
            Using a comparison closure can be very performance and time intensive on longer lists.

            If given a variable name, the variable will be modified.

            See <a data-lalib-exec="/lalib? expressions"><code>/lalib? expressions</code></a> for more details on expressions.
        `,
        [
            [
                `
                    /sorte [5,3,-10,-99,0] |
                `,
                'returns [-99,-10,0,3,5]',
            ],
            [
                `
                    /let x [5,3,-10,-99,0] |
                    /sorte x |
                    /echo {{var::x}} |
                `,
                'returns [-99,-10,0,3,5]',
            ],
            [
                `
                    /let x [5,3,-10,-99,0] |
                    /sorte {{var::x}} |
                    /echo {{var::x}} |
                `,
                'returns [5,3,-10,-99,0]',
            ],
            [
                `
                    /sorte [5,3,-10,-99,0] (a <=> b) |
                `,
                'returns [-99,-10,0,3,5]',
            ],
            [
                `
                    /sorte [5,3,-10,-99,0] (b <=> a) |
                `,
                'returns [5,3,0,-10,-99]',
            ],
            [
                `
                    /sorte [5,3,-10,-99,0] {: a= b= /sub a b :} |
                `,
                'returns [-99,-10,0,3,5]',
            ],
        ],
    ),
    returns: 'the sorted list',
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'flatten',
    /**
     *
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments&{
     *  depth:string
     * }} args
     * @param {string} value
     * @returns
     */
    callback: (args, value) => {
        let depth = parseInt(args.depth ?? '1');
        if (depth == 0) depth = Infinity;
        return JSON.stringify(JSON.parse(value).flat(depth));
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'depth',
            description: 'The depth level specifying how deep a nested list structure should be flattened. Defaults to 1. Use 0 to flatten all levels.',
            typeList: [ARGUMENT_TYPE.NUMBER],
            defaultValue: '1',
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the list to flatten',
            typeList: [ARGUMENT_TYPE.LIST],
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            Creates a new list with all sub-list elements concatenated into it recursively up to the specified depth.
        `,
        [
            [
                `
                    /flatten [1, 2, 3, [4, 5, 6, [7, 8, 9]]] |
                `,
                'returns [1, 2, 3, 4, 5, 6, [7, 8, 9]]',
            ],
            [
                `
                    /flatten depth=0 [1, 2, 3, [4, 5, 6, [7, 8, 9]]] |
                `,
                'returns [1, 2, 3, 4, 5, 6, 7, 8, 9]',
            ],
        ],
    ),
    returns: 'the flattened list',
}));


SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'filter',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  var:string,
     *  globalvar:string,
     *  list:string,
     * }} args
     * @param {[string|SlashCommandClosure, SlashCommandClosure|string]} value
     */
    callback: async (args, value) => {
        /**@type {Array} */
        let list;
        /**@type {string} */
        let command;
        /**@type {SlashCommandClosure} */
        let closure;
        /**@type {string} */
        let expression;
        if (args.var !== undefined || args.globalvar !== undefined || args.list !== undefined) {
            toastr.warning('Using var= or globalvar= or list= in /filter is deprecated, please update your script to use unnamed arguments instead.', '/filter (LALib)', { preventDuplicates:true });
            list = getListVar(args.var, args.globalvar, args.list);
            if (value[0] instanceof SlashCommandClosure) {
                closure = /**@type {SlashCommandClosure}*/(value[0]);
            } else {
                command = value.join(' ');
            }
        } else {
            list = getListVar(null, null, value[0]);
            if (value[1] instanceof SlashCommandClosure) {
                closure = /**@type {SlashCommandClosure}*/(value[1]);
                if (/\{\{(item|index)\}\}/.test(closure.rawText)) {
                    toastr.warning('Using macros ({{item}} and {{index}}) to access the loop variables is deprecated. Please use variables / closure arguments instead.', '/filter (LALib)', { preventDuplicates:true });
                }
            } else {
                expression = value.slice(1).join(' ');
            }
        }
        let result;
        const isList = Array.isArray(list);
        if (isList) {
            list = list.map((it, idx) => [idx, it]);
            result = [];
        } else if (typeof list == 'object') {
            list = Object.entries(list);
            result = {};
        }
        if (!Array.isArray(list)) {
            throw new Error('/filter requires a list or dictionary to operate on.');
        } else {
            /**@type {SlashCommandClosureResult}*/
            let commandResult;
            if (closure) {
                if (closure.argumentList.length == 0) {
                    const arg = new SlashCommandNamedArgumentAssignment();
                    arg.name = 'item';
                    closure.argumentList.push(arg);
                }
                if (closure.argumentList.length == 1) {
                    const arg = new SlashCommandNamedArgumentAssignment();
                    arg.name = 'index';
                    closure.argumentList.push(arg);
                }
                if (closure.argumentList.length > 0) {
                    const ass = new SlashCommandNamedArgumentAssignment();
                    ass.name = closure.argumentList[0].name;
                    closure.providedArgumentList[0] = ass;
                }
                if (closure.argumentList.length > 1) {
                    const ass = new SlashCommandNamedArgumentAssignment();
                    ass.name = closure.argumentList[1].name;
                    closure.providedArgumentList[1] = ass;
                }
            }
            for (let [index, item] of list) {
                if (typeof item == 'object') {
                    item = JSON.stringify(item);
                }
                let outcome;
                if (closure) {
                    closure.scope.setMacro('item', item, true);
                    closure.scope.setMacro('index', index, true);
                    if (closure.argumentList.length > 0) {
                        closure.providedArgumentList[0].value = typeof item == 'string' ? item : JSON.stringify(item);
                    }
                    if (closure.argumentList.length > 1) {
                        closure.providedArgumentList[1].value = index.toString();
                    }
                    closure.breakController = new SlashCommandBreakController();
                    commandResult = (await closure.execute());
                    if (commandResult.isAborted) break;
                    if (commandResult.isBreak) break;
                } else if (expression !== undefined) {
                    const parser = new BoolParser(args._scope, args);
                    parser.scope.letVariable('item', item);
                    parser.scope.letVariable('index', index);
                    const exp = parser.parse(expression);
                    commandResult = new SlashCommandClosureResult();
                    commandResult.pipe = exp().toString();
                } else {
                    commandResult = (await executeSlashCommandsWithOptions(
                        command.toString().replace(/{{item}}/ig, item).replace(/{{index}}/ig, index),
                        {
                            handleExecutionErrors: false,
                            handleParserErrors: false,
                            parserFlags: args._parserFlags,
                            scope: args._scope,
                            abortController: args._abortController,
                        },
                    ));
                    if (commandResult.isAborted) {
                        args._abortController.abort(commandResult.abortReason, true);
                        break;
                    }
                }
                outcome = commandResult.pipe;
                if (isTrueBoolean(outcome)) {
                    if (isList) {
                        /**@type {Array}*/(result).push(item);
                    } else {
                        result[index] = item;
                    }
                }
            }
        }
        if (typeof result != 'string') {
            result = JSON.stringify(result);
        }
        return result;
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the list or dictionary to iterate over',
            typeList: [ARGUMENT_TYPE.LIST, ARGUMENT_TYPE.DICTIONARY],
            isRequired: true,
        }),
        SlashCommandArgument.fromProps({
            description: 'the closure or expression to execute for each item, with {{var::item}} and {{var::index}} placeholders',
            typeList: [ARGUMENT_TYPE.CLOSURE, ARGUMENT_TYPE.STRING],
            isRequired: true,
            acceptsMultiple: true,
            enumProvider: makeBoolEnumProvider(),
        }),
    ],
    splitUnnamedArgument: true,
    helpString: help(
        `
            Executes command for each item of a list or dictionary and returns the list or dictionary of only those items where the command returned true.

            See <a data-lalib-exec="/lalib? expressions"><code>/lalib? expressions</code></a> for more details on expressions.
        `,
        [
            [
                `
                    /filter [1,2,3,4,5] {:
                        /test left={{var::item}} rule=gt right=2
                    :}
                `,
                'returns [3, 4, 5]',
            ],
            [
                `
                    /filter [1,2,3,4,5] {: it=
                        /test left={{var::it}} rule=gt right=2
                    :}
                `,
                'returns [3, 4, 5]',
            ],
            [
                `
                    /filter [1,2,3,4,5] (item > 2)
                `,
                'returns [3, 4, 5]',
            ],
        ],
    ),
    returns: 'the filtered list or dictionary',
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'find',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  var:string,
     *  globalvar:string,
     *  list:string,
     *  index:string,
     *  last:string,
     * }} args
     * @param {[string|SlashCommandClosure, SlashCommandClosure|string]} value
     */
    callback: async (args, value) => {
        /**@type {Array} */
        let list;
        /**@type {string} */
        let command;
        /**@type {SlashCommandClosure} */
        let closure;
        /**@type {string} */
        let expression;
        if (args.var !== undefined || args.globalvar !== undefined || args.list !== undefined) {
            toastr.warning('Using var= or globalvar= or list= in /find is deprecated, please update your script to use unnamed arguments instead.', '/find (LALib)', { preventDuplicates:true });
            list = getListVar(args.var, args.globalvar, args.list);
            if (value[0] instanceof SlashCommandClosure) {
                closure = /**@type {SlashCommandClosure}*/(value[0]);
            } else {
                command = value.join(' ');
            }
        } else {
            list = getListVar(null, null, value[0]);
            if (value[1] instanceof SlashCommandClosure) {
                closure = /**@type {SlashCommandClosure}*/(value[1]);
                if (/\{\{(item|index)\}\}/.test(closure.rawText)) {
                    toastr.warning('Using macros ({{item}} and {{index}}) to access the loop variables is deprecated. Please use variables / closure arguments instead.', '/find (LALib)', { preventDuplicates:true });
                }
            } else {
                expression = value.slice(1).join(' ');
            }
        }
        const isList = Array.isArray(list);
        if (isList) {
            list = list.map((it, idx) => [idx, it]);
        } else if (typeof list == 'object') {
            list = Object.entries(list);
        }
        if (!Array.isArray(list)) {
            throw new Error('/find requires a list or dictionary to operate on.');
        } else {
            /**@type {SlashCommandClosureResult}*/
            let commandResult;
            if (closure) {
                if (closure.argumentList.length == 0) {
                    const arg = new SlashCommandNamedArgumentAssignment();
                    arg.name = 'item';
                    closure.argumentList.push(arg);
                }
                if (closure.argumentList.length == 1) {
                    const arg = new SlashCommandNamedArgumentAssignment();
                    arg.name = 'index';
                    closure.argumentList.push(arg);
                }
                if (closure.argumentList.length > 0) {
                    const ass = new SlashCommandNamedArgumentAssignment();
                    ass.name = closure.argumentList[0].name;
                    closure.providedArgumentList[0] = ass;
                }
                if (closure.argumentList.length > 1) {
                    const ass = new SlashCommandNamedArgumentAssignment();
                    ass.name = closure.argumentList[1].name;
                    closure.providedArgumentList[1] = ass;
                }
            }
            if (isTrueFlag(args.last)) {
                list.reverse();
            }
            for (let [index, item] of list) {
                if (typeof item === 'object') {
                    item = JSON.stringify(item);
                }
                let outcome;
                if (closure) {
                    closure.scope.setMacro('item', item, true);
                    closure.scope.setMacro('index', index, true);
                    if (closure.argumentList.length > 0) {
                        closure.providedArgumentList[0].value = typeof item == 'string' ? item : JSON.stringify(item);
                    }
                    if (closure.argumentList.length > 1) {
                        closure.providedArgumentList[1].value = index.toString();
                    }
                    commandResult = (await closure.execute());
                    if (commandResult.isAborted) break;
                } else if (expression !== undefined) {
                    const parser = new BoolParser(args._scope, args);
                    parser.scope.letVariable('item', item);
                    parser.scope.letVariable('index', index);
                    const exp = parser.parse(expression);
                    commandResult = new SlashCommandClosureResult();
                    commandResult.pipe = exp().toString();
                } else {
                    commandResult = (await executeSlashCommandsWithOptions(
                        command.replace(/{{item}}/ig, item).replace(/{{index}}/ig, index),
                        {
                            handleExecutionErrors: false,
                            handleParserErrors: false,
                            parserFlags: args._parserFlags,
                            scope: args._scope,
                            abortController: args._abortController,
                        },
                    ));
                    if (commandResult.isAborted) {
                        args._abortController.abort(commandResult.abortReason, true);
                        break;
                    }
                }
                outcome = commandResult.pipe;
                if (isTrueBoolean(outcome)) {
                    if (isTrueFlag(args.index)) {
                        return index.toString();
                    }
                    if (typeof item != 'string') {
                        return JSON.stringify(item);
                    }
                    return item;
                }
            }
            return '';
        }
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'index',
            description: 'return the matching item\'s index instead of the item',
            typeList: [ARGUMENT_TYPE.BOOLEAN],
            defaultValue: 'false',
            enumList: ['true', 'false'],
        }),
        SlashCommandNamedArgument.fromProps({ name: 'last',
            description: 'return the last instead of the first matching item',
            typeList: [ARGUMENT_TYPE.BOOLEAN],
            defaultValue: 'false',
            enumList: ['true', 'false'],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the list or dictionary to iterate over',
            typeList: [ARGUMENT_TYPE.LIST, ARGUMENT_TYPE.DICTIONARY],
            isRequired: true,
        }),
        SlashCommandArgument.fromProps({
            description: 'the command to execute for each item, using {{var::item}} and {{var::index}} as placeholders',
            typeList: [ARGUMENT_TYPE.CLOSURE, ARGUMENT_TYPE.SUBCOMMAND],
            isRequired: true,
            acceptsMultiple: true,
            enumProvider: makeBoolEnumProvider(),
        }),
    ],
    splitUnnamedArgument: true,
    helpString: help(
        `
            Executes the provided closure or expression for each item of a list or dictionary and returns the first item where the command returned true.

            See <a data-lalib-exec="/lalib? expressions"><code>/lalib? expressions</code></a> for more details on expressions.
        `,
        [
            [
                `
                    /find [1,2,3,4,5] {:
                        /test left={{var::item}} rule=gt right=2
                    :} |
                    /echo |
                `,
                'returns 3',
            ],
            [
                `
                    /find [1,2,3,4,5] {: it=
                        /test left={{var::it}} rule=gt right=2
                    :} |
                    /echo |
                `,
                'returns 3',
            ],
            [
                `
                    /find [1,2,3,4,5] (item > 2) | /echo
                `,
                'returns 3',
            ],
        ],
    ),
    returns: 'the first item where the command returned true',
}));


SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'slice',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  var:string,
     *  globalvar:string,
     *  list:string,
     *  start:string,
     *  end:string,
     *  length:string,
     * }} args
     * @param {string} value
     */
    callback: async (args, value) => {
        /**@type {Array} */
        let list;
        if (args.var !== undefined || args.globalvar !== undefined) {
            toastr.warning('Using var= or globalvar= in /slice is deprecated, please update your script to use unnamed arguments instead.', '/slice (LALib)', { preventDuplicates:true });
            list = getListVar(args.var, args.globalvar, value) ?? getVar(args.var, args.globalvar, value);
        } else {
            list = getListVar(null, null, value) ?? value;
        }
        const start = Number(args.start);
        const end = args.end !== undefined ? Number(args.end) : (args.length ? start + Number(args.length) : undefined);
        const result = list.slice(start, end);
        if (typeof result != 'string') {
            return JSON.stringify(result);
        }
        return result;
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'start',
            description: 'the starting index of the slice, negative numbers start from the back',
            typeList: [ARGUMENT_TYPE.NUMBER],
            isRequired: true,
        }),
        SlashCommandNamedArgument.fromProps({ name: 'end',
            description: 'the ending index of the slice (non-inclusive)',
            typeList: [ARGUMENT_TYPE.NUMBER],
        }),
        SlashCommandNamedArgument.fromProps({ name: 'length',
            description: 'the length of the slice',
            typeList: [ARGUMENT_TYPE.NUMBER],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the value to slice',
            typeList: [ARGUMENT_TYPE.STRING, ARGUMENT_TYPE.LIST],
        }),
    ],
    returns: 'the sliced list or string',
    helpString: help(
        `
            Retrieves a slice of a list or string.
        `,
        [
            [
                `
                    /slice start=2 length=3 [1,2,3,4,5,6] | /echo
                `,
                'returns [3,4,5]',
            ],
            [
                `
                    /slice start=-8 The quick brown fox jumps over the lazy dog | /echo
                `,
                'returns lazy dog',
            ],
        ],
    ),
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'splice',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  var:string,
     *  globalvar:string,
     *  value:string,
     *  start:string,
     *  delete:string,
     *  insert:string,
     * }} args
     * @param {string} value
     */
    callback: async (args, value) => {
        /**@type {Array} */
        let list;
        let isList = true;
        let insert;
        let start = Number(args.start);
        let deleteCount = args.delete === '' ? Number.MAX_SAFE_INTEGER : Number(args.delete);
        if (args.var !== undefined || args.globalvar !== undefined || args.value !== undefined) {
            toastr.warning('Using var= or globalvar= or value= in /splice is deprecated, please update your script to use insert= and the unnamed argument instead.', '/splice (LALib)', { preventDuplicates:true });
            list = getListVar(args.var, args.globalvar, args.value);
            insert = getListVar(null, null, value) ?? value.split(' ').filter(it=>it);
            if (!list) {
                isList = false;
                list = [...getVar(args.var, args.globalvar, args.value)];
            }
        } else {
            list = getListVar(null, null, value);
            insert = getListVar(null, null, args.insert) ?? [args.insert].filter(it=>it);
            if (!list) {
                isList = false;
                list = [...value];
            }
        }
        list.splice(start, deleteCount, ...(insert ?? []));
        if (isList) {
            return JSON.stringify(list);
        } else {
            return list.join('');
        }
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'start',
            description: 'the starting index of the splice, negative numbers start from the back',
            typeList: [ARGUMENT_TYPE.NUMBER],
            isRequired: true,
        }),
        SlashCommandNamedArgument.fromProps({ name: 'delete',
            description: 'the number of elements to remove in the list from start (use delete= to remove everything)',
            typeList: [ARGUMENT_TYPE.NUMBER],
        }),
        SlashCommandNamedArgument.fromProps({ name: 'insert',
            description: 'the elements to add at index start=',
            typeList: [ARGUMENT_TYPE.LIST, ARGUMENT_TYPE.STRING],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the list or string to operate on',
            typeList: [ARGUMENT_TYPE.STRING, ARGUMENT_TYPE.NUMBER, ARGUMENT_TYPE.BOOLEAN, ARGUMENT_TYPE.LIST, ARGUMENT_TYPE.DICTIONARY],
        }),
    ],
    returns: 'the new list',
    helpString: help(
        `
            Creates a new list with some elements removed and / or replaced at a given index.
        `,
        [
            [
                `
                    /splice insert=[30, 40, 50] start=3 delete=3 [0,1,2,3,4,5,6] |
                    /echo |
                `,
                'returns [0,1,2,30,40,50,6]',
            ],
            [
                `
                    /splice start=3 delete=3 [0,1,2,3,4,5,6] |
                    /echo |
                `,
                'returns [0,1,2,6]',
            ],
            [
                `
                    /splice insert=100 start=3 [0,1,2,3,4,5,6] |
                    /echo |
                `,
                'returns [0,1,2,100,3,4,5,6]',
            ],
            [
                `
                    /splice start=-1 delete=1 [0,1,2,3,4,5,6] |
                    /echo |
                `,
                'returns [0,1,2,3,4,5]',
            ],
        ],
    ),
}));


const shuffleList = (value)=>{
    const list = getListVar(null, null, value);
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
};
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'shuffle',
    callback: (args, value) => {
        return JSON.stringify(shuffleList(value));
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the list to shuffle',
            typeList: [ARGUMENT_TYPE.LIST],
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            Returns a shuffled list.
        `,
        [
            [
                `
                    /shuffle [1, 2, 3, 4] |
                `,
                'could be [2, 4, 3, 1]',
            ],
        ],
    ),
    returns: 'the shuffled list',
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'pick',
    callback: (args, value) => {
        const list = shuffleList(value);
        const items = Number(args.items ?? '1');
        const asList = isTrueFlag(args.list);
        const picks = list.slice(0, items);
        if (items > 1 || asList) {
            return JSON.stringify(picks);
        }
        const pick = picks[0];
        if (typeof pick != 'string') {
            return JSON.stringify(pick);
        }
        return pick;
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'items',
            description: 'how many items to pick (if greater than one, will return a list)',
            typeList: [ARGUMENT_TYPE.NUMBER],
            defaultValue: '1',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'list',
            description: 'whether to return a list, even if only one item is picked',
            typeList: [ARGUMENT_TYPE.BOOLEAN],
            enumList: ['true', 'false'],
            defaultValue: 'false',
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the list to pick from',
            typeList: [ARGUMENT_TYPE.LIST],
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            Picks one random item or <code>items</code> number of random items from a list (no duplicates).
        `,
        [
            [
                `
                    /pick [1, 2, 3, 4] |
                `,
                'could be 3',
            ],
            [
                `
                    /pick list= [1, 2, 3, 4] |
                `,
                'could be [3]',
            ],
            [
                `
                    /pick items=2 [1, 2, 3, 4] |
                `,
                'could be [1, 4]',
            ],
        ],
    ),
    returns: 'the picked item or list of picked items',
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'reverse',
    callback: (args, value) => {
        const list = getListVar(null, null, value);
        list.reverse();
        return JSON.stringify(list);
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the list to reverse',
            typeList: [ARGUMENT_TYPE.LIST],
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            Returns a reversed list.
        `,
        [
            [
                `
                    /reverse [1, 2, 3, 4] |
                `,
                'returns [4, 3, 2, 1]',
            ],
        ],
    ),
    returns: 'the reversed list',
}));


SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'dict',
    callback: (args, value) => {
        const result = {};
        const list = getListVar(args.var, args.globalvar, value);
        for (const [key, val] of list) {
            result[key] = val;
        }
        return JSON.stringify(result);
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'var',
            description: 'name of the chat variable to use as input',
            typeList: [ARGUMENT_TYPE.VARIABLE_NAME],
        }),
        SlashCommandNamedArgument.fromProps({ name: 'globalvar',
            description: 'name of the global variable to use as input',
            typeList: [ARGUMENT_TYPE.VARIABLE_NAME],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'a list of lists, where each inner list has at least two elements',
            typeList: [ARGUMENT_TYPE.LIST],
            isRequired: true,
        }),
    ],
    returns: 'dictionary created from the input list of lists',
    helpString: help(
        `
            Takes a list of lists (each item must be a list of at least two items) and creates a dictionary by using each
            items first item as key and each items second item as value.
        `,
        [
            [
                `
                    /let x [
                        ["a", 1],
                        ["b", 2],
                        ["c", 3]
                    ] |
                    /dict {{var::x}} |
                    /echo
                `,
                'returns {a:1, b:2, c:3}',
            ],
        ],
    ),
}));


SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'keys',
    callback: async (args, value) => {
        let list;
        if (args.var !== undefined || args.globalvar !== undefined) {
            toastr.warning('Using var= or globalvar= in /keys is deprecated, please update your script to use unnamed arguments instead.', '/keys (LALib)', { preventDuplicates:true });
            list = getListVar(args.var, args.globalvar, value) ?? getVar(args.var, args.globalvar, value);
        } else {
            list = getListVar(null, null, value) ?? value;
        }
        return JSON.stringify(Object.keys(list));
    },
    namedArgumentList: [
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the dictionary to get keys from',
            typeList: [ARGUMENT_TYPE.DICTIONARY],
        }),
    ],
    returns: 'list of keys in the dictionary',
    helpString: help(
        `
            Return the list of keys of a dictionary.
        `,
        [
            [
                `
                    /let x {"a":1, "b":2, "c":3} |
                    /keys {{var::x}} |
                `,
                'returns ["a", "b", "c"]',
            ],
        ],
    ),
}));



// GROUP: Split & Join
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'split',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  var:string,
     *  globalvar:string,
     *  find:string,
     *  trim:string,
     * }} args
     * @param {string} value
     */
    callback: (args, value)=>{
        if (args.var !== undefined || args.globalvar !== undefined) {
            toastr.warning('Using var= or globalvar= in /split is deprecated, please update your script to use the unnamed argument instead.', '/split (LALib)', { preventDuplicates:true });
            value = getVar(args.var, args.globalvar, value);
        }
        /**@type {string|RegExp} */
        let find = args.find ?? ',';
        if (find.match(/^\/.+\/[a-z]*$/)) {
            find = new RegExp(find.replace(/^\/(.+)\/([a-z]*)$/, '$1'), find.replace(/^\/(.+)\/([a-z]*)$/, '$2'));
        }
        return JSON.stringify(value.split(find).map(it=>isTrueBoolean(args.trim ?? 'true') ? it.trim() : it));
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'find',
            description: 'the text to split at',
            typeList: [ARGUMENT_TYPE.STRING],
            defaultValue: ',',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'trim',
            description: 'whether to trim the resulting values',
            typeList: [ARGUMENT_TYPE.BOOLEAN],
            defaultValue: 'true',
            enumList: ['true', 'false'],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the value to split',
            typeList: [ARGUMENT_TYPE.STRING],
        }),
    ],
    returns: 'list of the split values',
    helpString: help(
        `
            Splits value into list at every occurrence of find. Supports regex <code>find="/\\s/"</code>
        `,
        [
            [
                `
                    /split find="/\\s/" The quick brown fox jumps over the lazy dog | /echo
                `,
                '',
            ],
        ],
    ),
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'join',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  var:string,
     *  globalvar:string,
     *  glue:string,
     * }} args
     * @param {string} value
     */
    callback: (args, value)=>{
        if (args.var !== undefined || args.globalvar !== undefined) {
            toastr.warning('Using var= or globalvar= in /join is deprecated, please update your script to use the unnamed argument instead.', '/join (LALib)', { preventDuplicates:true });
        }
        let list = getListVar(args.var, args.globalvar, value);
        if (Array.isArray(list)) {
            const glue = (args.glue ?? ', ')
                .replace(/{{space}}/g, ' ')
            ;
            return list.join(glue);
        }
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'glue',
            description: 'the string to join the list items with',
            typeList: [ARGUMENT_TYPE.STRING],
            defaultValue: ', ',
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the list to join',
            typeList: [ARGUMENT_TYPE.LIST],
        }),
    ],
    returns: 'a single string containing the joined list items',
    helpString: help(
        `
            Joins the items of a list with glue into a single string. Use <code>glue={{space}}</code> to join with a space.
        `,
        [
            [
                `
                    /join ["apple", "banana", "cherry"]
                `,
                'returns "apple, banana, cherry"',
            ],
            [
                `
                    /join glue=" | " ["apple", "banana", "cherry"]
                `,
                'returns "apple | banana | cherry"',
            ],
        ],
    ),
}));



// GROUP: Text Operations
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'trim',
    callback: (args, value) => {
        return value?.trim();
    },
    returns: 'the trimmed text',
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'text to trim',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            Removes whitespace at the start and end of the text.
        `,
        [
            [
                `
                    /let x "  foo " |
                    /trim {{var::x}}
                `,
                'return "foo"',
            ],
        ],
    ),
}));
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'pad-start',
    /**
     *
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments&{
     *  fill:string
     * }} args
     * @param {string[]} param1
     */
    callback: (args, [length, target]) => {
        return target.padStart(parseInt(length), args.fill);
    },
    returns: 'the padded text',
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'fill',
            description: 'the character to use to pad the text',
            defaultValue: ' ',
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'target length',
            typeList: [ARGUMENT_TYPE.NUMBER],
            isRequired: true,
        }),
        SlashCommandArgument.fromProps({
            description: 'the text to pad',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    splitUnnamedArgument: true,
    splitUnnamedArgumentCount: 1,
    helpString: help(
        `
            Pad the provided text at the start if it is shorter then the target length.
        `,
        [
            [
                `
                    /pad-start 5 foo
                `,
                'returns <code>  foo</code>',
            ],
            [
                `
                    /pad-start fill=+ 5 foo
                `,
                'returns <code>++foo</code>',
            ],
        ],
    ),
}));
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'pad-end',
    /**
     *
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments&{
     *  fill:string
     * }} args
     * @param {string[]} param1
     */
    callback: (args, [length, target]) => {
        return target.padEnd(parseInt(length), args.fill);
    },
    returns: 'the padded text',
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'fill',
            description: 'the character to use to pad the text',
            defaultValue: ' ',
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'target length',
            typeList: [ARGUMENT_TYPE.NUMBER],
            isRequired: true,
        }),
        SlashCommandArgument.fromProps({
            description: 'the text to pad',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    splitUnnamedArgument: true,
    splitUnnamedArgumentCount: 1,
    helpString: help(
        `
            Pad the provided text at the end if it is shorter then the target length.
        `,
        [
            [
                `
                    /pad-end 5 foo
                `,
                'returns <code>foo  </code>',
            ],
            [
                `
                    /pad-end fill=+ 5 foo
                `,
                'returns <code>foo++</code>',
            ],
        ],
    ),
}));
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'pad-both',
    /**
     *
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments&{
     *  fill:string
     * }} args
     * @param {string[]} param1
     */
    callback: (args, [length, target]) => {
        const add = (parseInt(length) - target.length) / 2;
        const fill = args.fill ?? ' ';
        return `${fill.repeat(Math.floor(add)).slice(0, Math.floor(add))}${target}${fill.repeat(Math.ceil(add)).slice(0, Math.ceil(add))}`;
    },
    returns: 'the padded text',
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'fill',
            description: 'the character to use to pad the text',
            defaultValue: ' ',
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'target length',
            typeList: [ARGUMENT_TYPE.NUMBER],
            isRequired: true,
        }),
        SlashCommandArgument.fromProps({
            description: 'the text to pad',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    splitUnnamedArgument: true,
    splitUnnamedArgumentCount: 1,
    helpString: help(
        `
            Pad the provided text at both ends if it is shorter then the target length.

            If an odd number of characters needs to be added, the remaining character will be added
            at the end of the text.
        `,
        [
            [
                `
                    /pad-both 5 foo
                `,
                'returns <code> foo </code>',
            ],
            [
                `
                    /pad-both fill=+ 5 foo
                `,
                'returns <code>+foo+</code>',
            ],
            [
                `
                    /pad-both fill=+ 6 foo
                `,
                'returns <code>+foo++</code>',
            ],
        ],
    ),
}));


SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'diff',
    callback: async (args, value) => {
        /**@type {HTMLScriptElement} */
        let script = document.querySelector('script[src*="SillyTavern-LALib/lib/wiked-diff.js"]');
        if (!script) {
            await new Promise(resolve=>{
                script = document.createElement('script');
                script.addEventListener('load', resolve);
                script.src = '/scripts/extensions/third-party/SillyTavern-LALib/lib/wiked-diff.js';
                document.body.append(script);
            });
            const style = document.createElement('style');
            style.innerHTML = `
                html > body {
                    .popup.wide_dialogue_popup.large_dialogue_popup:has(.lalib--diffContainer) {
                        aspect-ratio: unset;
                    }
                    .lalib--diffWrapper {
                        display: flex;
                        flex-direction: column;
                        height: 100%;
                        overflow: hidden;
                        align-items: stretch;
                        gap: 1em;
                        > .lalib--diffNotes {
                            flex: 0 0 auto;
                            align-self: center;
                            max-height: 20vh;
                            overflow: auto;
                            text-align: left;
                            font-size: 88%;
                            white-space: pre-wrap;
                        }
                        .lalib--diffContainer {
                            display: flex;
                            flex-direction: row;
                            gap: 1em;
                            text-align: left;
                            overflow: hidden;
                            flex: 1 1 auto;
                            > .lalib--diffOld, > .lalib--diffNew {
                                font-size: 88%;
                                line-height: 1.6;
                                white-space: pre-wrap;
                            }
                            > .lalib--diffOld, > .lalib--diffNew, .lalib--diffDiff {
                                flex: 1 1 0;
                                overflow: auto;
                                background-color: var(--greyCAIbg);
                            }
                        }
                        .lalib--diffButtons {
                            display: flex;
                            flex-direction: row;
                            gap: 1em;
                            justify-content: center;
                            > .lalib--diffButton {
                                white-space: nowrap;
                            }
                        }
                    }
                    .wikEdDiffFragment {
                        background-color: transparent;
                        border: none;
                        box-shadow: none;
                        padding: 0;
                        text-align: left;
                        * {
                            text-shadow: none !important;
                        }
                        .wikEdDiffInsert {
                            font-weight: normal;
                            background-color: rgb(200, 255, 200);
                        }
                        .wikEdDiffDelete {
                            font-weight: normal;
                            background-color: rgb(255, 150, 150);
                            text-decoration: line-through;
                        }
                        .wikEdDiffBlock {
                            font-weight: normal;
                            color: rgb(0, 0, 0);
                        }
                    }
                }
            `;
            document.body.append(style);
        }
        const makeDiffer = ()=>{
            const differ = new WikEdDiff();
            window.wikEdDiffConfig = window.wikEdDiffConfig ?? {};
            differ.config.fullDiff = true;
            differ.config.charDiff = false;
            // differ.config.unlinkMax = 50;
            return differ;
        };
        let oldText = args.old;
        let newText = args.new;
        if (isTrueFlag(args.stripcode)) {
            const stripcode = (text)=>text.split('```').filter((_,idx)=>idx % 2 == 0).join('');
            oldText = stripcode(oldText);
            newText = stripcode(newText);
        }
        const differ = makeDiffer();
        const diffHtml = differ.diff(oldText, newText);
        let diff;
        const updateDebounced = debounce((newText)=>diff.innerHTML = makeDiffer().diff(oldText, newText));
        const dom = document.createElement('div'); {
            dom.classList.add('lalib--diffWrapper');
            if (args.notes && args.notes.length) {
                const notes = document.createElement('div'); {
                    notes.classList.add('lalib--diffNotes');
                    notes.textContent = args.notes;
                    dom.append(notes);
                }
            }
            const container = document.createElement('div'); {
                container.classList.add('lalib--diffContainer');
                if (isTrueFlag(args.all)) {
                    const old = document.createElement('div'); {
                        old.classList.add('lalib--diffOld');
                        old.textContent = oldText;
                        container.append(old);
                    }
                    const ne = document.createElement('textarea'); {
                        ne.classList.add('lalib--diffNew');
                        ne.value = newText;
                        ne.addEventListener('input', ()=>{
                            newText = ne.value;
                            updateDebounced(ne.value);
                        });
                        container.append(ne);
                    }
                }
                diff = document.createElement('div'); {
                    diff.classList.add('lalib--diffDiff');
                    diff.innerHTML = diffHtml;
                    container.append(diff);
                }
                dom.append(container);
            }
            if (isTrueFlag(args.buttons)) {
                const buttons = document.createElement('div'); {
                    buttons.classList.add('lalib--diffButtons');
                    const btnOld = document.createElement('div'); {
                        btnOld.classList.add('lalib--diffButton');
                        btnOld.classList.add('menu_button');
                        btnOld.textContent = 'Use Old Text';
                        btnOld.addEventListener('click', ()=>{
                            result = oldText;
                            dlg.completeAffirmative();
                        });
                        buttons.append(btnOld);
                    }
                    const btnNew = document.createElement('div'); {
                        btnNew.classList.add('lalib--diffButton');
                        btnNew.classList.add('menu_button');
                        btnNew.textContent = 'Use New Text';
                        btnNew.addEventListener('click', ()=>{
                            result = newText;
                            dlg.completeAffirmative();
                        });
                        buttons.append(btnNew);
                    }
                    dom.append(buttons);
                }
            }
        }
        let result = '';
        const dlg = new Popup(dom, POPUP_TYPE.TEXT, null, { wide:true, large:true, okButton:'Close' });
        await dlg.show();
        return result;
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'all',
            description: 'show new, old, and diff side by side',
            typeList: [ARGUMENT_TYPE.BOOLEAN],
            defaultValue: 'true',
            enumList: ['true', 'false'],
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'buttons',
            description: 'add buttons to pick which text to return',
            typeList: [ARGUMENT_TYPE.BOOLEAN],
            defaultValue: 'true',
            enumList: ['true', 'false'],
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'stripcode',
            description: 'remove all codeblocks before diffing',
            typeList: [ARGUMENT_TYPE.BOOLEAN],
            defaultValue: 'true',
            enumList: ['true', 'false'],
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'notes',
            description: 'show additional notes or comments above the comparison',
            typeList: [ARGUMENT_TYPE.STRING],
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'old',
            description: 'the old text to compare',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'new',
            description: 'the new text to compare',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            Compares old text vs new text and displays the difference between the two. Use <code>all=true</code> to show new, old, and diff side by side. Use <code>buttons=true</code> to add buttons to pick which text to return. Use <code>stripcode=true</code> to remove all codeblocks before diffing. Use <code>notes="some text"</code> to show additional notes or comments above the comparison.
        `,
        [
            [
                `
                    /sub {{lastMessageId}} 1 |
                    /messages names=off |
                    /let old {{pipe}} |
                    /setvar key=old {{var::old}} |

                    /messages names=off {{lastMessageId}} |
                    /let new {{pipe}} |
                    /setvar key=new {{var::new}} |

                    /diff old={{var::old}} new={{var::new}}
                `,
                'compares the last two messages',
            ],
        ],
    ),
}));


SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'json-pretty',
    callback: (args, value) => {
        return JSON.stringify(JSON.parse(value), null, 4);
    },
    returns: 'formatted JSON',
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'JSON to pretty print',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            Pretty print JSON.
        `,
        [
            [
                `
                    /json-pretty {"a":1, "b":[1,2,3]} |
                    /send \`\`\`json{{newline}}{{pipe}}{{newline}}\`\`\`
                `,
                '',
            ],
        ],
    ),
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'substitute',
    callback: (args, value) => {
        const closure = new SlashCommandClosure();
        closure.scope = args._scope;
        return closure.substituteParams(value);
    },
    returns: 'text with macros replaced',
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'text to substitute macros in',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            Substitute macros in text.
        `,
        [
            [
                `
                    /let x foo |
                    /substitute x is \\{\\{var::x\\}\\} |
                `,
                '',
            ],
        ],
    ),
}));


SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'wordcount',
    callback: (args, value) => {
        const words = Array.from(new Intl.Segmenter(args.language ?? 'en', { granularity:'word' }).segment(value))
            .filter(it=>it.isWordLike);
        return words.length.toString();
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'language',
            description: 'Two character language code according to IETF BCP 47',
            typeList: [ARGUMENT_TYPE.STRING],
            defaultValue: 'en',
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the text to count words in',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    returns: 'the number of words',
    helpString: help(
        `
            Count the number of words in text. Language defaults to "en". Supply a two character language according to IETF BCP 47 language tags for other languages.
        `,
        [
            [
                `
                    /wordcount The quick brown fox jumps over the lazy dog. |
                `,
                'returns 9',
            ],
        ],
    ),
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'sentencecount',
    callback: (args, value) => {
        const words = Array.from(new Intl.Segmenter(args.language ?? 'en', { granularity:'sentence' }).segment(value));
        return words.length.toString();
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'language',
            description: 'Two character language code according to IETF BCP 47',
            typeList: [ARGUMENT_TYPE.STRING],
            defaultValue: 'en',
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the text to count sentences in',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    returns: 'the number of sentences',
    helpString: help(
        `
            Count the number of sentences in text. Language defaults to "en". Supply a two character language according to IETF BCP 47 language tags for other languages.
        `,
        [
            [
                `
                    /sentencecount The quick brown fox jumps over the lazy dog. Does the quick brown fox jump over the lazy dog? |
                `,
                'returns 2',
            ],
        ],
    ),
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'segment',
    callback: (args, value) => {
        args.granularity = args.granularity ?? 'word';
        const segments = Array.from(new Intl.Segmenter(args.language ?? 'en', { granularity: args.granularity }).segment(value))
            .filter(it=>args.granularity != 'word' || it.isWordLike)
            .map(it=>it.segment)
        ;
        return JSON.stringify(segments);
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'granularity',
            description: 'The unit to segment the text into: grapheme, word or sentence',
            typeList: [ARGUMENT_TYPE.STRING],
            enumList: ['grapheme', 'word', 'sentence'],
            defaultValue: 'word',
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'language',
            description: 'Two character language code according to IETF BCP 47',
            typeList: [ARGUMENT_TYPE.STRING],
            defaultValue: 'en',
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the text to segment',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    returns: 'list of the segments (graphemes, words, or sentences)',
    helpString: help(
        `
            Return the graphemes (characters, basically), words or sentences found in the text. Supply a two character language according to IETF BCP 47 language tags for other languages.
        `,
        [
            [
                `
                    /segment granularity=sentence The fox. The dog. |
                `,
                'returns ["The fox.", "The dog."]',
            ],
            [
                `
                    /segment granularity=word The fox. The dog. |
                `,
                'returns ["The", "fox", "The", "dog"]',
            ],
        ],
    ),
}));



// GROUP: Regular Expressions
const makeRegex = (value)=>{
    return new RegExp(
        value
            .replace(/^\/(.+)\/([a-z]*)$/, '$1')
        ,
        value
            .replace(/^\/(.+)\/([a-z]*)$/, '$2')
        ,
    );
};

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 're-escape',
    callback: (args, value) => escapeRegex(value),
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'text to escape',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    returns: 'regex-escaped string',
    helpString: help(
        `
            Escapes text to be used literally inside a regex.
        `,
        [
            [
                `
                    /re-escape foo/bar foo.bar |
                    /echo
                `,
                'Will echo <code>foo\\/bar foo\\.bar</code>.',
            ],
            [
                `
                    /re-escape {{char}} |
                    /re-replace find=/\\b{{pipe}}\\b/g replace=FOO {{lastMessage}} |
                    /echo
                `,
                '',
            ],
        ],
    ),
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 're-test',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  var:string,
     *  globalvar:string,
     *  find:string,
     * }} args
     * @param {string} value
     */
    callback: (args, value)=>{
        if (args.var !== undefined || args.globalvar !== undefined) {
            toastr.warning('Using var= or globalvar= in /re-test is deprecated, please update your script to use the unnamed argument instead.', '/re-test (LALib)', { preventDuplicates:true });
        }
        try {
            const re = makeRegex(args.find);
            const text = getVar(args.var, args.globalvar, value) ?? '';
            return JSON.stringify(re.test(text));
        } catch (ex) {
            toastr.error(ex.message);
        }
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'find',
            description: 'the regular expression to test against',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the value to test',
            typeList: [ARGUMENT_TYPE.STRING],
        }),
    ],
    returns: 'true or false',
    helpString: help(
        `
            Tests if the provided variable or value matches a regular expression.
        `,
        [
            [
                `
                    /re-test find=/dog/i The quick brown fox jumps over the lazy dog. |
                `,
                'returns true',
            ],
            [
                `
                    // pipes in the regex must to be escaped |
                    /re-test find=/dog\\|cat/i The quick brown fox jumps over the lazy dog. |
                `,
                'returns true',
            ],
            [
                `
                    // if you want to find a literal pipe, you have to also escape the backslash escaping it |
                    /re-test find=/dog\\\\\\|cat/i The quick brown fox jumps over the lazy dog. |
                `,
                'returns false',
            ],
            [
                `
                    // or you can put quote around the regex and forget about escaping... |
                    /re-test find="/dog|cat/i" The quick brown fox jumps over the lazy dog. |
                `,
                'returns true ("dog" or "cat")',
            ],
            [
                `
                    /re-test find="/dog\\|cat/i" The quick brown fox jumps over the lazy dog. |
                `,
                'result will be false (only matching literally "dog|cat")',
            ],
        ],
    ),
}));


SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 're-replace',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  var:string,
     *  globalvar:string,
     *  find:string,
     * }} args
     * @param {string} value
     */
    callback: async(args, value)=>{
        if (args.var !== undefined || args.globalvar !== undefined) {
            toastr.warning('Using var= or globalvar= in /re-replace is deprecated, please update your script to use the unnamed argument instead.', '/re-replace (LALib)', { preventDuplicates:true });
        }
        if (args.find == null) {
            throw new Error('/re-replace requires find= to be set.');
        }
        const text = getVar(args.var, args.globalvar, value);
        const re = makeRegex(args.find);
        if (args.cmd) {
            const replacements = [];
            /**@type {(function():Promise<string>)[]}*/
            const cmds = [];
            if (args.cmd instanceof SlashCommandClosure) {
                /**@type {SlashCommandClosure} */
                const closure = args.cmd;
                /**@type {RegExpExecArray} */
                let matches;
                let matchStart = -1;
                while ((matches = re.exec(text)) != null && matchStart != matches.index) {
                    matchStart = matches.index;
                    const copy = closure.getCopy();
                    matches.forEach((match, idx) => {
                        copy.scope.setMacro(`$${idx}`, match ?? '');
                    });
                    for (const key of Object.keys(matches.groups ?? {})) {
                        copy.scope.setMacro(`$:${key}`, matches.groups[key]);
                    }
                    copy.scope.setMacro('$index', matches.index);
                    copy.scope.setMacro('$input', matches.input);
                    copy.scope.setMacro('$*', '');
                    cmds.push(async () => (await copy.execute())?.pipe);
                }
            } else {
                text.toString().replace(re, (...matches) => {
                    const cmd = args.cmd.replace(/\$(\d+)/g, (_, idx) => matches[idx]);
                    cmds.push(async () => (await executeSlashCommandsWithOptions(
                        cmd,
                        {
                            handleExecutionErrors: false,
                            handleParserErrors: false,
                            parserFlags: args._parserFlags,
                            scope: args._scope,
                            abortController: args._abortController,
                        },
                    ))?.pipe);
                    return '';
                });
            }
            for (const cmd of cmds) {
                replacements.push(await cmd());
            }
            return text.toString().replace(re, () => replacements.shift());
        } else if (args.replace != null) {
            return text.toString().replace(re, args.replace);
        }
        console.warn('[LALIB]', args, value, text);
        throw new Error('/re-replace requires either replace= or cmd= to be set.');
    },
    returns: 'the new text',
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'find',
            description: 'the regular expression (/pattern/flags)',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'replace',
            description: 'the replacement text',
            typeList: [ARGUMENT_TYPE.STRING],
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'cmd',
            description: 'a closure or slash command to execute for each match',
            typeList: [ARGUMENT_TYPE.CLOSURE, ARGUMENT_TYPE.SUBCOMMAND],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the value to perform the replacement on',
            typeList: [ARGUMENT_TYPE.STRING],
        }),
    ],
    helpString: help(
        `
            Searches the provided variable or value with the regular expression and replaces matches with the replace value or the return value of the provided closure or slash command. For text replacements and slash commands, use <code>$1</code>, <code>$2</code>, ... to reference capturing groups. In closures use <code>{{$1}}</code>, <code>{{$2}}</code>, ... to reference capturing groups.
        `,
        [
            [
                `
                    /re-replace find=/\\s+/ replace=" " The quick   brown  fox  jumps over the lazy dog | /echo
                `,
                'replaces multiple whitespace with a single space',
            ],
            [
                `
                    /re-replace find=/([a-z]+) ([a-z]+)/ cmd="/echo $2 $1" the quick brown fox | /echo
                `,
                'swaps words using a slash command on each match',
            ],
        ],
    ),
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 're-exec',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  find:string,
     *  first:string,
     * }} args
     * @param {string} value
     */
    callback: async(args, value)=>{
        if (args.find == null) {
            throw new Error('/re-exec requires find= to be set.');
        }
        const returnFirst = isTrueBoolean((args.first ?? 'false') || 'true');
        const text = value;
        const re = makeRegex(args.find);
        const matchList = [];
        let matches;
        let matchStart = -1;
        while ((matches = re.exec(text)) != null && matchStart != matches.index) {
            matchStart = matches.index;
            const dict = {};
            matches.forEach((match, idx) => {
                dict[idx] = match;
            });
            for (const key of Object.keys(matches.groups ?? {})) {
                dict[`:${key}`] = matches.groups[key];
            }
            dict.index = matches.index;
            dict.input = matches.input;
            matchList.push(dict);
        }
        if (returnFirst) return matchList.length ? JSON.stringify(matchList[0]) : '';
        return JSON.stringify(matchList);
    },
    returns: 'list of match dictionaries',
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'find',
            description: 'the regular expression (/pattern/flags)',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'first',
            description: 'return only the first match instead of a list',
            typeList: [ARGUMENT_TYPE.BOOLEAN],
            defaultValue: 'false',
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the value to execute the regex on',
            typeList: [ARGUMENT_TYPE.STRING],
        }),
    ],
    helpString: help(
        `
            Searches the provided value with the regular expression and returns a list of all matches.
        `,
        [
            [
                `
                    /re-exec find=/\\b(?\\w+?(o+)\\w+?)\\b/g The quick brown fox jumps over the lazy fool dog. |
                    /json-pretty |
                    /comment \`\`\`{{newline}}{{pipe}}{{newline}}\`\`\`
                `,
                '',
            ],
            [
                `
                    /re-exec first= find=/\\b(?\\w+?(o+)\\w+?)\\b/g The quick brown fox jumps over the lazy fool dog. |
                    /json-pretty |
                    /comment \`\`\`{{newline}}{{pipe}}{{newline}}\`\`\`
                `,
                '',
            ],
        ],
    ),
}));



// GROUP: Accessing & Manipulating Structured Data
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'getat',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  var:string,
     *  globalvar:string,
     *  index:string,
     * }} args
     * @param {string} value
     */
    callback: async(args, value)=>{
        if (args.var !== undefined || args.globalvar !== undefined) {
            toastr.warning('Using var= or globalvar= in /getat is deprecated, please update your script to use the unnamed argument instead.', '/getat (LALib)', { preventDuplicates:true });
        }
        let index = getListVar(null, null, args.index) ?? [args.index];
        if (!Array.isArray(index)) {
            index = [index];
        }
        const list = getListVar(args.var, args.globalvar, value);
        let result = list;
        while (index.length > 0 && result !== undefined) {
            const ci = index.shift();
            result = Array.isArray(result) ? result.slice(ci)[0] : result[ci];
            try { result = JSON.parse(result); } catch { /*empty*/ }
        }
        if (typeof result != 'string') {
            return JSON.stringify(result);
        }
        return result;
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'index',
            description: 'the index, field name, or list of indices/field names to retrieve',
            typeList: [ARGUMENT_TYPE.STRING, ARGUMENT_TYPE.NUMBER, ARGUMENT_TYPE.LIST],
            isRequired: true,
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the value to retrieve from (if not using a variable)',
            typeList: [ARGUMENT_TYPE.STRING],
        }),
    ],
    helpString: help(
        `
            Retrieves an item from a list or a property from a dictionary.
        `,
        [
            [
                `
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
                `,
                'returns "D"',
            ],
            [
                `
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
                `,
                'returns "foo"',
            ],
            [
                `
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
                `,
                'returns "bar"',
            ],
        ],
    ),
    returns: 'the retrieved item or property value',
}));


SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'setat',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  var:string,
     *  globalvar:string,
     *  index:string,
     *  value:string,
     * }} args
     * @param {string} value
     */
    callback: async(args, value)=>{
        if (args.var !== undefined || args.globalvar !== undefined) {
            toastr.warning('Using var= or globalvar= in /setat is deprecated, please update your script to use value= instead.', '/setat (LALib)', { preventDuplicates:true });
        }
        try { value = JSON.parse(value); } catch { /*empty*/ }
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
            } catch { /*empty*/ }
        }
        if (list !== undefined) {
            let result = (typeof list != 'string') ? JSON.stringify(list) : list;
            if (args.var) {
                await executeSlashCommands(`/setvar key="${args.var}" ${result.replace(/\|/g, '\\|')}`);
            }
            if (args.globalvar) {
                await executeSlashCommands(`/setglobalvar key="${args.globalvar}" ${result.replace(/\|/g, '\\|')}`);
            }
            return result;
        }
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'index',
            description: 'the index or key to set the value at',
            typeList: [ARGUMENT_TYPE.STRING, ARGUMENT_TYPE.LIST],
            isRequired: true,
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'value',
            description: 'the value to update',
            typeList: [ARGUMENT_TYPE.LIST, ARGUMENT_TYPE.DICTIONARY],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the value to set',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            Sets an item in a list or a property in a dictionary.
        `,
        [
            [
                `
                    /setat value=[1,2,3] index=1 X
                `,
                'returns <code>[1,"X",3]</code>',
            ],
            [
                `
                    /setat value={{var::myVariable}} index=[1,2,"someProperty"] foobar
                `,
                'sets the value of <code>myVariable[1][2].someProperty</code> to "foobar" (the variable will be updated and the resulting value of myVariable will be returned)',
            ],
        ],
    ),
    returns: 'the updated list or dictionary',
}));



// GROUP: Exception Handling
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'try',
    /**
     *
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments} args
     * @param {(string|SlashCommandClosure)[]} value
     */
    callback: async (args, value) => {
        /**@type {string|SlashCommandClosure} */
        let command;
        if (value) {
            if (value[0] instanceof SlashCommandClosure) {
                command = value[0];
            } else {
                command = value.join(' ');
            }
        }
        try {
            let result;
            if (command instanceof SlashCommandClosure) {
                result = await command.execute();
            } else {
                result = await executeSlashCommandsWithOptions(
                    command,
                    {
                        handleExecutionErrors: false,
                        handleParserErrors: false,
                        parserFlags: args._parserFlags,
                        scope: args._scope,
                        abortController: args._abortController,
                    },
                );
            }
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
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the command to try',
            typeList: [ARGUMENT_TYPE.CLOSURE, ARGUMENT_TYPE.SUBCOMMAND],
            isRequired: true,
        }),
    ],
    splitUnnamedArgument: true,
    helpString: help(
        `
            Attempts to execute the provided command and catches any exceptions thrown. Use with <code>/catch</code>.
        `,
        [
            [
                `
                    /try {: /var x :} |
                    /catch {: /echo An error occurred: {{exception}} :}
                `,
                '',
            ],
        ],
    ),
    returns: 'an object with properties `isException` and `result` or `exception`',
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'catch',
    /**
     *
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments} args
     * @param {(string|SlashCommandClosure)[]} value
     */
    callback: async (args, value) => {
        /**@type {string|SlashCommandClosure} */
        let command;
        if (value) {
            if (value[0] instanceof SlashCommandClosure) {
                command = value[0];
            } else {
                command = value.join(' ');
            }
        }
        let data;
        try {
            data = JSON.parse(args._scope.pipe);
        } catch (ex) {
            console.warn('[LALIB]', '[CATCH]', 'failed to parse pipe', args._scope.pipe, ex);
        }
        if (data?.isException) {
            let result;
            if (command instanceof SlashCommandClosure) {
                command.scope.setMacro('exception', data.exception);
                command.scope.setMacro('error', data.exception);
                result = await command.execute();
            } else {
                result = await executeSlashCommandsWithOptions(
                    command.replace(/{{(exception|error)}}/ig, data.exception),
                    {
                        handleExecutionErrors: false,
                        handleParserErrors: false,
                        parserFlags: args._parserFlags,
                        scope: args._scope,
                        abortController: args._abortController,
                    },
                );
            }
            return result.pipe;
        } else {
            return data?.result;
        }
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the command to execute if an exception occurred',
            typeList: [ARGUMENT_TYPE.CLOSURE, ARGUMENT_TYPE.SUBCOMMAND],
            isRequired: true,
        }),
    ],
    splitUnnamedArgument: true,
    helpString: help(
        `
            Used with the \`/try\` command to handle exceptions. Use \`{{exception}}\` or \`{{error}}\` to get the exception's message.
        `,
        [
            [
                `
                    /try {: /var x :} |
                    /catch {: /echo An error occurred: {{exception}} :}
                `,
                '',
            ],
        ],
    ),
    returns: 'the result of the catch command, or the original result if no exception occurred',
}));



// GROUP: Null Handling
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'ifempty',
    callback: (args, value) => {
        const list = getListVar(null, null, args.value);
        if (list) {
            if (Array.isArray(list)) {
                if (list.length == 0) return value;
            } else if (typeof list == 'object') {
                if (Object.keys(list).length == 0) return value;
            }
        } else {
            const val = getVar(null, null, args.value);
            if ((val?.length ?? 0) == 0) return value;
        }
        return args.value;
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'value',
            description: 'the value to check',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the fallback value',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            Returns the fallback value if value is empty (empty string, empty list, empty dictionary).
        `,
        [
            [
                `
                    /ifempty value=[] [1,2,3] |
                `,
                'returns [1, 2, 3]',
            ],
            [
                `
                    /setvar key=x |
                    /setvar key=y bar |
                    /ifempty value={{getvar::x}} foo |
                    /setvar key=xx {{pipe}} |
                    /ifempty value={{getvar::y}} foo |
                    /setvar key=yy {{pipe}} |
                `,
                'sets <code>xx</code> to "foo" and <code>yy</code> to "bar"',
            ],
        ],
    ),
    returns: 'the value or the fallback value',
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'ifnullish',
    callback: (args, value) => {
        if ((args.value?.length ?? 0) == 0) return value;
        return args.value;
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'value',
            description: 'the value to check',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the fallback value',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            Returns the fallback value if value is nullish (empty string).
        `,
        [
            [
                `
                    /ifnullish value=[] [1,2,3] |
                `,
                'returns []',
            ],
            [
                `
                    /setvar key=x |
                    /setvar key=y bar |
                    /ifnullish value={{getvar::x}} foo |
                    /setvar key=xx {{pipe}} |
                    /ifnullish value={{getvar::y}} foo |
                    /setvar key=yy {{pipe}} |
                `,
                'sets <code>xx</code> to "foo" and <code>yy</code> to "bar"',
            ],
        ],
    ),
    returns: 'the value or the fallback value',
}));



// GROUP: Copy & Download
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'copy',
    callback: (args, value) => {
        try {
            navigator.clipboard.writeText(value.toString());
        } catch {
            console.warn('/copy cannot use clipboard API, falling back to execCommand');
            const ta = document.createElement('textarea'); {
                ta.value = value.toString();
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
        }
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the value to copy',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            Copies value into clipboard.
        `,
        [
            [
                `
                    /copy this text is now in your clipboard |
                `,
                '',
            ],
            [
                `
                    /copy {{lastMessage}}
                `,
                'puts the last chat message in your clipboard',
            ],
        ],
    ),
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'download',
    callback: (args, value) => {
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
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'name',
            description: 'the filename for the downloaded file',
            typeList: [ARGUMENT_TYPE.STRING],
            defaultValue: `SillyTavern-${new Date().toISOString()}`,
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'ext',
            description: 'the file extension for the downloaded file',
            typeList: [ARGUMENT_TYPE.STRING],
            defaultValue: 'txt',
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the value to download as a text file',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            Downloads value as a text file.
        `,
        [
            [
                `
                    /download Let's download this text.
                `,
                'downloads a txt file containing "Let\'s download this text."',
            ],
            [
                `
                    /download name=TheLastMessage ext=md {{lastMessage}}
                `,
                'downloads a file <code>TheLastMessage.md</code> containing the last chat message',
            ],
        ],
    ),
}));



// GROUP: DOM Interaction
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'dom',
    callback: (args, query) => {
        const quiet = isTrueBoolean(args.quiet);
        /**@type {HTMLElement[]} */
        let targets;
        try {
            targets = isTrueBoolean(args.multi) ? [...document.querySelectorAll(query)] : [document.querySelector(query)];
            targets.filter(it=>it);
        } catch (ex) {
            toastr.error(ex?.message ?? ex);
            return '';
        }
        if (!targets?.length) {
            quiet || toastr.warning(`No element found for query: ${query}`);
            return '';
        }
        const result = targets.map((target,idx)=>{
            if (args.target !== undefined && idx != Number(args.target)) return '';
            switch (args.action) {
                case 'click': {
                    target.click();
                    return '';
                }
                case 'value': {
                    if (target.value === undefined) {
                        quiet || toastr.warning(`Cannot set value on ${target.tagName}`);
                        return '';
                    }
                    target.value = args.value;
                    target.dispatchEvent(new Event('change', { bubbles:true }));
                    target.dispatchEvent(new Event('input', { bubbles:true }));
                    target.dispatchEvent(new Event('mouseup', { bubbles:true }));
                    return '';
                }
                case 'property': {
                    if (Object.keys(args).includes('value')) {
                        target[args.property] = args.value;
                    }
                    if (target[args.property] === undefined) {
                        quiet || toastr.warning(`Property "${args.property}" does not exist on ${target.tagName}`);
                        return '';
                    }
                    const propVal = target[args.property];
                    return propVal ?? '';
                }
                case 'attribute': {
                    if (Object.keys(args).includes('value')) {
                        target.setAttribute(args.attribute, args.value);
                    }
                    return target.getAttribute(args.attribute) ?? '';
                }
                case 'call': {
                    if (target[args.property] === undefined || !(target[args.property] instanceof Function)) {
                        quiet || toastr.warning(`Property "${args.property}" does not exist or is not callable on ${target.tagName}`);
                        return '';
                    }
                    let callArgs = [];
                    if (args.args !== undefined) {
                        try {
                            callArgs = JSON.parse(args.args);
                            if (!Array.isArray(callArgs)) callArgs = [callArgs];
                        } catch {
                            callArgs = [args.args];
                        }
                    }
                    return target[args.property](...callArgs) ?? '';
                }
            }
        });
        if (isTrueBoolean(args.multi) && args.target !== undefined) {
            const r = result[args.target];
            if (typeof r != 'string') return JSON.stringify(r);
            return r;
        }
        if (isTrueBoolean(args.multi)) return JSON.stringify(result);
        if (typeof result[0] != 'string') return JSON.stringify(result[0]);
        return result[0];
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'quiet',
            description: 'true: don\'t show warnings',
            typeList: [ARGUMENT_TYPE.BOOLEAN],
            defaultValue: 'false',
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'multi',
            description: 'true: target all matching elements; false: target first matching element',
            typeList: [ARGUMENT_TYPE.BOOLEAN],
            defaultValue: 'false',
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'target',
            description: 'target the n-th matching element if multi=true (zero-based)',
            typeList: [ARGUMENT_TYPE.NUMBER],
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'action',
            description: 'the action to perform',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
            enumList: ['click', 'value', 'property', 'attribute', 'call'],
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'value',
            description: 'new value to set (for action=value or action=property or action=attribute)',
            typeList: [ARGUMENT_TYPE.STRING],
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'property',
            description: 'property name to get/set/call (for action=property or action=call)',
            typeList: [ARGUMENT_TYPE.STRING],
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'attribute',
            description: 'attribute name to get/set (for action=attribute)',
            typeList: [ARGUMENT_TYPE.STRING],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'CSS selector to target an element',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    returns: 'the result of the action, if any',
    helpString: help(
        `
            Click on an element, change its value, retrieve a property, or retrieve an attribute. To select the targeted element, use CSS selectors.
        `,
        [
            [
                `
                    /dom action=click #expandMessageActions
                `,
                '',
            ],
            [
                `
                    /dom action=value value=0 #avatar_style
                `,
                '',
            ],
        ],
    ),
}));



// GROUP: Characters
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'char-get',
    /**
     * @param {{index:string}} args
     * @param {string} value
     */
    callback: (args, value)=>{
        let char;
        if (value) {
            char = characters.find(it=>it.avatar.toLowerCase() == value.toLowerCase() || it.name.toLowerCase() == value.toLowerCase());
        } else {
            char = characters[getContext().characterId];
        }
        /**@type {import('../../../char-data.js').v1CharData|string|boolean|number} */
        let result = char;
        if (args.index) {
            result = char[args.index];
        }
        if (result == null || result == undefined) return '';
        if (typeof result != 'string') return JSON.stringify(result);
        return result.toString();
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'index',
            description: 'the field to retrieve',
            typeList: [ARGUMENT_TYPE.STRING],
            enumProvider: ()=>Object.keys(characters[0] ?? {}).map(it=>new SlashCommandEnumValue(it)),
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'character avatar (filename) or name',
            typeList: [ARGUMENT_TYPE.STRING],
            defaultValue: 'current character',
            enumProvider: ()=>characters.map(it=>new SlashCommandEnumValue(it.name, it.avatar)),
        }),
    ],
    returns: 'char object or property',
    helpString: help(
        `
            Get a character object or one of its properties.
        `,
        [
            [
                `
                    /char-get Seraphina |
                    /getat index=description |
                    /echo
                `,
                '',
            ],
            [
                `
                    /char-get index=description Seraphina |
                    /echo
                `,
                '',
            ],
        ],
    ),
}));



// GROUP: Group Chats
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'memberpos',
    callback: async(args, value) => {
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
            return currentIndex.toString();
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
        return currentIndex.toString();
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'name of the group member',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
        SlashCommandArgument.fromProps({
            description: 'new position index for the member',
            typeList: [ARGUMENT_TYPE.NUMBER],
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            Move group member to position (index starts with 0).
        `,
        [
            [
                `
                    /memberpos Alice 3 |
                    /echo Alice has been moved to position 3 |
                `,
                '',
            ],
        ],
    ),
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'group-get',
    /**
     * @param {{index:string, chars:string}} args
     * @param {string} value
     */
    callback: (args, value)=>{
        const group = groups.find(it=>value ? (it.name.toLowerCase() == value.toLowerCase()) : (it.id == getContext().groupId));
        /**@type {object|string|boolean|number} */
        let result = structuredClone(group);
        if (isTrueBoolean(args.chars)) {
            result.members = result.members.map(ava=>characters.find(it=>it.avatar == ava));
        }
        if (args.index) {
            result = result[args.index];
        }
        if (result == null || result == undefined) return '';
        if (typeof result != 'string') return JSON.stringify(result);
        return result.toString();
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'index',
            description: 'the field to retrieve',
            typeList: [ARGUMENT_TYPE.STRING],
            enumProvider: ()=>Object.keys(groups[0] ?? {}).map(it=>new SlashCommandEnumValue(it)),
        }),
        SlashCommandNamedArgument.fromProps({ name: 'chars',
            description: 'resolve characters',
            typeList: [ARGUMENT_TYPE.BOOLEAN],
            defaultValue: 'false',
            enumList: ['true', 'false'],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'group name',
            typeList: [ARGUMENT_TYPE.STRING],
            defaultValue: 'current group',
            enumProvider: ()=>groups.map(it=>new SlashCommandEnumValue(it.name, it.members.join(', '))),
        }),
    ],
    returns: 'char object or property',
    helpString: help(
        `
            Get a group object or one of its properties.
        `,
        [
            [
                `
                    /group-get MyGroup |
                    /getat index=description |
                    /echo
                `,
                '',
            ],
            [
                `
                    /group-get index=description MyGroup |
                    /echo
                `,
                '',
            ],
            [
                `
                    /group-get index=members chars=true MyGroup |
                    /echo
                `,
                '',
            ],
        ],
    ),
}));



// GROUP: Conditionals - switch
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'switch',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  var:string,
     *  globalvar:string,
     * }} args
     * @param {string} value
     */
    callback: async(args, value)=>{
        if (args.var !== undefined || args.globalvar !== undefined) {
            toastr.warning('Using var= or globalvar= in /switch is deprecated, please update your script to use the unnamed argument instead.', '/switch (LALib)', { preventDuplicates:true });
        }
        const val = getVar(args.var, args.globalvar, value.toString());
        return JSON.stringify({
            switch: val,
            break: false,
        });
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the value to use as the switch value',
            typeList: [ARGUMENT_TYPE.STRING, ARGUMENT_TYPE.NUMBER],
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            Use with /case to conditionally execute commands based on a value.
        `,
        [
            [
                `
                    /let x foo |
                    /switch {{var::x}} |
                        /case 1 {: /echo value is one :} |
                        /case foo {: /echo value is foo :} |
                        /case bar {: /echo value is bar :} |
                        /case {: /echo value is something else :} |
                `,
                'returns "value is foo"',
            ],
        ],
    ),
    returns: 'an object containing the switch value',
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'case',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  var:string,
     *  globalvar:string,
     *  value:string,
     *  index:string,
     * }} args
     * @param {[string|SlashCommandClosure, SlashCommandClosure|string]} unnamedArgs
     */
    callback: async(args, unnamedArgs)=>{
        /**@type {string} */
        let value;
        /**@type {string} */
        let command;
        /**@type {SlashCommandClosure} */
        let closure;
        if (args.var !== undefined || args.globalvar !== undefined || args.value !== undefined) {
            toastr.warning('Using value= in /case is deprecated, please update your script to use unnamed arguments instead.', '/case (LALib)', { preventDuplicates:true });
            value = getVar(null, null, args.value);
            if (unnamedArgs[0] instanceof SlashCommandClosure) {
                closure = /**@type {SlashCommandClosure}*/(unnamedArgs[0]);
            } else {
                command = unnamedArgs.join(' ');
            }
        } else {
            let cmdArg;
            if (unnamedArgs.length > 1) {
                value = getVar(null, null, unnamedArgs[0]);
                cmdArg = unnamedArgs[1];
            } else {
                cmdArg = unnamedArgs[0];
            }
            if (cmdArg instanceof SlashCommandClosure) {
                closure = /**@type {SlashCommandClosure}*/(cmdArg);
            } else {
                command = cmdArg;
            }
        }
        let data;
        try {
            data = JSON.parse(args._scope.pipe);
        } catch (ex) {
            console.warn('[LALIB]', '[CASE]', 'failed to parse pipe', args._scope.pipe, ex);
        }
        if (data?.break) return args._scope.pipe;
        if (data?.switch !== undefined) {
            if (data.switch == value || value === undefined) {
                data.break = true;
                args._scope.pipe = JSON.stringify(data);
                if (closure) {
                    closure.scope.setMacro('value', data.switch);
                    return (await closure.execute())?.pipe;
                }
                const commandResult = await executeSlashCommandsWithOptions(
                    command.toString().replace(/{{value}}/ig, data.switch),
                    {
                        handleExecutionErrors: false,
                        handleParserErrors: false,
                        parserFlags: args._parserFlags,
                        scope: args._scope,
                        abortController: args._abortController,
                    },
                );
                return commandResult.pipe;
            }
        }
        return args._scope.pipe;
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the value to compare against the switch value',
            typeList: [ARGUMENT_TYPE.STRING, ARGUMENT_TYPE.NUMBER],
            isRequired: true,
        }),
        SlashCommandArgument.fromProps({
            description: 'the command to execute if the value matches the switch value',
            typeList: [ARGUMENT_TYPE.CLOSURE, ARGUMENT_TYPE.SUBCOMMAND],
            isRequired: true,
        }),
    ],
    splitUnnamedArgument: true,
    helpString: help(
        `
            Execute a command if the provided value matches the switch value from /switch.
        `,
        [
            [
                `
                    // see /switch |
                `,
                '',
            ],
        ],
    ),
    returns: 'the result of the executed command, or the unchanged pipe if no match',
}));



// GROUP: Conditionals - if
const ifExamples = `
        <ul>
            <li>
                <pre><code class="language-stscript">
                    /let a {{roll:1d6}} |
                    /ife (a == 1) {:
                        /echo a is one |
                    :} |
                    /elseif (a == 2) {:
                        /echo a is two |
                    :} |
                    /else {:
                        /echo a is something else ({{var::a}})
                    :} |
                </code></pre>
            </li>
        </ul>
    `.replace(/(<pre><code .+?>)\n(\s+)(.+?)\n(\s+<\/code>)/sg, (_, start, indent, script, end)=>{
        const indentRegex = new RegExp(`^${indent}`, 'gm');
        return `${start}${script.replace(indentRegex, '')}${end}`;
    })
;
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'ife',
    /**
     *
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments} args
     * @param {(string|SlashCommandClosure)[]} value
     */
    callback: async (args, value) => {
        if (!Array.isArray(value)) value = [value];
        /**@type {SlashCommandClosure} */
        let then;
        /**@type {SlashCommandClosure} */
        let closure;
        /**@type {string} */
        let command;
        /**@type {string} */
        let expression;
        if (value) {
            if (value.length > 1 && value.at(-1) instanceof SlashCommandClosure) {
                then = /**@type {SlashCommandClosure}*/(value.pop());
            }
            if (value[0] instanceof SlashCommandClosure) {
                closure = value[0];
            } else {
                const text = value.join(' ').trim();
                expression = text;
            }
        }
        let result;
        if (closure) {
            result = isTrueBoolean((await closure.execute()).pipe);
        } else if (command) {
            result = isTrueBoolean((await executeSlashCommandsWithOptions(
                command,
                {
                    handleExecutionErrors: false,
                    handleParserErrors: false,
                    parserFlags: args._parserFlags,
                    scope: args._scope,
                    abortController: args._abortController,
                },
            ))?.pipe);
        } else if (expression) {
            const parser = new BoolParser(args._scope, args);
            result = parser.parse(expression)();
        } else {
            throw new Error('/ife - something went wrong');
        }
        const data = {
            if: result,
            isHandled: false,
        };
        if (result && then) {
            data.isHandled = true;
            const thenResult = await then.execute();
            return thenResult?.pipe ?? JSON.stringify(data);
        }
        return JSON.stringify(data);
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'expression variables',
            description: 'named arguments assigned to scoped variables to be used in the expression',
            acceptsMultiple: true,
            typeList: [ARGUMENT_TYPE.BOOLEAN, ARGUMENT_TYPE.CLOSURE, ARGUMENT_TYPE.DICTIONARY, ARGUMENT_TYPE.LIST, ARGUMENT_TYPE.NUMBER, ARGUMENT_TYPE.STRING],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the expression or closure to evaluate, followed by the closure to execute if true',
            typeList: [ARGUMENT_TYPE.STRING, ARGUMENT_TYPE.CLOSURE],
            isRequired: true,
            acceptsMultiple: true,
            enumProvider: makeIfWhileEnumProvider('if'),
        }),
    ],
    // splitUnnamedArgument: true,
    helpString: help(
        `
            Execute a closure if the expression or first closure returns <code>true</code>.

            Use with <code>/elseif</code> and <code>/else</code>.

            See <a data-lalib-exec="/lalib? expressions"><code>/lalib? expressions</code></a> for more details on expressions.
        `,
        [
            [
                `
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
                `,
                '',
            ],
            [
                `
                    /genraw say either foo or bar |
                    /ife result={{pipe}} ('foo' in result) {:
                        /echo said "foo" |
                    :} |
                    /else {:
                        /echo did not say "foo" |
                    :} |
                `,
                'use named arguments to provide variables to the expression',
            ],
        ],
    ),
    returns: 'an object with a boolean "if" property',
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'elseif',
    /**
     *
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments} args
     * @param {(string|SlashCommandClosure)[]} value
     */
    callback: async (args, value) => {
        if (!Array.isArray(value)) value = [value];
        /**@type {SlashCommandClosure} */
        let then;
        /**@type {SlashCommandClosure} */
        let closure;
        /**@type {string} */
        let command;
        /**@type {string} */
        let expression;
        if (value) {
            if (value.length > 1 && value.at(-1) instanceof SlashCommandClosure) {
                then = /**@type {SlashCommandClosure}*/(value.pop());
            }
            if (value[0] instanceof SlashCommandClosure) {
                closure = value[0];
            } else {
                const text = value.join(' ');
                expression = text;
            }
        }
        let data;
        try {
            data = JSON.parse(args._scope.pipe);
        } catch (ex) {
            console.warn('[LALIB]', '[ELSEIF]', 'failed to parse pipe', args._scope.pipe, ex);
        }
        if (data?.if !== undefined) {
            if (!data.if) {
                let result;
                if (closure) {
                    result = isTrueBoolean((await closure.execute()).pipe);
                } else if (command) {
                    result = isTrueBoolean((await executeSlashCommandsWithOptions(
                        command,
                        {
                            handleExecutionErrors: false,
                            handleParserErrors: false,
                            parserFlags: args._parserFlags,
                            scope: args._scope,
                            abortController: args._abortController,
                        },
                    ))?.pipe);
                } else if (expression) {
                    const parser = new BoolParser(args._scope, args);
                    result = parser.parse(expression)();
                } else {
                    throw new Error('/ife - something went wrong');
                }
                const data = {
                    if: result,
                    isHandled: false,
                };
                if (result && then) {
                    data.isHandled = true;
                    const thenResult = await then.execute();
                    return thenResult?.pipe ?? JSON.stringify(data);
                }
                return JSON.stringify(data);
            }
        }
        return args._scope.pipe;
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'expression variables',
            description: 'named arguments assigned to scoped variables to be used in the expression',
            acceptsMultiple: true,
            typeList: [ARGUMENT_TYPE.BOOLEAN, ARGUMENT_TYPE.CLOSURE, ARGUMENT_TYPE.DICTIONARY, ARGUMENT_TYPE.LIST, ARGUMENT_TYPE.NUMBER, ARGUMENT_TYPE.STRING],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the expression or closure to evaluate, followed by the closure to execute if true',
            typeList: [ARGUMENT_TYPE.STRING, ARGUMENT_TYPE.CLOSURE],
            isRequired: true,
            acceptsMultiple: true,
            enumProvider: makeIfWhileEnumProvider('if'),
        }),
    ],
    // splitUnnamedArgument: true,
    helpString: help(
        `
            Execute a closure if none of the preceeding <code>/ife</code> and <code>/elseif</code> executed and the expression or first closure returns <code>true</code>.

            Use with <code>/ife</code> and <code>/else</code>.

            See <a data-lalib-exec="/lalib? expressions"><code>/lalib? expressions</code></a> for more details on expressions.
        `,
        [
            [
                `
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
                `,
                '',
            ],
        ],
    ),
    returns: 'an object with a boolean "if" property',
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'else',
    /**
     *
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments} args
     * @param {(string|SlashCommandClosure)[]} value
     */
    callback: async (args, value) => {
        /**@type {string|SlashCommandClosure} */
        let command;
        if (value) {
            if (value[0] instanceof SlashCommandClosure) {
                command = value[0];
            } else {
                command = value.join(' ');
            }
        }
        let data;
        try {
            data = JSON.parse(args._scope.pipe);
        } catch (ex) {
            console.warn('[LALIB]', '[ELSE]', 'failed to parse pipe', args.value, ex);
        }
        if (data?.if !== undefined && !data?.isHandled) {
            if (!data.if) {
                data.isHandled = true;
                let result;
                if (command instanceof SlashCommandClosure) {
                    result = await command.execute();
                } else {
                    result = await executeSlashCommandsWithOptions(
                        command,
                        {
                            handleExecutionErrors: false,
                            handleParserErrors: false,
                            parserFlags: args._parserFlags,
                            scope: args._scope,
                            abortController: args._abortController,
                        },
                    );
                }
                return result.pipe ?? JSON.stringify(data);
            }
        }
        return args._scope.pipe;
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the command to execute',
            typeList: [ARGUMENT_TYPE.CLOSURE, ARGUMENT_TYPE.SUBCOMMAND],
            isRequired: true,
        }),
    ],
    splitUnnamedArgument: true,
    helpString: help(
        `
            Execute a closure if none of the preceeding <code>/ife</code> and <code>/elseif</code> executed.

            Use with <code>/ife</code> and <code>/elseif</code>.

            See <a href="javascript:;" data-lalib-exec="/lalib? expressions"><code>/lalib? expressions</code></a> for more details on expressions.
        `,
        [
            [
                `
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
                `,
                '',
            ],
        ],
    ),
    returns: 'the result of the executed command',
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'then',
    /**
     *
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments} args
     * @param {(string|SlashCommandClosure)[]} value
     */
    callback: async (args, value) => {
        toastr.warning('/then is deprecated, please update your script to use the unnamed arguments in /ife or /elseif instead.', '/then (LALib)', { preventDuplicates:true });
        /**@type {string|SlashCommandClosure} */
        let command;
        if (value) {
            if (value[0] instanceof SlashCommandClosure) {
                command = value[0];
            } else {
                command = value.join(' ');
            }
        }
        let data;
        try {
            data = JSON.parse(args._scope.pipe);
        } catch (ex) {
            console.warn('[LALIB]', '[THEN]', 'failed to parse pipe', args._scope.pipe, ex);
        }
        if (data?.if !== undefined && !data?.isHandled) {
            if (data.if) {
                data.isHandled = true;
                let result;
                if (command instanceof SlashCommandClosure) {
                    result = await command.execute();
                } else {
                    result = await executeSlashCommandsWithOptions(
                        command,
                        {
                            handleExecutionErrors: false,
                            handleParserErrors: false,
                            parserFlags: args._parserFlags,
                            scope: args._scope,
                            abortController: args._abortController,
                        },
                    );
                }
                return result.pipe ?? JSON.stringify(data);
            }
        }
        return args._scope.pipe;
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the command to execute',
            typeList: [ARGUMENT_TYPE.CLOSURE, ARGUMENT_TYPE.SUBCOMMAND],
            isRequired: true,
        }),
    ],
    splitUnnamedArgument: true,
    helpString: help(
        `
            <div><strong>DEPRECATED</strong></div>
        `,
        [
            ['// DEPRECATED |', ''],
        ],
    ),
    returns: 'the result of the executed command',
}));



const getBookNamesWithSource = ()=>{
    const context = getContext();
    return {
        global: world_info.globalSelect ?? [],
        chat: chat_metadata.world_info ?? null,
        character: characters[context.characterId]?.data?.character_book?.name ?? null,
        characterAuxiliary: world_info.charLore?.find(it=>it.name == characters[context.characterId]?.avatar?.split('.')?.slice(0,-1)?.join('.'))?.extraBooks ?? [],
        group: groups
            .find(it=>it.id == context.groupId)
            ?.members
            ?.map(m=>[m, characters.find(it=>it.avatar == m)?.data?.character_book?.name])
            ?.reduce((dict,cur)=>{
                dict[cur[0]] = {
                    character: cur[1] ?? null,
                    auxiliary: world_info.charLore?.find(it=>it.name == cur[0].split('.').slice(0,-1).join('.'))?.extraBooks ?? [],
                };
                return dict;
            }, {})
            ?? {},
    };
};
const getBookNames = ()=>{
    const context = getContext();
    const names = [
        ...(world_info.globalSelect ?? []),
        chat_metadata.world_info,
        characters[context.characterId]?.data?.character_book?.name,
        ...world_info.charLore?.find(it=>it.name == characters[context.characterId]?.avatar?.split('.')?.slice(0,-1)?.join('.'))?.extraBooks ?? [],
        ...(groups
            .find(it=>it.id == context.groupId)
            ?.members
            ?.map(m=>[
                characters.find(it=>it.avatar == m)?.data?.character_book?.name,
                ...(world_info.charLore?.find(it=>it.name == m.split('.').slice(0,-1).join('.'))?.extraBooks ?? []),
            ])
                ?? []
        ),
    ].filter(it=>it);
    return names;
};
// GROUP: World Info
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'wi-list-books',
    callback: async (namedArgs) => {
        if (isTrueFlag(namedArgs.source)) {
            return JSON.stringify(getBookNamesWithSource());
        }
        return JSON.stringify(getBookNames());
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'source',
            description: 'whether to include the activation source for each book',
            typeList: [ARGUMENT_TYPE.BOOLEAN],
            defaultValue: 'false',
            enumList: ['true', 'false'],
        }),
    ],
    helpString: help(
        `
            Get a list of currently active World Info books. Use <code>source=</code> to get a dictionary of lists where the keys are the activation sources.
        `,
        [
            [
                `
                    /wi-list-books |
                `,
                'returns a list of active books',
            ],
            [
                `
                    /wi-list-books source= |
                    /json-pretty |
                    /comment Currently active WI books:{{newline}}\`\`\`json{{newline}}{{pipe}}{{newline}}\`\`\` |
                `,
                '',
            ],
        ],
    ),
    returns: 'a list of book names, or a dictionary of lists with activation sources as keys',
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'wi-list-entries',
    callback: async (args, value) => {
        const loadBook = async (name) => {
            const result = await fetch('/api/worldinfo/get', {
                method: 'POST',
                headers: getRequestHeaders(),
                body: JSON.stringify({ name }),
            });
            if (result.ok) {
                const data = await result.json();
                data.entries = Object.keys(data.entries).map(it => {
                    data.entries[it].book = name;
                    return data.entries[it];
                });
                data.book = name;
                return data;
            } else {
                toastr.warning(`Failed to load World Info book: ${name}`);
            }
        };
        let names;
        let isNameGiven = false;
        if (value?.length) {
            names = [value.trim()];
            isNameGiven = true;
        } else {
            names = getBookNames();
        }
        const books = {};
        for (const book of names) {
            books[book] = await loadBook(book);
        }
        if (isTrueFlag(args.flat) || isNameGiven) {
            return JSON.stringify(Object.keys(books).map(it => books[it].entries).flat());
        }
        return JSON.stringify(books);
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'flat',
            description: 'whether to list all entries in a flat list',
            typeList: [ARGUMENT_TYPE.BOOLEAN],
            defaultValue: 'false',
            enumList: ['true', 'false'],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the name of the book to list entries from',
            typeList: [ARGUMENT_TYPE.STRING],
        }),
    ],
    helpString: help(
        `
            Get a list of World Info entries from currently active books or from the book with the provided name. Use <code>flat=</code> to list all entries in a flat list instead of a dictionary with entries per book.
        `,
        [
            [
                `
                    /wi-list-entries |
                    /map {{pipe}} {:
                        /getat index=entries {{var::item}} |
                        /map {{pipe}} {:
                            /getat index=comment {{var::item}}
                        :}
                    :} |
                    /echo Overview of WI entries in currently active books: {{pipe}}
                `,
                '',
            ],
        ],
    ),
    returns: 'a dictionary of book entries, or a flat list of entries',
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'wi-activate',
    callback: (args, value)=>{
        getWorldInfoPrompt(chat.filter(it=>!it.is_system).map(it=>it.mes).toReversed(), Number.MAX_SAFE_INTEGER, false);
        return '';
    },
    helpString: help(
        `
            Activate World Info entries based on the current chat and trigger their Automation IDs.
        `,
        [
            [
                `
                    /wi-activate |
                `,
                '',
            ],
        ],
    ),
}));



// GROUP: Costumes / Sprites
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'costumes',
    callback: async (namedArgs, unnamedArgs) => {
        const response = await fetch('/api/plugins/costumes/', {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify({ folder: unnamedArgs, recurse: namedArgs.recurse ?? true }),
        });
        if (!response.ok) {
            toastr.error(`Failed to retrieve costumes: ${response.status} - ${response.statusText}`);
            return '[]';
        }
        return await response.text();
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'recurse',
            description: 'whether to recurse into subfolders (SillyTavern can only load expressions from the first subfolder level)',
            typeList: [ARGUMENT_TYPE.BOOLEAN],
            defaultValue: 'true',
            enumList: ['true', 'false'],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the folder to list costumes from',
            typeList: [ARGUMENT_TYPE.STRING],
        }),
    ],
    helpString: help(
        `
            Get a list of costume / sprite folders, recursive by default.
        `,
        [
            [
                `
                    /costumes Alice |
                    /echo Alice's costumes: {{pipe}} |
                `,
                '',
            ],
        ],
    ),
    returns: 'a list of costume/sprite folders',
}));



// GROUP: Quick Replies
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'qr-edit',
    callback: async (namedArgs, unnamedArgs) => {
        let set = namedArgs.set;
        let label = namedArgs.label ?? unnamedArgs.toString();
        if (set === undefined) {
            const sets = [...quickReplyApi.listGlobalSets(), ...quickReplyApi.listChatSets()];
            for (const setName of sets) {
                if (quickReplyApi.listQuickReplies(setName).includes(label)) {
                    set = setName;
                    break;
                }
            }
        }
        quickReplyApi.getQrByLabel(set, label)?.showEditor();
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'set',
            description: 'the name of the quick reply set',
            typeList: [ARGUMENT_TYPE.STRING],
            enumProvider: (executor) => QuickReplySet.list.
                filter(qrSet => qrSet.name != String(executor.namedArgumentList.find(x => x.name == 'set')?.value))
                .map(qrSet => new SlashCommandEnumValue(qrSet.name, null, enumTypes.enum, 'S'))
            ,
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'label',
            description: 'the label of the quick reply',
            typeList: [ARGUMENT_TYPE.STRING],
            enumProvider: (executor) => QuickReplySet.get(String(executor.namedArgumentList.find(x => x.name == 'set')?.value))?.qrList.map(qr => {
                const message = `${qr.automationId ? `[${qr.automationId}]` : ''} ${qr.title || qr.message}`.trim();
                return new SlashCommandEnumValue(qr.label, message, enumTypes.enum, enumIcons.qr);
            }) ?? [],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the label of the quick reply',
            typeList: [ARGUMENT_TYPE.STRING],
            enumProvider: (executor) => QuickReplySet.get(String(executor.namedArgumentList.find(x => x.name == 'set')?.value))?.qrList.map(qr => {
                const message = `${qr.automationId ? `[${qr.automationId}]` : ''} ${qr.title || qr.message}`.trim();
                return new SlashCommandEnumValue(qr.label, message, enumTypes.enum, enumIcons.qr);
            }) ?? [],
        }),
    ],
    helpString: help(
        `
            Show the Quick Reply editor. If no QR set is provided, tries to find a QR in one of the active sets.
        `,
        [
            [
                `
                    /qr-edit My QR From An Active Set |
                `,
                '',
            ],
            [
                `
                    /qr-edit set=MyQrSet label=MyQr |
                `,
                '',
            ],
        ],
    ),
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'qr-add',
    callback: async (namedArgs, unnamedArgs) => {
        let set = namedArgs.set ?? quickReplyApi.listGlobalSets()[0] ?? quickReplyApi.listChatSets()[0];
        if (set === undefined) {
            toastr.error('No Quick Reply Set given and no active Quick Reply Sets to add the new Quick Reply to.');
            return '';
        }
        let label = namedArgs.label ?? unnamedArgs.toString();
        quickReplyApi.createQuickReply(set, label)?.showEditor();
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'set',
            description: 'the name of the quick reply set',
            typeList: [ARGUMENT_TYPE.STRING],
            enumProvider: (executor) => QuickReplySet.list.
                filter(qrSet => qrSet.name != String(executor.namedArgumentList.find(x => x.name == 'set')?.value))
                .map(qrSet => new SlashCommandEnumValue(qrSet.name, null, enumTypes.enum, 'S'))
            ,
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'label',
            description: 'the label of the quick reply',
            typeList: [ARGUMENT_TYPE.STRING],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the label of the quick reply',
            typeList: [ARGUMENT_TYPE.STRING],
        }),
    ],
    helpString: help(
        `
            Create a new Quick Reply and open its editor. If no QR set is provided, tries to find a QR in one of the active sets.
        `,
        [
            [
                `
                    /qr-add New QR In Active Set |
                `,
                '',
            ],
            [
                `
                    /qr-add set=MyQrSet label=MyNewQr |
                `,
                '',
            ],
        ],
    ),
}));



// GROUP: Chat Messages
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'swipes-get',
    aliases: ['getswipe'],
    callback: (args, value) => {
        const idx = args.message && !isNaN(Number(args.message)) ? Number(args.message) : chat.length - 1;
        return chat[idx]?.swipes?.[Number(value)] ?? '';
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'message',
            description: 'the message ID to get swipes from',
            typeList: [ARGUMENT_TYPE.NUMBER],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the index of the swipe to get',
            typeList: [ARGUMENT_TYPE.NUMBER],
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            Get the n-th swipe (zero-based index) from the last message or the message with the given message ID.
        `,
        [
            [
                `
                    /swipes-get 5 |
                    /echo Swipe number five: {{pipe}} |
                `,
                '',
            ],
            [
                `
                    /sub {{lastMessageId}} 2 |
                    /swipes-get message={{pipe}} 5 |
                    /echo swipe number five: {{pipe}}
                `,
                '',
            ],
        ],
    ),
    returns: 'swipe text',
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'swipes-list',
    callback: (args, value) => {
        const idx = args.message && !isNaN(Number(args.message)) ? Number(args.message) : chat.length - 1;
        return JSON.stringify(chat[idx]?.swipes ?? []);
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'message',
            description: 'the message ID to get swipes from',
            typeList: [ARGUMENT_TYPE.NUMBER],
        }),
    ],
    helpString: help(
        `
            Get a list of all swipes from the last message or the message with the given message ID.
        `,
        [
            [
                `
                    /swipes-list |
                    /echo |
                `,
                '',
            ],
            [
                `
                    /sub {{lastMessageId}} 2 |
                    /swipes-list message={{pipe}} |
                    /echo |
                `,
                '',
            ],
        ],
    ),
    returns: 'a list of swipes',
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'swipes-count',
    callback: (args, value) => {
        const idx = args.message && !isNaN(Number(args.message)) ? Number(args.message) : chat.length - 1;
        return `${chat[idx]?.swipes?.length ?? 0}`;
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'message',
            description: 'the message ID to get swipes from',
            typeList: [ARGUMENT_TYPE.NUMBER],
        }),
    ],
    helpString: help(
        `
            Get the number of all swipes from the last message or the message with the given message ID.
        `,
        [
            [
                `
                    /swipes-count |
                    /echo |
                `,
                '',
            ],
            [
                `
                    /sub {{lastMessageId}} 2 |
                    /swipes-count message={{pipe}} |
                    /echo |
                `,
                '',
            ],
        ],
    ),
    returns: 'the number of swipes',
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'swipes-index',
    callback: (args, value) => {
        const idx = args.message && !isNaN(Number(args.message)) ? Number(args.message) : chat.length - 1;
        return `${chat[idx]?.swipe_id ?? 0}`;
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'message',
            description: 'the message ID to get the swipe index from',
            typeList: [ARGUMENT_TYPE.NUMBER],
        }),
    ],
    helpString: help(
        `
            Get the current swipe index from the last message or the message with the given message ID.
        `,
        [
            [
                `
                    /swipes-index |
                    /echo |
                `,
                '',
            ],
            [
                `
                    /sub {{lastMessageId}} 2 |
                    /swipes-index message={{pipe}} |
                    /echo |
                `,
                '',
            ],
        ],
    ),
    returns: 'the current swipe index',
}));


SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'swipes-add',
    callback: (namedArgs, unnamedArgs) => {
        const idx = namedArgs.message && !isNaN(Number(namedArgs.message)) ? Number(namedArgs.message) : chat.length - 1;
        const mes = chat[idx];
        const mesDom = document.querySelector(`#chat .mes[mesid="${idx}"]`);
        // close current message editor
        document.querySelector('#curEditTextarea')?.closest('.mes')?.querySelector('.mes_edit_cancel')?.click();
        if (mes.swipe_id === null || mes.swipe_id === undefined) {
            mes.swipe_id = 0;
        }
        if (!mes.swipes) {
            mes.swipes = [mes.mes];
        }
        if (!mes.swipe_info) {
            mes.swipe_info = [{
                send_date: mes.send_date,
                gen_started: mes.gen_started,
                gen_finished: mes.gen_finished,
                extra: structuredClone(mes.extra),
            }];
        }
        mes.swipes.push(unnamedArgs.toString());
        mes.swipe_info.push({
            send_date: getMessageTimeStamp(),
            gen_started: null,
            gen_finished: null,
            extra: {
                bias: extractMessageBias(unnamedArgs.toString()),
                gen_id: Date.now(),
                api: 'manual',
                model: 'slash command',
            },
        });
        mes.swipe_id = mes.swipes.length - 1;
        mes.mes = unnamedArgs.toString();
        mesDom.querySelector('.mes_text').innerHTML = messageFormatting(
            mes.mes,
            mes.name,
            mes.is_system,
            mes.is_user,
            Number(mesDom.getAttribute('mesid')),
        );
        [...mesDom.querySelectorAll('.swipes-counter')].forEach(it=>it.textContent = `${mes.swipe_id + 1}/${mes.swipes.length}`);
        saveChatConditional();
        eventSource.emit(event_types.MESSAGE_SWIPED, idx);
        showSwipeButtons();
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'message',
            description: 'the ID of the message to add the swipe to',
            typeList: [ARGUMENT_TYPE.NUMBER],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the text to add as a new swipe',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            Add a new swipe to the last message or the message with the provided messageId.
        `,
        [
            [
                `
                    /sendas name=Alice foo |
                    /delay 1000 |
                    /swipes-add bar |
                `,
                'creates a new message "foo", then addes a swipe "bar"',
            ],
        ],
    ),
}));


SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'swipes-del',
    /**
     *
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  message:string,
     *  filter:SlashCommandClosure,
     * }} args
     * @param {*} value
     * @returns
     */
    callback: async (args, value) => {
        const idx = args.message && !isNaN(Number(args.message)) ? Number(args.message) : chat.length - 1;
        const mes = chat[idx];
        const mesDom = document.querySelector(`#chat .mes[mesid="${idx}"]`);
        // close current message editor
        document.querySelector('#curEditTextarea')?.closest('.mes')?.querySelector('.mes_edit_cancel')?.click();
        if (mes.swipe_id === undefined || (mes.swipes?.length ?? 0) < 2) {
            return '';
        }
        const swipeList = [];
        if (args.filter) {
            if (args.filter instanceof SlashCommandClosure) {
                if (args.filter.argumentList.length < 1) throw new Error('/swipes-del filter= closure requires at least one argument');
                for (let i = 0; i < mes.swipes.length; i++) {
                    const swipeObject = Object.assign(
                        { index:i, mes:mes.swipes[i] },
                        mes.swipe_info[i],
                    );
                    args.filter.providedArgumentList.push(Object.assign(new SlashCommandNamedArgumentAssignment(), {
                        start: 0,
                        end: 0,
                        name: args.filter.argumentList[0].name,
                        value: JSON.stringify(swipeObject),
                    }));
                    if (isTrueBoolean((await args.filter.execute()).pipe)) {
                        swipeList.push(i);
                    }
                }
            } else if (typeof args.filter == 'string') {
                const parser = new BoolParser(args._scope, args);
                parser.scope.letVariable('swipe');
                const exp = parser.parse(args.filter);
                for (let i = 0; i < mes.swipes?.length ?? 0; i++) {
                    const swipeObject = Object.assign(
                        { index:i, mes:mes.swipes[i] },
                        mes.swipe_info[i],
                    );
                    parser.scope.setVariable('swipe', JSON.stringify(swipeObject));
                    if (exp()) {
                        swipeList.push(i);
                    }
                }
            }
        } else {
            swipeList.push(Number(value == '' ? mes.swipe_id : value));
        }
        if (swipeList.length == mes.swipes.length) throw new Error('/swipes-del cannot delete all swipes');
        swipeList.reverse();
        const originalSwipe = mes.swipe_id ?? 0;
        for (const swipeId of swipeList) {
            const currentSwipe = mes.swipe_id ?? 0;
            if (currentSwipe == swipeId) {
                if (swipeId + 1 < mes.swipes.length) {
                    mes.swipe_id = swipeId;
                } else {
                    mes.swipe_id = swipeId - 1;
                }
            } else if (currentSwipe > swipeId) {
                mes.swipe_id = currentSwipe - 1;
            }
            mes.swipes.splice(swipeId, 1);
            mes.swipe_info.splice(swipeId, 1);
        }
        mes.mes = mes.swipes[mes.swipe_id];
        mes.extra = structuredClone(mes.swipe_info?.[mes.swipe_id]?.extra);
        mes.send_date = mes.swipe_info?.[mes.swipe_id]?.send_date;
        mes.gen_started = mes.swipe_info?.[mes.swipe_id]?.gen_started;
        mes.gen_finished = mes.swipe_info?.[mes.swipe_id]?.gen_finished;
        mesDom.querySelector('.mes_text').innerHTML = messageFormatting(
            mes.mes,
            mes.name,
            mes.is_system,
            mes.is_user,
            Number(mesDom.getAttribute('mesid')),
        );
        eventSource.emit(event_types.MESSAGE_SWIPED, idx);
        [...mesDom.querySelectorAll('.swipes-counter')].forEach(it=>it.textContent = `${mes.swipe_id + 1}/${mes.swipes.length}`);
        saveChatConditional();
        showSwipeButtons();
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'message',
            description: 'the id of the message to delete the swipe from',
            typeList: [ARGUMENT_TYPE.NUMBER],
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'filter',
            description: 'expression or closure accepting a swipe dictionary as argument returning true or false',
            typeList: [ARGUMENT_TYPE.STRING, ARGUMENT_TYPE.CLOSURE],
            enumProvider: makeBoolEnumProvider(),
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the index of the swipe to delete (0-based)',
            typeList: [ARGUMENT_TYPE.NUMBER],
        }),
    ],
    helpString: help(
        `
            Delete the current swipe or the swipe at the specified index (0-based).

            Use <code>filter={: swipe= /return true :}</code> to remove multiple swipes.

            See <a data-lalib-exec="/lalib? expressions"><code>/lalib? expressions</code></a> for more details on expressions.
        `,
        [
            [
                `
                    /swipes-del |
                `,
                'delete current swipe of last message',
            ],
            [
                `
                    /swipes-del 5 |
                `,
                'delete swipe number 5 (0-based index) of last message',
            ],
            [
                `
                    /swipes-del message=20 |
                `,
                'delete current swipe of message #20',
            ],
            [
                `
                    /swipes-del filter="swipe.index % 2" |
                `,
                'delete all odd swipes (0-based index) of last message',
            ],
            [
                `
                    /swipes-del filter="swipe.index != 5" |
                `,
                'delete all but swipe at idnex 5 (0-based index) of last message',
            ],
            [
                `
                    /swipes-del filter="\'bad word\' in swipe.mes" |
                `,
                'delete all swipes with "bad word" in their message text of last message',
            ],
            [
                `
                    /swipes-del filter={: swipe=
                        /var key=swipe index=mes |
                        /test left={{pipe}} rule=in right="bad word" |
                    :} |
                `,
                'delete all swipes with "bad word" in their message text of last message',
            ],
        ],
    ),
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'swipes-go',
    callback: (args, value) => {
        const idx = args.message && !isNaN(Number(args.message)) ? Number(args.message) : chat.length - 1;
        const mes = chat[idx];
        const mesDom = document.querySelector(`#chat .mes[mesid="${idx}"]`);
        // close current message editor
        document.querySelector('#curEditTextarea')?.closest('.mes')?.querySelector('.mes_edit_cancel')?.click();
        if (mes.swipe_id === undefined || (mes.swipes?.length ?? 0) < 2) {
            return '';
        }
        const swipeId = Number(value);
        mes.swipe_id = swipeId;
        mes.mes = mes.swipes[mes.swipe_id];
        mes.extra = structuredClone(mes.swipe_info?.[mes.swipe_id]?.extra);
        mes.send_date = mes.swipe_info?.[mes.swipe_id]?.send_date;
        mes.gen_started = mes.swipe_info?.[mes.swipe_id]?.gen_started;
        mes.gen_finished = mes.swipe_info?.[mes.swipe_id]?.gen_finished;
        mesDom.querySelector('.mes_text').innerHTML = messageFormatting(
            mes.mes,
            mes.name,
            mes.is_system,
            mes.is_user,
            Number(mesDom.getAttribute('mesid')),
        );
        [...mesDom.querySelectorAll('.swipes-counter')].forEach(it=>it.textContent = `${mes.swipe_id + 1}/${mes.swipes.length}`);
        saveChatConditional();
        eventSource.emit(event_types.MESSAGE_SWIPED, idx);
        showSwipeButtons();
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'message',
            description: 'the message ID to go to the swipe for',
            typeList: [ARGUMENT_TYPE.NUMBER],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the index of the swipe to go to',
            typeList: [ARGUMENT_TYPE.NUMBER],
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            Go to the swipe. 0-based index.
        `,
        [
            [
                `
                    /sendas name=Alice foo |
                    /delay 1000 |
                    /swipes-add bar |
                    /delay 1000 |
                    /swipes-add foobar |
                    /delay 1000 |
                    /swipes-go 0 |
                `,
                '',
            ],
        ],
    ),
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'swipes-swipe',
    callback: async (args, value) => {
        const id = chat.length - 1;
        const currentMessage = document.querySelector(`#chat [mesid="${id}"]`);
        await executeSlashCommands('/swipes-count | /sub {{pipe}} 1 | /swipes-go');
        currentMessage.querySelector('.swipe_right:not(.stus--btn)').click();
        let ended = false;
        const listener = ()=>{ ended = true; };
        eventSource.once(event_types.GENERATION_ENDED, listener);
        while (!ended) {
            if (/**@type {SlashCommandAbortController}*/(args._abortController)?.signal?.aborted) {
                eventSource.removeListener(event_types.GENERATION_ENDED, listener);
                return '';
            }
            await delay(200);
        }
        await delay(200);
        return chat[id].mes;
    },
    helpString: help(
        `
            Trigger a new swipe on the last message.
        `,
        [
            [
                `
                    /swipes-swipe |
                    /echo swiping has finished
                `,
                '',
            ],
        ],
    ),
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'message-edit',
    /**
     *
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments&{
     *  message:string,
     *  append:string
     * }} args
     * @param {string} value
     */
    callback: async(args, value) => {
        value = value.replace(/{{space}}/g, ' ');
        let mesId = parseInt(args.message ?? '-1');
        if (mesId < 0) mesId += chat.length;
        const mes = chat.at(mesId);
        if (isTrueBoolean(args.append)) {
            value = `${mes.mes}${value}`;
        }
        mes.mes = value;
        if (mes.swipes) {
            mes.swipes[mes.swipe_id ?? 0] = value;
        }
        document.querySelector(`#chat [mesid="${mesId}"] .mes_text`).innerHTML = messageFormatting(
            value,
            mes.name,
            mes.is_system,
            mes.is_user,
            mesId,
        );
        await eventSource.emit(event_types.MESSAGE_EDITED, mesId);
        await eventSource.emit(event_types.MESSAGE_UPDATED, mesId);
        return '';
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'message',
            description: 'the message ID to edit',
            typeList: [ARGUMENT_TYPE.NUMBER],
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'append',
            description: 'whether to append the new text to the end of the message',
            typeList: [ARGUMENT_TYPE.BOOLEAN],
            defaultValue: 'false',
            enumList: ['true', 'false'],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the new text for the message',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            Edit the current message or the message at the provided message ID. Use <code>append=</code> to add the provided text at the end of the message. Use <code>{{space}}</code> to add space at the beginning of the text.
        `,
        [
            [
                `
                    /sendas name=Alice foo |
                    /delay 1000 |
                    /message-edit bar |
                `,
                'adds a new message "foo" then changes it to "bar"',
            ],
            [
                `
                    /sendas name=Alice foo |
                    /delay 1000 |
                    /message-edit append= bar |
                `,
                'adds a new message "foo" then changes it to "foobar"',
            ],
        ],
    ),
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'message-move',
    /**
     * @param {{from:string, to:string, up:string, down:string}} args
     */
    callback: async(args)=>{
        let idx = parseInt(args.from);
        let dest = parseInt(args.to);
        if (args.up !== undefined) {
            dest = idx - parseInt(args.up);
        } else if (args.down !== undefined) {
            dest = idx + parseInt(args.down);
        }
        /**@type {HTMLTextAreaElement}*/
        const input = document.querySelector('#send_textarea');
        const restoreFocus = document.activeElement == input;
        const edit = /**@type {HTMLElement}*/(document.querySelector(`#chat [mesid="${args.from}"] .mes_edit`));
        const done = /**@type {HTMLElement}*/(document.querySelector(`#chat [mesid="${args.from}"] .mes_edit_done`));
        edit.click();
        if (idx < dest) {
            const btn = /**@type {HTMLElement}*/(document.querySelector(`#chat [mesid="${args.from}"] .mes_edit_down`));
            while (idx < dest && idx + 1 < chat.length) {
                btn.click();
                idx++;
            }
        } else if (idx > dest) {
            const btn = /**@type {HTMLElement}*/(document.querySelector(`#chat [mesid="${args.from}"] .mes_edit_up`));
            while (idx > dest && idx > 0) {
                btn.click();
                idx--;
            }
        }
        done.click();
        if (restoreFocus) input.focus();
        await delay(500);
        return '';
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'from',
            description: 'the message ID to move',
            typeList: [ARGUMENT_TYPE.NUMBER],
            isRequired: true,
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'to',
            description: 'where to move the message',
            typeList: [ARGUMENT_TYPE.NUMBER],
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'up',
            description: 'number of slots to move the message up (decrease message ID)',
            typeList: [ARGUMENT_TYPE.NUMBER],
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'down',
            description: 'number of slots to move the message down (increase message ID)',
            typeList: [ARGUMENT_TYPE.NUMBER],
        }),
    ],
    helpString: help(
        `
            Move a message up or down in the chat.
        `,
        [
            [
                `
                    /message-move from={{lastMessageId}} to=10 |/message-move from={{lastMessageId}} up=2 |/message-move from=3 down=10 |
                `,
                '',
            ],
        ],
    ),
}));



// GROUP: Chat Management
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'chat-list',
    /**
     *
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments&{
     *  char:string,
     * }} args
     * @param {*} value
     */
    callback: async(args, value)=>{
        if (args.char === undefined && selected_group) {
            return JSON.stringify((await getGroupPastChats(selected_group)).map(it=>it.file_name));
        }
        const result = await fetch('/api/characters/chats', {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify({ avatar_url: args.char ?? characters[this_chid]?.avatar, simple: true }),
        });
        if (!result.ok) {
            return '[]';
        }
        const data = await result.json();
        return JSON.stringify(data.map(x => String(x.file_name).replace('.jsonl', '')));
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'char',
            description: 'avatar name of the char',
            defaultValue: 'current char',
        }),
    ],
    returns: 'list of all chats of current or selected character',
    helpString: help(
        `
            Get a list of all chats of the current or provided character.
        `,
        [
            [
                `
                    /chat-list |/chat-list char=default_Seraphina.png |
                `,
                '',
            ],
        ],
    ),
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'chat-parent',
    callback: (args, value)=>{
        return chat_metadata['main_chat'] ?? '';
    },
    returns: 'name of parent chat',
    helpString: help(
        `
            returns the name of the parent chat
        `,
        [
            [
                `
                    /chat-parent |
                `,
                'returns name of the parent chat (if this is a branch)',
            ],
        ],
    ),
}));

/** @type {{listen:()=>void, unlisten:()=>void, event:string, query:string, id:string}[]} */
const messageOnListeners = [];
const messageOnUnlistenListen = ()=>messageOnListeners.forEach(it=>{
    it.unlisten();
    it.listen();
});
eventSource.on(event_types.CHAT_CHANGED, ()=>{
    messageOnListeners.forEach(it=>it.unlisten());
    while (messageOnListeners.pop());
});
eventSource.on(event_types.USER_MESSAGE_RENDERED, ()=>messageOnUnlistenListen());
eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, ()=>messageOnUnlistenListen());
eventSource.on(event_types.MESSAGE_SWIPED, ()=>messageOnUnlistenListen());
eventSource.on(event_types.MESSAGE_UPDATED, ()=>messageOnUnlistenListen());
eventSource.on(event_types.MESSAGE_DELETED, ()=>messageOnUnlistenListen());
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'message-on',
    /**
     * @param {{event:string, callback:SlashCommandClosure, quiet:string}} args
     * @param {string} value
     */
    callback: (args, value)=>{
        if (!args.event) throw new Error('/message-on requires event= to be set');
        if (!args.callback) throw new Error('/message-on requires callback= to be set');
        if (!value) throw new Error('/message-on requires a CSS query to select targeted elements');
        const listen = ()=>{
            const els = [...document.querySelector('#chat .last_mes').querySelectorAll(value)];
            for (const el of els) {
                el.addEventListener(args.event, listener, { once:true });
            }
            if (isFalseBoolean(args.quiet)) {
                toastr.info(`Event listener attached to ${els.length} elements.`, '/message-on');
            }
        };
        const els = [...document.querySelector('#chat .last_mes').querySelectorAll(value)];
        const unlisten = ()=>{
            for (const el of els) {
                el?.removeEventListener(args.event, listener);
            }
        };
        const listener = async(evt)=>{
            args.callback.scope.setMacro('target', evt.currentTarget.outerHTML);
            await args.callback.execute();
        };
        listen();
        const id = uuidv4();
        messageOnListeners.push({ listen, unlisten, event:args.event, query:value, id });
        return id;
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'event',
            description: 'event type to listen for',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
        SlashCommandNamedArgument.fromProps({ name: 'callback',
            description: 'closure to run when triggered',
            typeList: [ARGUMENT_TYPE.CLOSURE],
            isRequired: true,
        }),
        SlashCommandNamedArgument.fromProps({ name: 'quiet',
            description: 'whether to show toast messages when event listeners are attached',
            typeList: [ARGUMENT_TYPE.BOOLEAN],
            isRequired: false,
            defaultValue: 'true',
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'CSS selector to target an element in the last message',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    returns: 'listener ID',
    helpString: help(
        `
            Add event listeners to the last chat message.

            Stops listening when changing to another chat.
        `,
        [
            [
                `
                    /message-on event=click quiet=false callback={:
                        /$ take=textContent {{target}} |
                        /let prompt Continue by weaving the following suggestion into your next response: {{pipe}} |
                        /inputhistory-add {{var::prompt}} |
                        /send {{var::prompt}} |
                        /trigger
                    :} .custom-suggestion |
                    /setvar key=listenerId |
                `,
                '',
            ],
        ],
    ),
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'message-off',
    /**
     *
     * @param {{event:string, query:string, id:string, quiet:string}} args
     */
    callback: (args, value)=>{
        const event = args.event ?? '';
        const query = args.query ?? '';
        const id = args.id ?? '';
        if (event == '' && query == '' && id == '') throw new Error('/message-off requires event= or query= or id= to be set');
        const check = it=>{
            return (event == '' || it.event == event) && (query == '' || it.query == query) && (id == '' || it.id == id);
        };
        const listeners = messageOnListeners.filter(check);
        let count = 0;
        for (const listener of listeners) {
            count++;
            listener.unlisten();
            messageOnListeners.splice(messageOnListeners.indexOf(listener), 1);
        }
        if (isFalseBoolean(args.quiet)) {
            toastr.info(`${count} listeners removed.`, '/message-off');
        }
        return '';
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'id',
            description: 'listener ID',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: false,
        }),
        SlashCommandNamedArgument.fromProps({ name: 'event',
            description: 'event type to listen for',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: false,
        }),
        SlashCommandNamedArgument.fromProps({ name: 'query',
            description: 'CSS selector to target an element in the last message',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: false,
        }),
        SlashCommandNamedArgument.fromProps({ name: 'quiet',
            description: 'whether to show toast messages when event listeners are attached',
            typeList: [ARGUMENT_TYPE.BOOLEAN],
            isRequired: false,
            defaultValue: 'true',
        }),
    ],
    helpString: help(
        `
            Remove an event listener added with /message-on.
        `,
        [
            [
                `
                    /message-off id={{getvar::listenerId}}
                `,
                'All messages:',
            ],
        ],
    ),
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'message-listeners',
    callback: (args, value)=>{
        return JSON.stringify(messageOnListeners.map(it=>({ id:it.id, query:it.query, event:it.event })));
    },
    helpString: help(
        `
            Lists all currently active listeners.
        `,
        [
            [
                `
                    /message-listeners |
                `,
                '',
            ],
        ],
    ),
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'role-swap',
    callback: (args, value)=>{
        const chatRange = value.length == 0 ? chat : getRange(value, chat);
        for (const mes of chatRange) {
            mes.is_user = !mes.is_user;
            document.querySelector(`#chat .mes[mesid="${chat.indexOf(mes)}"]`)?.setAttribute('is_user', mes.is_user);
        }
        saveChatDebounced();
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'message id or range to swap',
            typeList: [ARGUMENT_TYPE.NUMBER, ARGUMENT_TYPE.RANGE],
        }),
    ],
    helpString: help(
        `
            Swap roles (user/AI) for all messages in the chat, or for a selected message or range of messages.
        `,
        [
            [
                `
                    /role-swap
                `,
                'All messages:',
            ],
            [
                `
                    /role-swap {{lastMessageId}}
                `,
                'Last message:',
            ],
            [
                `
                    /role-swap -1
                `,
                'Last message:',
            ],
            [
                `
                    /role-swap -2
                `,
                'Second to last message:',
            ],
            [
                `
                    /role-swap 0-10
                `,
                'First 10 messages:',
            ],
            [
                `
                    /role-swap -10-
                `,
                'Last 10 messages:',
            ],
            [
                `
                    /role-swap 0--10
                `,
                'All messages except last 10:',
            ],
        ],
    ),
}));



// GROUP: Time & Date
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'timestamp',
    callback: (args, value) => {
        return JSON.stringify(new Date().getTime());
    },
    helpString: help(
        `
            Returns the number of milliseconds midnight at the beginning of January 1, 1970, UTC.
        `,
        [
            [
                `
                    /timestamp |
                `,
                '',
            ],
        ],
    ),
    returns: 'timestamp',
}));



// GROUP: Async
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'fireandforget',
    /**
     *
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments} args
     * @param {(string|SlashCommandClosure)[]} value
     */
    callback: (args, value) => {
        /**@type {string|SlashCommandClosure} */
        let command;
        if (value) {
            if (value[0] instanceof SlashCommandClosure) {
                command = value[0];
            } else {
                command = value.join(' ');
            }
        }
        if (command instanceof SlashCommandClosure) {
            /**@type {SlashCommandClosure} */
            const closure = command;
            closure.scope.parent = args._scope;
            closure.execute();
        } else {
            executeSlashCommandsWithOptions(
                command,
                {
                    handleExecutionErrors: true,
                    handleParserErrors: false,
                    parserFlags: args._parserFlags,
                    scope: args._scope,
                },
            );
        }
        return '';
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the closure or command to execute',
            typeList: [ARGUMENT_TYPE.CLOSURE, ARGUMENT_TYPE.SUBCOMMAND],
            isRequired: true,
        }),
    ],
    splitUnnamedArgument: true,
    helpString: help(
        `
            Execute a closure or command without waiting for it to finish.
        `,
        [
            [
                `
                    /fireandforget {:
                        /delay 1000 |
                        /echo firing |
                        /delay 1000 |
                        /echo fired script is done
                    :} |
                    /echo main script is done |
                `,
                'will show "main script is done", then "firing", then "fired script is done"',
            ],
        ],
    ),
}));



// GROUP: Logging
const toConsole = (level, value)=>{
    try {
        const data = JSON.parse(value.toString());
        console[level](`[/console-${level}]`, data);
    } catch {
        console[level](`[/console-${level}]`, value);
    }
    return '';
};
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'console-log',
    callback: (args, value)=>toConsole('log', value),
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'the value to log',
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            logs a value to the browser console
        `,
        [
            [
                `
                    /console-log Hello, World! |
                `,
                '',
            ],
        ],
    ),
}));
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'console-warn',
    callback: (args, value)=>toConsole('warn', value),
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'the value to log',
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            logs a value to the browser console as a warning
        `,
        [
            [
                `
                    /console-warn This is a warning! |
                `,
                '',
            ],
        ],
    ),
}));
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'console-error',
    callback: (args, value)=>toConsole('error', value),
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'the value to log',
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            logs a value to the browser console as an error
        `,
        [
            [
                `
                    /console-error OOPS! |
                `,
                '',
            ],
        ],
    ),
}));



// GROUP: Audio
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'sfx',
    /**
     *
     * @param {{volume:string, await:string}} args
     * @param {string} value
     * @returns
     */
    callback: async(args, value)=>{
        const response = await fetch(value, { headers: { responseType: 'arraybuffer' } });
        if (!response.ok) {
            throw new Error(`${response.status} - ${response.statusText}: /sfx ${value}`);
        }
        const con = new AudioContext();
        const src = con.createBufferSource();
        src.buffer = await con.decodeAudioData(await response.arrayBuffer());
        const volume = con.createGain();
        volume.gain.value = Number(args.volume ?? '1');
        volume.connect(con.destination);
        src.connect(volume);
        src.start();
        if (isTrueBoolean(args.await)) {
            await new Promise(resolve=>src.addEventListener('ended', resolve));
        }
        return '';
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'volume',
            description: 'playback volume',
            typeList: [ARGUMENT_TYPE.NUMBER],
            defaultValue: '1.0',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'await',
            description: 'whether to wait for the sound to finish playing before continuing',
            typeList: [ARGUMENT_TYPE.BOOLEAN],
            defaultValue: 'false',
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'url to audio file',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            Plays an audio file.
        `,
        [
            [
                `
                    /sfx volume=1.5 await=true /user/files/mySound.wav | /echo finished playing sound
                `,
                '',
            ],
        ],
    ),
}));



// GROUP: Miscellaneous
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'fonts',
    callback: async(args, value)=>{
        if (!window.queryLocalFonts) {
            toastr.warning('Your browser cannot do that.', '/fonts (LALib)');
            return '[]';
        }
        const fonts = await window.queryLocalFonts();
        return JSON.stringify(
            fonts
                .map(it=>it.family)
                .filter((it,idx,list)=>idx == list.indexOf(it))
            ,
        );
    },
    returns: 'list of available fonts',
    helpString: help(
        `
            returns a list of all system fonts available to you
        `,
        [
            [
                `
                    /fonts |
                    /comment |
                `,
                '',
            ],
        ],
    ),
}));



// GROUP: Web Requests
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'fetch',
    callback: async (args, value) => {
        try {
            const whitelist = JSON.parse(localStorage.getItem('lalib-fetch') ?? '[]');
            const url = new URL(value.toString());
            let connect = whitelist.includes(url.hostname) || whitelist.includes(`${url.hostname}${url.pathname}`);
            if (!connect) {
                const dom = document.createElement('div'); {
                    const h = document.createElement('h3'); {
                        h.textContent = '/fetch';
                        dom.append(h);
                    }
                    const q = document.createElement('h4'); {
                        q.textContent = 'Do you want to connect to the following URL?';
                        dom.append(q);
                    }
                    const v = document.createElement('var'); {
                        v.textContent = value.toString();
                        v.style.margin = '2em 0';
                        v.style.display = 'block';
                        dom.append(v);
                    }
                    const btns = document.createElement('div'); {
                        btns.style.display = 'flex';
                        btns.style.flexDirection = 'column';
                        btns.style.alignItems = 'center';
                        btns.style.gap = '0.5em';
                        btns.style.marginTop = '1em';
                        const list = [
                            { text: 'Connect once', action:()=>{
                                connect = true;
                                dlg.completeAffirmative();
                            } },
                            { text: 'Allow connections to', url: `${url.hostname}${url.pathname}`, action:()=>{
                                whitelist.push(`${url.hostname}${url.pathname}`);
                                connect = true;
                                dlg.completeAffirmative();
                            } },
                            { text: 'Allow connections to', url: url.hostname, action:()=>{
                                whitelist.push(url.hostname);
                                connect = true;
                                dlg.completeAffirmative();
                            } },
                        ];
                        for (const item of list) {
                            const btn = document.createElement('div'); {
                                btn.classList.add('menu_button');
                                btn.style.width = '90%';
                                btn.style.display = 'flex';
                                btn.style.flexDirection = 'column';
                                btn.style.height = 'auto';
                                btn.style.padding = '0.75em';
                                btn.addEventListener('click', ()=>item.action());
                                const txt = document.createElement('div'); {
                                    txt.textContent = item.text;
                                    btn.append(txt);
                                }
                                if (item.url) {
                                    const url = document.createElement('div'); {
                                        url.style.fontSize = '0.7em';
                                        url.style.fontFamily = 'var(--monoFontFamily)';
                                        url.style.opacity = '0.6';
                                        url.textContent = item.url;
                                        btn.append(url);
                                    }
                                }
                                btns.append(btn);
                            }
                        }
                        dom.append(btns);
                    }
                }
                const dlg = new Popup(dom, POPUP_TYPE.TEXT, null, {
                    okButton: 'Block Connection',
                });
                await dlg.show();
                localStorage.setItem('lalib-fetch', JSON.stringify(whitelist));
            }
            if (!connect) {
                toastr.error(value.toString(), '/fetch - Connection blocked');
                return '';
            }
            const fn = uuidv4();
            const dlResponse = await fetch('/api/assets/download', {
                method: 'POST',
                headers: getRequestHeaders(),
                body: JSON.stringify({
                    url: value,
                    filename: fn,
                    category: 'ambient',
                }),
            });
            if (!dlResponse.ok) throw new Error(`/fetch - failed to fetch URL: ${value}`);
            const contentResponse = await fetch(`/assets/ambient/${fn}`);
            if (!contentResponse.ok) throw new Error(`/fetch - failed to fetch URL: ${value}`);
            const text = await contentResponse.text();
            fetch('/api/assets/delete', {
                method: 'POST',
                headers: getRequestHeaders(),
                body: JSON.stringify({
                    filename: fn,
                    category: 'ambient',
                }),
            });
            return text;
        }
        catch (ex) {
            console.error('[LALIB]', '[FETCH]', ex);
            const dom = document.createElement('div'); {
                const msg = document.createElement('div'); {
                    msg.textContent = ex.message;
                    dom.append(msg);
                }
                const url = document.createElement('code'); {
                    url.textContent = value.toString();
                    dom.append(url);
                }
            }
            toastr.error(dom.outerHTML, '/fetch', { escapeHtml:false });
            throw ex;
        }
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the url to fetch',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            Fetch the contents of the provided URL.
        `,
        [
            [
                `
                    /fetch http://example.com |
                    /echo
                `,
                '',
            ],
        ],
    ),
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: '$',
    callback: (args, value) => {
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
            return [...dom.children].map(it => it.outerHTML).join('\n');
        } else {
            const result = el?.[args.take ?? 'outerHTML'];
            if (typeof result != 'string') {
                return JSON.stringify(result);
            }
            return result;
        }
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'query',
            description: 'css selector to query the provided html',
            typeList: [ARGUMENT_TYPE.STRING],
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'take',
            description: 'property to take from the resulting element',
            typeList: [ARGUMENT_TYPE.STRING],
            defaultValue: 'outerHTML',
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'call',
            description: 'method to call on the resulting element',
            typeList: [ARGUMENT_TYPE.STRING],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the html to operate on',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            Retrieve the first matching element from the provided HTML or call a method on the first
            matching element and return the resulting HTML.
        `,
        [
            [
                `
                    /fetch http://example.com |
                    /$ query=h1 take=textContent |
                    /echo
                `,
                '',
            ],
        ],
    ),
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: '$$',
    callback: (args, value) => {
        const dom = document.createRange().createContextualFragment(value);
        let els;
        if (args.query) {
            els = Array.from(dom.querySelectorAll(args.query));
        } else {
            els = Array.from(dom.children);
        }
        if (args.call) {
            els.forEach(el => el[args.call]());
            return [...dom.children].map(it => it.outerHTML).join('\n');
        } else {
            const result = els.map(el => el?.[args.take ?? 'outerHTML']);
            if (typeof result != 'string') {
                return JSON.stringify(result);
            }
            return result;
        }
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'query',
            description: 'css selector to query the provided html',
            typeList: [ARGUMENT_TYPE.STRING],
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'take',
            description: 'property to take from the resulting elements',
            typeList: [ARGUMENT_TYPE.STRING],
            defaultValue: 'outerHTML',
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'call',
            description: 'method to call on the resulting elements',
            typeList: [ARGUMENT_TYPE.STRING],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'the html to operate on',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    helpString: help(
        `
            Retrieve all matching elements from the provided HTML or call a method on all
            matching elements and return the resulting HTML.
        `,
        [
            [
                `
                    /fetch http://example.com |
                    /$$ query=h1 take=textContent |
                    /echo
                `,
                '',
            ],
        ],
    ),
}));
