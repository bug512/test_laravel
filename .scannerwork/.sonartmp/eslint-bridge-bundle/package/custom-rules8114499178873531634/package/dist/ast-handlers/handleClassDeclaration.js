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
exports.handleClassDeclaration = void 0;
/* AST handlers for ES6 classes, constructors, methods */
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
const backend = __importStar(require("../backend"));
const ucfg_builders_1 = require("../ucfg-builders");
const ucfg_id_1 = require("../ucfg-id");
const results_1 = require("./results");
const utils_calls_1 = require("./utils-calls");
const utils_identifiers_1 = require("./utils-identifiers");
const utils_prototypes_1 = require("./utils-prototypes");
/**
 * Handler for both `ClassDeclaration`s and `ClassExpression`s.
 *
 * The two have essentially exactly the same interface (`ClassDeclarationBase`),
 * and differ only in the `type`. Also note that there can be both class expressions
 * with a name, and also class declarations without one (e.g. in default export clauses).
 */
function handleClassDeclaration(classDecl, ucfgBuilder, blockBuilder, childResults, ctx) {
    var _a;
    let classExpr = undefined;
    const classBodyResults = childResults.get(classDecl.body).propagatedChildResults;
    const instanceMethods = [];
    const staticMethods = [];
    for (const classBodyEntry of classDecl.body.body) {
        if (classBodyEntry.type === 'MethodDefinition') {
            const methDefRes = classBodyResults.get(classBodyEntry);
            if (classBodyEntry.kind === 'constructor') {
                classExpr = methDefRes.methodVar;
            }
            else if (classBodyEntry.kind === 'method') {
                if (classBodyEntry.static) {
                    staticMethods.push(methDefRes);
                }
                else {
                    instanceMethods.push(methDefRes);
                }
            }
            // Treat `set`/`get` eventually.
        }
        // Handle `ClassProperties` etc.
    }
    if (!classExpr) {
        classExpr = generateDefaultConstructor(classDecl, ucfgBuilder, blockBuilder, ctx);
    }
    const classExprVar = blockBuilder.ensureStoredInVariable(classExpr);
    if (classDecl.superClass) {
        // Child.__proto__ = Parent (for statics)
        const superClassResult = childResults.get(classDecl.superClass).toExpression();
        backend.setPrototype(classExpr, superClassResult, blockBuilder);
        // Child.prototype.__proto__ = Parent.prototype (for instance methods)
        const superClassVar = blockBuilder.ensureStoredInVariable(superClassResult);
        const superClassPrototype = blockBuilder.expr('super_prototype', ucfg_builders_1.fieldAccess(superClassVar, 'prototype'));
        const childClassPrototype = blockBuilder.expr('child_prototype', ucfg_builders_1.fieldAccess(classExprVar, 'prototype'));
        backend.setPrototype(childClassPrototype, superClassPrototype, blockBuilder);
        // Save the `super`-value in the environment
        const superEnvPropertyName = ctx.lexicalSuperState.lastSuperBindingName;
        blockBuilder.assignExpr(ucfg_builders_1.fieldAccess(backend.ENV, superEnvPropertyName), superClassVar);
    }
    processInstanceMethods(classExprVar, instanceMethods, blockBuilder);
    if (classDecl.id) {
        const resolvedVars = ctx.lexicalStructure.resolveVarsInUcfg(classDecl.id);
        /* istanbul ignore else */
        if (resolvedVars) {
            // Named class declarations generate two bindings in two different scopes:
            // the one seen from the outside behaves differently to the one seen from the
            // inside of the class body. For declarations, we must handle both, thus the loop
            for (const resolvedVar of resolvedVars) {
                const lVal = utils_identifiers_1.varAsLvalue(resolvedVar);
                blockBuilder.assignExpr(lVal, classExprVar, classDecl.id.loc);
            }
        }
        // 1. Rare: A variable could not be resolved at all by ESLint: this seems uncommon,
        //    and there is nothing feasible we can immediately do about it anyway.
        // 2. Inconsequential: Could lead to FN's, but cannot break anything.
    }
    staticMethods.forEach(staticMethod => {
        const methodName = backend.attemptConvertToConstantString(staticMethod.name);
        if (methodName) {
            blockBuilder.assignExpr(ucfg_builders_1.fieldAccess(classExprVar, methodName), staticMethod.methodVar);
        }
        else {
            // Handle computed method names, i.e. class A { [methodNameVar]() {} }
        }
    });
    handleClassDecorators(classDecl, classExprVar, childResults, ctx, blockBuilder, ucfgBuilder);
    return new results_1.ClassDeclarationResult(classExprVar, (_a = classDecl.id) === null || _a === void 0 ? void 0 : _a.name);
}
exports.handleClassDeclaration = handleClassDeclaration;
function processInstanceMethods(classExprVar, instanceMethods, blockBuilder) {
    if (instanceMethods.length !== 0) {
        const classPrototype = blockBuilder.expr('classProt', ucfg_builders_1.fieldAccess(classExprVar, 'prototype'));
        for (const methDefRes of instanceMethods) {
            const methodName = backend.attemptConvertToConstantString(methDefRes.name);
            if (methodName) {
                // Identifiers of non-computed method names are interpreted as string constants
                blockBuilder.assignExpr(ucfg_builders_1.fieldAccess(classPrototype, methodName), methDefRes.methodVar);
            }
            else {
                // Handle computed method names, i.e. class A { [methodNameVar]() {} }
            }
        }
    }
}
const DEFAULT_CONS_ARG_COUNT = 4;
function generateDefaultConstructor(classDecl, parentUcfgBuilder, parentBlockBuilder, ctx) {
    // Instantiate the default constructor in the parent-UCFG
    const constructorId = ctx.idGen.freshId('constructor');
    const constructorUcfgId = ucfg_id_1.defaultUcfgId(ctx.ruleContext.getFilename(), process.cwd(), classDecl, constructorId);
    const constructorVar = backend.declareFunction(constructorUcfgId, parentBlockBuilder);
    utils_prototypes_1.initFunctionPrototype(constructorVar, parentUcfgBuilder, parentBlockBuilder);
    // Set up the ucfg of the constructor itself
    const args = [...Array(DEFAULT_CONS_ARG_COUNT).keys()].map(i => ucfg_builders_1.vbl(`arg${i + 1}`));
    const constructorUcfgBuilder = ucfg_builders_1.beginUcfg(constructorUcfgId, ucfg_builders_1._this(), [ucfg_builders_1.vbl(backend.ENV), ...args], undefined, {
        ucfgBuilder: parentUcfgBuilder,
        blockBuilder: parentBlockBuilder,
    });
    const constructorBlockBuilder = constructorUcfgBuilder.beginEntryBlock('constructor-entry', classDecl.loc);
    if (classDecl.superClass) {
        utils_calls_1.handleSuperCall(args, constructorBlockBuilder, ctx, classDecl.loc);
    }
    constructorBlockBuilder.ret(ucfg_builders_1._undefined());
    ctx.generatedUcfgBuilders.push(constructorUcfgBuilder);
    return constructorVar;
}
function handleClassDecorators(classDecl, classExprVar, childResults, ctx, blockBuilder, ucfgBuilder) {
    var _a;
    (_a = classDecl.decorators) === null || _a === void 0 ? void 0 : _a.forEach(decorator => {
        if (decorator.expression.type === experimental_utils_1.AST_NODE_TYPES.CallExpression) {
            const decoratorFunction = childResults
                .get(decorator)
                .propagatedChildResults.get(decorator.expression)
                .toExpression();
            const env = ctx.envAllocationStrategy.fetchEnvironmentFromClosure(blockBuilder.ensureStoredInVariable(decoratorFunction), blockBuilder);
            backend.callFunction(decoratorFunction, [env, classExprVar], ucfgBuilder, blockBuilder, decorator.loc);
        }
    });
}
//# sourceMappingURL=handleClassDeclaration.js.map