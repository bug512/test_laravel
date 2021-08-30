"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleTemplateLiteral = void 0;
const backend_1 = require("../backend");
const ucfg_builders_1 = require("../ucfg-builders");
const utils_1 = require("../utils");
const results_1 = require("./results");
function handleTemplateLiteral(node, _ucfgBuilder, blockBuilder, childResults, ctx) {
    const { quasis: quasiNodes, expressions: exprNodes } = node;
    const parent = utils_1.peek(ctx.ruleContext.getAncestors());
    if (parent.type === 'TaggedTemplateExpression' && parent.quasi === node) {
        return new results_1.TaggedTemplateLiteralResult(results_1.resultsToExpressions(childResults.getArray(quasiNodes)), results_1.resultsToExpressions(childResults.getArray(exprNodes)));
    }
    else {
        const exprs = results_1.resultsToExpressions(childResults.getArray(exprNodes));
        /* istanbul ignore else */
        if (quasiNodes.length === exprs.length + 1) {
            const operands = [];
            for (let i = 0; i < exprs.length; i++) {
                addQuasiIfNonempty(quasiNodes[i], operands);
                // Temporary workaround
                //
                // `toString` should be applied to the interpolated expressions.
                operands.push(exprs[i]);
            }
            addQuasiIfNonempty(utils_1.peek(quasiNodes), operands);
            if (operands.length === 0) {
                return new results_1.ExpressionResult(ucfg_builders_1.stringLiteral(''));
            }
            else if (operands.length === 1) {
                return new results_1.ExpressionResult(operands[0]);
            }
            else {
                const res = backend_1.concat(operands, blockBuilder, node.loc);
                return new results_1.ExpressionResult(res);
            }
        }
        else {
            // 1. Should not occur: `#string_literals = #interpolated_expressions + 1` must always hold.
            // 2. Harmless: the worst thing that can happen is that we omit a template literal.
            return new results_1.ExpressionResult(ucfg_builders_1._undefined());
        }
    }
}
exports.handleTemplateLiteral = handleTemplateLiteral;
function addQuasiIfNonempty(quasiNode, operands) {
    const s = quasiNode.value.cooked;
    if (s) {
        operands.push(ucfg_builders_1.stringLiteral(s));
    }
}
//# sourceMappingURL=handleTemplateLiteral.js.map