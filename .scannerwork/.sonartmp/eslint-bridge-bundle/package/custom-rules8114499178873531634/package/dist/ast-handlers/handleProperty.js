"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleProperty = void 0;
const results_1 = require("./results");
const utils_member_expressions_1 = require("./utils-member-expressions");
function handleProperty(propertyNode, _ucfgBuilder, blockBuilder, childResults, ctx) {
    const keyNode = propertyNode.key;
    const valueNode = propertyNode.value;
    if (isAssignmentProperty(propertyNode, ctx)) {
        // ESLint properties come in two flavors: regular properties and assignment properties.
        // Assignment properties are only used with object patterns. Their traversal results
        // are eventually processed when resolving pattern matching of object destructuring.
        const key = utils_member_expressions_1.convertMemberExpressionPropertyToExpression(propertyNode.computed, childResults.get(keyNode), blockBuilder);
        const value = childResults.get(valueNode);
        return new results_1.PropertyPatternResult(key, value);
    }
    else {
        const key = utils_member_expressions_1.convertMemberExpressionPropertyToExpression(propertyNode.computed, childResults.get(keyNode), blockBuilder);
        const value = childResults.get(valueNode).toExpression();
        return new results_1.PropertyResult(key, value);
    }
}
exports.handleProperty = handleProperty;
function isAssignmentProperty(_node, ctx) {
    const parent = ctx.ruleContext.getAncestors().pop();
    /* istanbul ignore else */
    if (parent) {
        return parent.type === 'ObjectPattern';
    }
    else {
        // It should not happen: only a `Program` node doesn't have a parent.
        return false;
    }
}
//# sourceMappingURL=handleProperty.js.map