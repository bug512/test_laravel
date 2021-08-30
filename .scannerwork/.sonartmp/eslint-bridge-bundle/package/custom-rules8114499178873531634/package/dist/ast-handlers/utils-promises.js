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
exports.handleNewPromise = exports.handleIfPromiseLikeCall = void 0;
const backend = __importStar(require("../backend"));
const lexical_structure_1 = require("../lexical-structure");
const ucfg_builders_1 = require("../ucfg-builders");
const ucfg_id_1 = require("../ucfg-id");
const results_1 = require("./results");
const utils_environments_1 = require("./utils-environments");
function handleIfPromiseLikeCall(callee, args, ucfgBuilder, blockBuilder, childResults, ctx, loc) {
    function extractCallback(arg) {
        const callback = blockBuilder.ensureIsVariableOrFieldAccess(args[arg]);
        const env = ctx.envAllocationStrategy.fetchEnvironmentFromClosure(callback, blockBuilder);
        const { emitFetch } = childResults.get(callee);
        const { implicitThis: targetObject } = emitFetch();
        return { callback, env, targetObject };
    }
    const { property } = callee;
    if (property.type === 'Identifier' && args.length > 0) {
        if (property.name === 'then') {
            if (args.length > 1) {
                const reason = ucfg_builders_1.stringLiteral('');
                const { callback: onRejected, env: e } = extractCallback(1);
                backend.callFunction(onRejected, [e, reason], ucfgBuilder, blockBuilder, loc);
            }
            const { callback: onFulfilled, env, targetObject } = extractCallback(0);
            return new results_1.ExpressionResult(backend.callFunction(onFulfilled, [env, targetObject], ucfgBuilder, blockBuilder, loc));
        }
        else if (property.name === 'catch') {
            // BlueBird filtered catch http://bluebirdjs.com/docs/api/catch.html#filtered-catch
            const callbackArgIndex = args.length === 2 ? 1 : 0;
            const { callback: onRejected, env, targetObject } = extractCallback(callbackArgIndex);
            backend.callFunction(onRejected, [env, targetObject], ucfgBuilder, blockBuilder, loc);
            return new results_1.ExpressionResult(targetObject);
        }
        else if (property.name === 'finally') {
            const { callback, env, targetObject } = extractCallback(0);
            backend.callFunction(callback, [env], ucfgBuilder, blockBuilder, loc);
            return new results_1.ExpressionResult(targetObject);
        }
    }
    return undefined;
}
exports.handleIfPromiseLikeCall = handleIfPromiseLikeCall;
const SCOPE_GENERATING_NODE_TYPES = [
    'Program',
    'FunctionDeclaration',
    'FunctionExpression',
    'ArrowFunctionExpression',
];
function handleNewPromise(newExpr, ucfgBuilder, blockBuilder, childResults, ctx) {
    const scopeGeneratingNode = ctx.ruleContext
        .getAncestors()
        .reverse()
        .find(a => SCOPE_GENERATING_NODE_TYPES.includes(a.type));
    if (!scopeGeneratingNode || newExpr.arguments.length === 0) {
        return new results_1.UndefinedResult();
    }
    const { loc } = newExpr;
    // Ensure existing materialized scope
    const scopeFragmentBuilder = utils_environments_1.getScopeFragmentBuilder(ucfgBuilder, blockBuilder);
    if (!ctx.lexicalStructure.isScopeMaterialized(scopeGeneratingNode)) {
        createScope(scopeGeneratingNode, scopeFragmentBuilder, ctx);
    }
    // Extend materialized scope with Promise value
    const scopeId = ctx.lexicalStructure.getScopeIdForNode(scopeGeneratingNode);
    const scopeName = lexical_structure_1.scopeIdToName(scopeId);
    const promiseId = ctx.idGen.freshId('Promise');
    const promiseValueVar = ucfg_builders_1.vbl(`__promiseValue${promiseId}`);
    blockBuilder.assignExpr(ucfg_builders_1.fieldAccess(scopeName, promiseValueVar), ucfg_builders_1._undefined());
    // Declare UCFG for Promise resolve
    const resolveUcfgId = ucfg_id_1.defaultUcfgId(ctx.ruleContext.getFilename(), process.cwd(), newExpr, `promiseResolve${promiseId}`);
    const resolveFunVar = backend.declareFunction(resolveUcfgId, blockBuilder);
    // Assemble environment for Promise resolve
    const resolveEnvVar = utils_environments_1.assembleEnvironmentOnDeclarationSite(newExpr, resolveFunVar, blockBuilder, ctx);
    blockBuilder.assignExpr(ucfg_builders_1.fieldAccess(resolveEnvVar, scopeName), ucfg_builders_1.vbl(scopeName));
    // Create UCFG for Promise resolve
    //
    // We generate one UCFG per `new Promise((res, _) => ...)` because the synthetic resolve-callback `res`
    // that we emit depends on two pieces of information that we are not able to provide dynamically:
    //
    //  1. the scope from which the promise was created,
    //  2. the promise value's symbol attached to the scope.
    //
    // The user code complies with the contract of such a callback, that is, one single argument for the value
    // while we would need to pass two additional ones. That would also require rewriting the call(s) to `res`,
    // which doesn't seem feasible.
    const resolveValueVar = ucfg_builders_1.vbl('value');
    const resolveUcfgBuilder = ucfg_builders_1.beginUcfg(resolveUcfgId, ucfg_builders_1._this(), [ucfg_builders_1.vbl(backend.ENV), resolveValueVar], loc, { ucfgBuilder, blockBuilder });
    const resolveBlockBuilder = resolveUcfgBuilder.beginEntryBlock('promiseResolve-entry', loc);
    const scopeFetch = resolveBlockBuilder.expr(`sc-${scopeId}`, ucfg_builders_1.fieldAccess(backend.ENV, scopeName), '');
    resolveBlockBuilder.assignExpr(ucfg_builders_1.fieldAccess(scopeFetch, promiseValueVar), resolveValueVar, loc);
    resolveBlockBuilder.ret(ucfg_builders_1._undefined(), loc);
    ctx.generatedUcfgBuilders.push(resolveUcfgBuilder);
    // Call Promise executor
    const [executorRes, _] = childResults.getArray(newExpr.arguments);
    const executorVar = blockBuilder.expr('promiseExecutor', executorRes.toExpression(), undefined, loc);
    const executorEnv = ctx.envAllocationStrategy.fetchEnvironmentFromClosure(executorVar, blockBuilder);
    backend.callFunction(executorVar, [executorEnv, resolveFunVar], ucfgBuilder, blockBuilder, loc);
    // Return mutated Promise value
    const res = blockBuilder.expr('promiseValue', ucfg_builders_1.fieldAccess(scopeName, promiseValueVar), undefined, loc);
    return new results_1.ExpressionResult(res);
}
exports.handleNewPromise = handleNewPromise;
function createScope(node, scopeFragmentBuilder, ctx) {
    const lexicalStructure = ctx.lexicalStructure;
    const scope = lexicalStructure.getScopeForNode(node);
    if (scope) {
        const scopeId = lexicalStructure.getScopeId(scope);
        const scopeName = lexical_structure_1.scopeIdToName(scopeId);
        scopeFragmentBuilder.assignNewObject(scopeName, 'Object');
        ctx.envAllocationStrategy.provideInCurrentEnvironment(ucfg_builders_1.vbl(backend.ENV), scopeName, scopeFragmentBuilder);
    }
}
//# sourceMappingURL=utils-promises.js.map