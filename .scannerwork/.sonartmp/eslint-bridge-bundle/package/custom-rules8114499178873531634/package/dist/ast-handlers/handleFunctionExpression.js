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
exports.handleFunctionExpression = void 0;
const backend = __importStar(require("../backend"));
const ucfg_builders_1 = require("../ucfg-builders");
const utils_1 = require("../utils");
const results_1 = require("./results");
const utils_environments_1 = require("./utils-environments");
const utils_parameters_1 = require("./utils-parameters");
const utils_prototypes_1 = require("./utils-prototypes");
function handleFunctionExpression(fctExpr, ucfgBuilder, blockBuilder, ctx) {
    /* istanbul ignore else */
    if (ucfgBuilder.parentBuilders) {
        const ucfgId = ucfgBuilder.getMethodId();
        const parentBuilder = ucfgBuilder.parentBuilders.blockBuilder;
        const functionValue = backend.declareFunction(ucfgId, parentBuilder);
        utils_environments_1.assembleEnvironmentOnDeclarationSite(fctExpr, functionValue, parentBuilder, ctx);
        // Set the Function.Prototype stubs as prototype
        utils_prototypes_1.initFunctionPrototype(functionValue, ucfgBuilder.parentBuilders.ucfgBuilder, parentBuilder);
        // Set up the child builders
        ucfgBuilder.setLocation(utils_1.extractNeatUcfgLocation(fctExpr));
        const scopeId = ctx.lexicalStructure.getScopeIdForNode(fctExpr);
        const scopeFragmentBuilder = utils_environments_1.getScopeFragmentBuilder(ucfgBuilder, blockBuilder);
        utils_environments_1.createScopeIfNecessary(fctExpr, scopeFragmentBuilder, ctx);
        return childResults => {
            backend.setupCalleeParameters(utils_parameters_1.processFunctionParameters(fctExpr.params, scopeId, scopeFragmentBuilder, ctx, childResults), ucfgBuilder);
            return new results_1.FunctionExpressionResult(ucfgId, functionValue);
        };
    }
    else {
        // impossible: function expressions are always children of something, and
        // never top-level elements.
        return () => new results_1.FunctionExpressionResult('<undefined-ucfg-id-FE>', ucfg_builders_1.vbl('<undefined-ucfg-var-FE>'));
    }
}
exports.handleFunctionExpression = handleFunctionExpression;
//# sourceMappingURL=handleFunctionExpression.js.map