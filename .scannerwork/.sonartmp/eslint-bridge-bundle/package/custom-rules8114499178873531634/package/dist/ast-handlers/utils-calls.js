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
exports.handleSuperCall = exports.handleExpressionCall = exports.handleMethodCall = exports.handleFunctionCall = void 0;
const backend = __importStar(require("../backend"));
const ucfg_builders_1 = require("../ucfg-builders");
const handleSuper_1 = require("./handleSuper");
const results_1 = require("./results");
const utils_identifiers_1 = require("./utils-identifiers");
const utils_promises_1 = require("./utils-promises");
function handleFunctionCall(callee, args, ucfgBuilder, blockBuilder, _childResults, ctx, loc) {
    const functionRef = utils_identifiers_1.processIdentifierInRefPosition(callee, ucfgBuilder, blockBuilder, ctx.lexicalStructure);
    const calleeVbl = blockBuilder.ensureIsVariableOrFieldAccess(functionRef);
    const env = ctx.envAllocationStrategy.fetchEnvironmentFromClosure(calleeVbl, blockBuilder);
    return new results_1.ExpressionResult(backend.callFunction(calleeVbl, [env, ...args], ucfgBuilder, blockBuilder, loc));
}
exports.handleFunctionCall = handleFunctionCall;
function handleMethodCall(callee, args, ucfgBuilder, blockBuilder, childResults, ctx, loc) {
    const promiseLikeCall = utils_promises_1.handleIfPromiseLikeCall(callee, args, ucfgBuilder, blockBuilder, childResults, ctx, loc);
    if (promiseLikeCall) {
        return promiseLikeCall;
    }
    else {
        // The method calls like `o.m(x)` or `o['m'](x)` require some special care,
        // see the comments for `fieldAccessResult` in `ast-handlers.ts` for more information.
        // In short: we have not only to fetch the method from the object, but we also need
        // to retain the object value, in order to pass it as `this`.
        const { emitFetch } = childResults.get(callee);
        const { fetchedValue: method, implicitThis } = emitFetch();
        const methodRef = blockBuilder.ensureIsVariableOrFieldAccess(method);
        const env = ctx.envAllocationStrategy.fetchEnvironmentFromClosure(blockBuilder.ensureStoredInVariable(methodRef), blockBuilder);
        return new results_1.ExpressionResult(backend.callMethod(methodRef, implicitThis, [env, ...args], blockBuilder, loc));
    }
}
exports.handleMethodCall = handleMethodCall;
function handleExpressionCall(callee, args, ucfgBuilder, blockBuilder, childResults, ctx, loc) {
    const calleeRes = childResults.get(callee).toExpression();
    const calleeVbl = blockBuilder.ensureIsVariableOrFieldAccess(calleeRes);
    const env = ctx.envAllocationStrategy.fetchEnvironmentFromClosure(calleeVbl, blockBuilder);
    return new results_1.ExpressionResult(backend.callFunction(calleeVbl, [env, ...args], ucfgBuilder, blockBuilder, loc));
}
exports.handleExpressionCall = handleExpressionCall;
function handleSuperCall(args, blockBuilder, ctx, loc) {
    const calleeFetchedFromEnvironment = handleSuper_1.fetchSuperFromEnv(blockBuilder, ctx);
    // Temporary workaround for SONARSEC-S2269, the `ensureStoredInVariable` won't be needed afterwards.
    const receiver = blockBuilder.ensureStoredInVariable(ucfg_builders_1._this());
    const calleeVbl = blockBuilder.ensureIsVariableOrFieldAccess(calleeFetchedFromEnvironment);
    const env = ctx.envAllocationStrategy.fetchEnvironmentFromClosure(calleeVbl, blockBuilder);
    return new results_1.ExpressionResult(backend.callMethod(calleeFetchedFromEnvironment, receiver, [env, ...args], blockBuilder, loc));
}
exports.handleSuperCall = handleSuperCall;
//# sourceMappingURL=utils-calls.js.map