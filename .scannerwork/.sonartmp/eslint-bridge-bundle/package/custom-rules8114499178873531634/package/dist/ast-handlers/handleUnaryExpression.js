"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUnaryExpression = void 0;
const ucfg_builders_1 = require("../ucfg-builders");
const results_1 = require("./results");
function handleUnaryExpression(unaryExpression, _ucfgBuilder, blockBuilder, childResults, _ctx) {
    const argumentExpr = childResults.get(unaryExpression.argument).toExpression();
    if (unaryExpression.operator === 'typeof') {
        return new results_1.ExpressionResult(blockBuilder.call('unaryOpRes', '__js_typeof', [argumentExpr], {}, undefined, unaryExpression.loc));
    }
    if (unaryExpression.operator === '-') {
        return attemptFoldConstantsForUnary(unaryExpression, argumentExpr, n => -n, '__js_unaryMinus', blockBuilder);
    }
    if (unaryExpression.operator === '+') {
        return attemptFoldConstantsForUnary(unaryExpression, argumentExpr, n => n, '__js_unaryPlus', blockBuilder);
    }
    return new results_1.UndefinedResult();
}
exports.handleUnaryExpression = handleUnaryExpression;
function attemptFoldConstantsForUnary(unaryExpression, argumentExpr, constOp, operatorId, blockBuilder) {
    if (unaryExpression.argument.type === 'Literal') {
        const argValue = unaryExpression.argument.value;
        if (typeof argValue === 'number') {
            return new results_1.ExpressionResult(ucfg_builders_1.intLiteral(constOp(argValue)));
        }
    }
    return new results_1.ExpressionResult(blockBuilder.call('unaryOpRes', operatorId, [argumentExpr], {}, undefined, unaryExpression.loc));
}
//# sourceMappingURL=handleUnaryExpression.js.map