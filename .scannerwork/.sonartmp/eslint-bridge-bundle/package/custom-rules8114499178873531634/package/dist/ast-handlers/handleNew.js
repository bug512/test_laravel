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
exports.handleNew = void 0;
const backend = __importStar(require("../backend"));
const ucfg_builders_1 = require("../ucfg-builders");
const results_1 = require("./results");
const utils_promises_1 = require("./utils-promises");
function handleNew(newExpr, ucfgBuilder, blockBuilder, childResults, ctx) {
    const { callee } = newExpr;
    if (callee.type === 'Identifier' && callee.name === 'Promise') {
        return utils_promises_1.handleNewPromise(newExpr, ucfgBuilder, blockBuilder, childResults, ctx);
    }
    const constructedObjectVar = blockBuilder.newObject('object', 'Object', newExpr.loc);
    const constructedObject = constructedObjectVar;
    const constructorUxpr = childResults.get(newExpr.callee).toExpression();
    const constructorFA = blockBuilder.ensureIsVariableOrFieldAccess(constructorUxpr);
    const constructorVar = blockBuilder.ensureStoredInVariable(constructorUxpr);
    const argUxprs = results_1.resultsToExpressions(childResults.getArray(newExpr.arguments));
    const env = ctx.envAllocationStrategy.fetchEnvironmentFromClosure(constructorVar, blockBuilder);
    backend.callMethod(constructorFA, constructedObject, [env, ...argUxprs], blockBuilder, newExpr.loc);
    backend.setPrototype(constructedObject, ucfg_builders_1.fieldAccess(constructorVar, 'prototype'), blockBuilder);
    // Temporary workaround
    //
    // No way to support `return` from constructors; only effects on `this` are handled.
    return new results_1.ExpressionResult(constructedObject);
}
exports.handleNew = handleNew;
//# sourceMappingURL=handleNew.js.map