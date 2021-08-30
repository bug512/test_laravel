"use strict";
/*
 * SonarQube JavaScript Plugin
 * Copyright (C) 2011-2021 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
// https://sonarsource.github.io/rspec/#/rspec/S5860
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
const regexpp = __importStar(require("regexpp"));
const utils_1 = require("../utils");
const utils_string_replace_1 = require("../utils/utils-string-replace");
exports.rule = {
    meta: {
        schema: [
            {
                // internal parameter for rules having secondary locations
                enum: ['sonar-runtime'],
            },
        ],
    },
    create(context) {
        const services = context.parserServices;
        if (!utils_1.isRequiredParserServices(services)) {
            return {};
        }
        const intellisense = new RegexIntelliSense(services, context);
        return {
            'Literal[regex]:exit': (literal) => {
                /* /regex/ */
                intellisense.collectKnowledge(literal);
            },
            'NewExpression:exit': (newExpr) => {
                /* new RegExp(regex) */
                intellisense.collectKnowledge(newExpr);
            },
            'CallExpression:exit': (callExpr) => {
                /* RegExp(regex), implicit regex e.g. str.match('regex') */
                intellisense.collectKnowledge(callExpr);
                /* str.match(pattern) / pattern.exec(str) */
                intellisense.collectPatternMatcher(callExpr);
                /* str.replace(pattern, substr) */
                checkStringReplaceGroupReferences(callExpr, intellisense);
            },
            'MemberExpression:exit': (memberExpr) => {
                if (memberExpr.computed) {
                    /* matcher[index] */
                    checkIndexBasedGroupReference(memberExpr, intellisense);
                }
                else {
                    /* matcher.groups.<name> / matcher.indices.groups.<name> */
                    checkNonExistingGroupReference(memberExpr, intellisense);
                }
            },
            'Program:exit': () => {
                checkUnusedGroups(intellisense);
                checkIndexedGroups(intellisense);
            },
        };
    },
};
function checkStringReplaceGroupReferences(callExpr, intellisense) {
    if (utils_string_replace_1.isStringReplaceCall(callExpr, intellisense.services)) {
        const [pattern, substr] = callExpr.arguments;
        const regex = intellisense.findRegex(pattern);
        if (regex) {
            const references = utils_string_replace_1.extractReferences(substr);
            const indexes = new Set();
            const names = new Set();
            references.forEach(ref => isNaN(Number(ref.value)) ? names.add(ref.value) : indexes.add(Number(ref.value)));
            regex.groups.forEach(group => {
                group.used || (group.used = names.has(group.name));
                group.used || (group.used = indexes.has(group.index));
            });
            const indexedGroups = regex.groups.filter(group => indexes.has(group.index));
            if (indexedGroups.length > 0) {
                intellisense.context.report({
                    message: utils_1.toEncodedMessage(`Directly use the group names instead of their numbers.`, indexedGroups.map(group => ({
                        loc: utils_1.getRegexpLocation(regex.node, group.node, intellisense.context),
                    })), indexedGroups.map(group => `Group '${group.name}'`)),
                    node: substr,
                });
            }
        }
    }
}
function checkIndexBasedGroupReference(memberExpr, intellisense) {
    const { object: matcher, property } = memberExpr;
    const regex = intellisense.resolve(matcher);
    if (regex) {
        const maybeIndex = utils_1.getValueOfExpression(intellisense.context, property, 'Literal');
        if (maybeIndex && typeof maybeIndex.value === 'number') {
            const index = maybeIndex.value;
            const group = regex.groups.find(grp => grp.index === index);
            if (group) {
                group.used = true;
                intellisense.context.report({
                    message: utils_1.toEncodedMessage(`Directly use '${group.name}' instead of its group number.`, [{ loc: utils_1.getRegexpLocation(regex.node, group.node, intellisense.context) }], [`Group '${group.name}'`]),
                    node: property,
                });
            }
        }
    }
}
function checkNonExistingGroupReference(memberExpr, intellisense) {
    const { object: matcher } = memberExpr;
    const regex = intellisense.resolve(matcher);
    if (regex) {
        /* matcher.groups.<name> / matcher.indices.groups.<name>  */
        const groupNode = extractGroupNode(memberExpr, intellisense);
        if (groupNode !== null) {
            const group = regex.groups.find(grp => grp.name === groupNode.name);
            if (group) {
                group.used = true;
            }
            else {
                intellisense.context.report({
                    message: utils_1.toEncodedMessage(`There is no group named '${groupNode.name}' in the regular expression.`, regex.groups.map(grp => ({
                        loc: utils_1.getRegexpLocation(regex.node, grp.node, intellisense.context),
                    })), regex.groups.map(grp => `Named group '${grp.name}'`)),
                    node: groupNode,
                });
            }
        }
    }
}
function extractGroupNode(memberExpr, intellisense) {
    const { property, computed } = memberExpr;
    if (property.type === 'Identifier' && !computed) {
        const ancestors = intellisense.context.getAncestors();
        let parent = ancestors.pop();
        if (parent && utils_1.isDotNotation(parent)) {
            switch (property.name) {
                case 'groups':
                    /* matcher.groups.<name> */
                    return parent.property;
                case 'indices':
                    /* matcher.indices.groups.<name> */
                    if (parent.property.name === 'groups') {
                        parent = ancestors.pop();
                        if (parent && utils_1.isDotNotation(parent)) {
                            return parent.property;
                        }
                    }
            }
        }
    }
    return null;
}
function checkUnusedGroups(intellisense) {
    intellisense.getKnowledge().forEach(regex => {
        if (regex.matched) {
            const unusedGroups = regex.groups.filter(group => !group.used);
            if (unusedGroups.length) {
                intellisense.context.report({
                    message: utils_1.toEncodedMessage('Use the named groups of this regex or remove the names.', unusedGroups.map(grp => ({
                        loc: utils_1.getRegexpLocation(regex.node, grp.node, intellisense.context),
                    })), unusedGroups.map(grp => `Named group '${grp.name}'`)),
                    node: regex.node,
                });
            }
        }
    });
}
function checkIndexedGroups(intellisense) {
    intellisense.getKnowledge().forEach(regex => {
        regex.groups.forEach(group => group.node.references.forEach(reference => {
            if (typeof reference.ref === 'number') {
                intellisense.context.report({
                    message: utils_1.toEncodedMessage(`Directly use '${group.name}' instead of its group number.`, [{ loc: utils_1.getRegexpLocation(regex.node, group.node, intellisense.context) }], [`Group '${group.name}'`]),
                    loc: utils_1.getRegexpLocation(regex.node, reference, intellisense.context),
                });
            }
        }));
    });
}
function makeRegexKnowledge(node, regexp) {
    const capturingGroups = [];
    const backreferences = [];
    regexpp.visitRegExpAST(regexp, {
        onBackreferenceEnter: reference => reference.resolved.name && backreferences.push(reference),
        onCapturingGroupEnter: group => capturingGroups.push(group),
    });
    const groups = [];
    capturingGroups.forEach((group, index) => group.name && groups.push(makeGroupKnowledge(group, backreferences, index + 1)));
    return { node, regexp, groups, matched: false };
}
function makeGroupKnowledge(node, backreferences, index) {
    const name = node.name;
    const used = backreferences.some(backreference => backreference.resolved === node);
    return { node, name, used, index };
}
class RegexIntelliSense {
    constructor(services, context) {
        this.services = services;
        this.context = context;
        this.knowledge = [];
        this.bindings = new Map();
    }
    getKnowledge() {
        return this.knowledge;
    }
    collectKnowledge(node) {
        let regexNode = node;
        if (node.type === 'CallExpression' && utils_1.isStringRegexMethodCall(node, this.services)) {
            /* implicit regex */
            regexNode = node.arguments[0];
        }
        const regex = utils_1.getParsedRegex(regexNode, this.context);
        if (regex !== null) {
            this.knowledge.push(makeRegexKnowledge(regexNode, regex));
        }
    }
    collectPatternMatcher(callExpr) {
        const { callee, arguments: args } = callExpr;
        if (utils_1.isMethodCall(callExpr) && args.length > 0) {
            const target = callee.object;
            const matcher = utils_1.getLhsVariable(this.context);
            if (matcher) {
                const method = callee.property;
                if (utils_1.isString(target, this.services) && ['match', 'matchAll'].includes(method.name)) {
                    /* str.match(pattern) */
                    const [pattern] = args;
                    this.bind(pattern, matcher);
                }
                else if (method.name === 'exec' && utils_1.isString(args[0], this.services)) {
                    /* pattern.exec(str) */
                    const pattern = target;
                    this.bind(pattern, matcher);
                }
            }
        }
    }
    resolve(matcher) {
        const variable = this.findVariable(matcher);
        if (variable) {
            return this.bindings.get(variable) || null;
        }
        else {
            return null;
        }
    }
    findRegex(node) {
        return this.findRegexRec(node, new Set());
    }
    findRegexRec(node, visited) {
        if (!visited.has(node)) {
            visited.add(node);
            const variable = this.findVariable(node);
            if (variable) {
                const value = utils_1.getUniqueWriteUsage(this.context, variable.name);
                if (value) {
                    const regex = this.findRegexRec(value, visited);
                    if (regex) {
                        return regex;
                    }
                }
            }
        }
        return this.knowledge.find(regex => regex.node === node);
    }
    bind(pattern, matcher) {
        const regex = this.findRegex(pattern);
        if (regex) {
            regex.matched = true;
            this.bindings.set(matcher, regex);
        }
    }
    findVariable(node) {
        if (node.type === 'Identifier') {
            return utils_1.getVariableFromName(this.context, node.name);
        }
        return null;
    }
}
//# sourceMappingURL=unused-named-groups.js.map