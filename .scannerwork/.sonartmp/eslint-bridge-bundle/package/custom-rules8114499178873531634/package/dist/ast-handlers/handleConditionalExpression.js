"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleConditionalExpression = void 0;
const results_1 = require("./results");
function handleConditionalExpression(condExpr, _ucfgBuilder, blockBuilder, childResults) {
    const thenExpr = childResults.get(condExpr.consequent).toExpression();
    const elseExpr = childResults.get(condExpr.alternate).toExpression();
    const unionVariable = blockBuilder.freshVar('unionThenElse');
    childResults.getExitBlockBuilder(condExpr.consequent).assignExpr(unionVariable, thenExpr);
    childResults.getExitBlockBuilder(condExpr.alternate).assignExpr(unionVariable, elseExpr);
    return new results_1.ExpressionResult(unionVariable);
}
exports.handleConditionalExpression = handleConditionalExpression;
//# sourceMappingURL=handleConditionalExpression.js.map