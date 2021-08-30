"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleLogicalExpression = void 0;
const backend_1 = require("../backend");
const results_1 = require("./results");
function handleLogicalExpression(logiExpr, _ucfgBuilder, blockBuilder, childResults, _ctx) {
    const leftExpr = childResults.get(logiExpr.left).toExpression();
    const rightExpr = childResults.get(logiExpr.right).toExpression();
    let opDescr = '';
    switch (logiExpr.operator) {
        case '??':
            opDescr = 'Coalesc';
            break;
        case '||':
            opDescr = 'Or';
            break;
        case '&&':
            opDescr = 'And';
            break;
    }
    const unionVarPrefix = `union${opDescr}`;
    const leftVar = childResults.getExitBlockBuilder(logiExpr.left).expr(`left${opDescr}`, leftExpr);
    const rightVar = childResults
        .getExitBlockBuilder(logiExpr.right)
        .expr(`right${opDescr}`, rightExpr);
    // We treat the `&&` specially: in `a && b`, if `a` is returned, then it's falsy,
    // but falsy values cannot be tainted.
    const unionResult = logiExpr.operator === '&&'
        ? rightVar
        : backend_1.union(unionVarPrefix, [leftVar, rightVar], blockBuilder);
    return new results_1.ExpressionResult(unionResult);
}
exports.handleLogicalExpression = handleLogicalExpression;
//# sourceMappingURL=handleLogicalExpression.js.map