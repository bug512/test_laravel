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
exports.handleArrowFunctionExpression = void 0;
const backend = __importStar(require("../backend"));
const ucfg_builders_1 = require("../ucfg-builders");
const utils_1 = require("../utils");
const results_1 = require("./results");
const utils_environments_1 = require("./utils-environments");
const utils_parameters_1 = require("./utils-parameters");
const utils_this_1 = require("./utils-this");
function handleArrowFunctionExpression(arrExpr, ucfgBuilder, blockBuilder, ctx) {
    /* istanbul ignore else */
    if (ucfgBuilder.parentBuilders) {
        // Generate the expression in parent builder
        const parentBuilder = ucfgBuilder.parentBuilders.blockBuilder;
        const ucfgId = ucfgBuilder.getMethodId();
        const arrowValue = backend.declareFunction(ucfgId, parentBuilder);
        const arrowEnv = utils_environments_1.assembleEnvironmentOnDeclarationSite(arrExpr, arrowValue, parentBuilder, ctx);
        // Set the Function.Prototype stubs as prototype
        const funcProto = parentBuilder.newObject('functionPrototype', backend.FUNCTION_PROTOTYPE_TYPE_NAME);
        backend.setPrototype(arrowValue, funcProto, parentBuilder);
        const ancestor = utils_this_1.findFirstThisBinderAncestor(ctx.ruleContext.getAncestors().reverse());
        if (ancestor && ancestor.type === 'ArrowFunctionExpression') {
            // The enclosing arrow does not bind `this`. Get it from the outside: it's assumed to be stored in `env`-arg.
            ctx.envAllocationStrategy.storeOuterLexicalThis(arrowEnv, ctx.lexicalThisState, parentBuilder);
        }
        else {
            // The enclosing function binds `this`. Save it in the environment.
            ctx.envAllocationStrategy.storeCurrentLexicalThis(arrowEnv, ctx.lexicalThisState, parentBuilder);
        }
        // Set up the child builders
        ucfgBuilder.setLocation(utils_1.extractNeatUcfgLocation(arrExpr));
        const scopeId = ctx.lexicalStructure.getScopeIdForNode(arrExpr);
        const scopeFragmentBuilder = utils_environments_1.getScopeFragmentBuilder(ucfgBuilder, blockBuilder);
        utils_environments_1.createScopeIfNecessary(arrExpr, scopeFragmentBuilder, ctx);
        return childResults => {
            backend.setupCalleeParameters(utils_parameters_1.processFunctionParameters(arrExpr.params, scopeId, scopeFragmentBuilder, ctx, childResults), ucfgBuilder);
            if (arrExpr.expression) {
                blockBuilder.ret(childResults.get(arrExpr.body).toExpression(), arrExpr.body.loc);
            }
            return new results_1.FunctionExpressionResult(ucfgId, arrowValue);
        };
    }
    else {
        // impossible: function expressions are always children of something, and
        // never top-level elements.
        return () => new results_1.FunctionExpressionResult('<undefined-arrow-ucfg-id>', ucfg_builders_1.vbl('<undefined-arrow-var>'));
    }
}
exports.handleArrowFunctionExpression = handleArrowFunctionExpression;
//# sourceMappingURL=handleArrowExpression.js.map