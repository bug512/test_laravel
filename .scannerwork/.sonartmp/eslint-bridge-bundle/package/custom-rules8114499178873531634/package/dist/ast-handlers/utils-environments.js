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
exports.getScopeFragmentBuilder = exports.createScopeIfNecessary = exports.assembleEnvironmentOnDeclarationSite = void 0;
const backend = __importStar(require("../backend"));
const lexical_structure_1 = require("../lexical-structure");
const ucfg_builders_1 = require("../ucfg-builders");
function provideRequiredScopes(ucfgGeneratingNode, closureEnv, builder, ctx) {
    const envAllocationStrategy = ctx.envAllocationStrategy;
    for (const outerScopeReq of ctx.lexicalStructure.getOuterScopeRequirements(ucfgGeneratingNode)) {
        const scopeId = outerScopeReq.scopeId;
        const scopeName = lexical_structure_1.scopeIdToName(scopeId);
        if (outerScopeReq instanceof lexical_structure_1.RequireOuterScope) {
            envAllocationStrategy.propagateIntoNestedEnvironment(ucfg_builders_1.vbl(backend.ENV), closureEnv, scopeName, builder);
        }
        else {
            builder.assignExpr(ucfg_builders_1.fieldAccess(closureEnv, scopeName), ucfg_builders_1.vbl(scopeName));
        }
    }
    envAllocationStrategy.propagateIntoNestedEnvironment(ucfg_builders_1.vbl(backend.ENV), closureEnv, 'global', builder);
}
/**
 * Assembles the environment for a closure (function, arrow) on the declaration
 * site. Packages all the required outer scopes into the environment.
 */
function assembleEnvironmentOnDeclarationSite(node, functionValue, parentBuilder, ctx) {
    const { envAllocationStrategy } = ctx;
    const env = envAllocationStrategy.allocateEnvironment(parentBuilder);
    provideRequiredScopes(node, env, parentBuilder, ctx);
    envAllocationStrategy.attachEnvironmentToClosure(functionValue, env, parentBuilder);
    return env;
}
exports.assembleEnvironmentOnDeclarationSite = assembleEnvironmentOnDeclarationSite;
/**
 * Sets up a scope object if necessary.
 */
function createScopeIfNecessary(node, scopeFragmentBuilder, ctx) {
    const lexicalStructure = ctx.lexicalStructure;
    if (lexicalStructure.isScopeMaterialized(node)) {
        const scope = lexicalStructure.getScopeForNode(node);
        /* istanbul ignore else */
        if (scope) {
            const scopeId = lexicalStructure.getScopeId(scope);
            const scopeName = lexical_structure_1.scopeIdToName(scopeId);
            scopeFragmentBuilder.assignNewObject(scopeName, 'Object');
            ctx.envAllocationStrategy.provideInCurrentEnvironment(ucfg_builders_1.vbl(backend.ENV), scopeName, scopeFragmentBuilder);
        }
        // 1. Cannot happen: `isScopeMaterialized` must imply that a scope is found.
        // 2. If it happens: doesn't matter, then we simply omit a few instructions.
    }
}
exports.createScopeIfNecessary = createScopeIfNecessary;
/**
 * Tries as hard as possible to obtain a scope fragment builder from the `builders`.
 *
 * Creates a new one, if necessary.
 */
function getScopeFragmentBuilder(ucfgBuilder, blockBuilder) {
    const maybeFragmentBuilder = ucfgBuilder.getFragmentBuilder('scope');
    /* istanbul ignore else */
    if (maybeFragmentBuilder) {
        return maybeFragmentBuilder;
    }
    else {
        // 1. It should not happen: a scope fragment builder is created in every entry block.
        // 2. If it happens anyway, it doesn't matter: some instructions might end up in the
        //    wrong place, but that's not critical.
        const newScopeFragmentBuilder = blockBuilder.beginFragment();
        ucfgBuilder.setFragmentBuilder('scope', newScopeFragmentBuilder);
        return newScopeFragmentBuilder;
    }
}
exports.getScopeFragmentBuilder = getScopeFragmentBuilder;
//# sourceMappingURL=utils-environments.js.map