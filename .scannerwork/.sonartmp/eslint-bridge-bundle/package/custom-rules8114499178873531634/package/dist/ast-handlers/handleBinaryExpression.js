"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
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
exports.handleBinaryExpression = void 0;
const backend = __importStar(require("../backend"));
const results_1 = require("./results");
function handleBinaryExpression(binExpr, _ucfgBuilder, blockBuilder, childReturns) {
    const left = childReturns.get(binExpr.left).toExpression();
    const right = childReturns.get(binExpr.right).toExpression();
    const operands = [left, right];
    if (binExpr.operator === '+') {
        const res = backend.concat(operands, blockBuilder, binExpr.loc);
        return new results_1.ExpressionResult(res);
    }
    else {
        const builtInName = backend.getBuiltinNameForBinaryOperator(binExpr.operator);
        return new results_1.ExpressionResult(blockBuilder.call('binOpRes', builtInName, operands, {}, undefined, binExpr.loc));
    }
}
exports.handleBinaryExpression = handleBinaryExpression;
//# sourceMappingURL=handleBinaryExpression.js.map