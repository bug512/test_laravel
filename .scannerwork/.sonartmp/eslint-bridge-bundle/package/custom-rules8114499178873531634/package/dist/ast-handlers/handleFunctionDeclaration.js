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
exports.handleFunctionDeclaration = void 0;
const backend = __importStar(require("../backend"));
const ucfg_builders_1 = require("../ucfg-builders");
const utils_1 = require("../utils");
const results_1 = require("./results");
const utils_environments_1 = require("./utils-environments");
const utils_identifiers_1 = require("./utils-identifiers");
const utils_parameters_1 = require("./utils-parameters");
const utils_prototypes_1 = require("./utils-prototypes");
/**
 * Handles function declarations like `function bar() { ... }`.
 */
function handleFunctionDeclaration(funcDecl, ucfgBuilder, blockBuilder, ctx) {
    /* istanbul ignore else */
    if (ucfgBuilder.parentBuilders) {
        // Generate the expression in the parent builder
        const ucfgId = ucfgBuilder.getMethodId();
        let hoistingBuilder;
        const maybeUcfgHoistingBuilder = ucfgBuilder.parentBuilders.ucfgBuilder.getFragmentBuilder('hoisting');
        /* istanbul ignore else */
        if (maybeUcfgHoistingBuilder) {
            hoistingBuilder = maybeUcfgHoistingBuilder;
        }
        else {
            hoistingBuilder = ucfgBuilder.parentBuilders.blockBuilder.beginFragment();
        }
        const functionValue = backend.declareFunction(ucfgId, hoistingBuilder);
        utils_environments_1.assembleEnvironmentOnDeclarationSite(funcDecl, functionValue, hoistingBuilder, ctx);
        // Set the Function.Prototype stubs as prototype
        utils_prototypes_1.initFunctionPrototype(functionValue, ucfgBuilder.parentBuilders.ucfgBuilder, hoistingBuilder);
        if (funcDecl.id) {
            // This currently takes the first binding - this will be the "outer" binding, not suitable
            // for recursive function invocations (i.e. the recursive invocations aren't redirected to
            // another function if the top-level definition of the function is overridden by something else).
            // It will not work correctly for recursive invocations.
            // This is currently completely out of scope, handling of recursive functions is not supported.
            const resolvedVars = ctx.lexicalStructure.resolveVarsInUcfg(funcDecl.id);
            const lVal = resolvedVars ? utils_identifiers_1.varAsLvalue(resolvedVars[0]) : ucfg_builders_1.vbl(funcDecl.id.name);
            hoistingBuilder.assignExpr(lVal, functionValue, funcDecl.id.loc);
        }
        // Set up the child builders
        ucfgBuilder.setLocation(utils_1.extractNeatUcfgLocation(funcDecl));
        const scopeId = ctx.lexicalStructure.getScopeIdForNode(funcDecl);
        const scopeFragmentBuilder = utils_environments_1.getScopeFragmentBuilder(ucfgBuilder, blockBuilder);
        utils_environments_1.createScopeIfNecessary(funcDecl, scopeFragmentBuilder, ctx);
        return childResults => {
            var _a;
            backend.setupCalleeParameters(utils_parameters_1.processFunctionParameters(funcDecl.params, scopeId, scopeFragmentBuilder, ctx, childResults), ucfgBuilder);
            return new results_1.FunctionExpressionResult(ucfgId, functionValue, (_a = funcDecl.id) === null || _a === void 0 ? void 0 : _a.name);
        };
    }
    else {
        // never occurs. A function declaration is not `Program`, and thus
        // can never be a top-level element. It must have a parent element.
        return () => new results_1.FunctionExpressionResult('<undefined-ucfg-id-FD>', ucfg_builders_1.vbl('<undefined-ucfg-var-FD>'));
    }
}
exports.handleFunctionDeclaration = handleFunctionDeclaration;
//# sourceMappingURL=handleFunctionDeclaration.js.map