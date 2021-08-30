"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCallExpression = void 0;
const module_systems_1 = require("./module-systems");
const results_1 = require("./results");
const utils_calls_1 = require("./utils-calls");
/**
 * The `onExit`-handler for general call expressions, like
 * `f(x)`, `o.m(x)`, `(arbitraryExpression)(arg1, ..., arg2)` etc.
 *
 */
function handleCallExpression(callExpr, ucfgBuilder, blockBuilder, childResults, ctx) {
    const argResults = results_1.resultsToExpressions(childResults.getArray(callExpr.arguments));
    if (callExpr.callee.type === 'Identifier') {
        const requireCall = requiredModule(callExpr, blockBuilder, ucfgBuilder, ctx);
        if (requireCall) {
            return new results_1.ExpressionResult(requireCall);
        }
        else {
            return utils_calls_1.handleFunctionCall(callExpr.callee, argResults, ucfgBuilder, blockBuilder, childResults, ctx, callExpr.callee.loc);
        }
    }
    else if (callExpr.callee.type === 'MemberExpression') {
        return utils_calls_1.handleMethodCall(callExpr.callee, argResults, ucfgBuilder, blockBuilder, childResults, ctx, callExpr.callee.property.loc);
    }
    else if (callExpr.callee.type === 'Super') {
        return utils_calls_1.handleSuperCall(argResults, blockBuilder, ctx, callExpr.loc);
    }
    else {
        return utils_calls_1.handleExpressionCall(callExpr.callee, argResults, ucfgBuilder, blockBuilder, childResults, ctx, callExpr.callee.loc);
    }
}
exports.handleCallExpression = handleCallExpression;
function requiredModule(callExpr, blockBuilder, ucfgBuilder, ctx) {
    const callee = callExpr.callee;
    if (callee.name === 'require' && callExpr.arguments.length > 0) {
        const [arg] = callExpr.arguments;
        if (arg.type === 'Literal' && arg.value) {
            return ucfgBuilder.getOrElseUpdateSharedImport(module_systems_1.asImportSource(arg.value), module_systems_1.importModule(ucfgBuilder, blockBuilder, ctx, callee.loc));
        }
    }
}
//# sourceMappingURL=handleCallExpression.js.map