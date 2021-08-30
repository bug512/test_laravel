"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.processFunctionParameters = void 0;
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
const lexical_structure_1 = require("../lexical-structure");
const ucfg_builders_1 = require("../ucfg-builders");
const utils_destructuring_1 = require("./utils-destructuring");
function processFunctionParameters(params, scopeId, scopeFragmentBuilder, ctx, childResults) {
    const scopeName = lexical_structure_1.scopeIdToName(scopeId);
    return params.map((pattern, idx) => {
        let paramVar;
        if (pattern.type === 'Identifier') {
            paramVar = resolveIdentifier(ctx, pattern, scopeFragmentBuilder, scopeName);
        }
        else if (pattern.type === 'TSParameterProperty' && pattern.parameter.type === 'Identifier') {
            paramVar = resolveIdentifier(ctx, pattern.parameter, scopeFragmentBuilder, scopeName);
        }
        else {
            paramVar = ucfg_builders_1.vbl(`%arg_${idx}`, typeAsString(ctx, pattern));
            if (pattern.type === 'RestElement') {
                paramVar.setVariadicArg(true);
            }
            utils_destructuring_1.resolveDestructuring(childResults.get(pattern), paramVar, scopeFragmentBuilder, pattern);
        }
        // For a parameter to be considered as a parameter property, it needs to
        // have one of the following modifiers: 'public', 'protected', 'private' or 'readonly'
        if (pattern.type === 'TSParameterProperty' && (pattern.accessibility || pattern.readonly)) {
            assignParameterAsInstanceProperty(pattern.parameter, paramVar, scopeFragmentBuilder);
        }
        return paramVar;
    });
}
exports.processFunctionParameters = processFunctionParameters;
function resolveIdentifier(ctx, identifier, scopeFragmentBuilder, scopeName) {
    const paramName = identifier.name;
    const paramVar = ucfg_builders_1.vbl(paramName, typeAsString(ctx, identifier));
    const resolved = ctx.lexicalStructure.resolveVarsInUcfg(identifier);
    /* istanbul ignore else */
    if (resolved) {
        // Always take the first one: identifiers in parameter position never
        // generate more than one binding.
        const binding = resolved[0];
        if (binding.isScopeAllocated) {
            scopeFragmentBuilder.assignExpr(ucfg_builders_1.fieldAccess(scopeName, binding.effectiveBinding.effectiveName), paramVar, identifier.loc);
        }
        else {
            /*
             * Intentionally left blank.
             *
             * It's just a purely stack-local variable, we can use the parameter as-is.
             */
        }
    }
    else {
        // 1. Should not occur: all variables occurring in parameter list are
        //    reliably recognized as binders by eslint.
        // 2. Doesn't matter if it occurs after all: one undefined local variable more
        //    won't have severe consequences, and will also be clearly visible in generated
        //    UCFGs.
    }
    return paramVar;
}
function typeAsString(ctx, node) {
    let typeAnnotation = undefined;
    if (node.type === experimental_utils_1.AST_NODE_TYPES.Identifier) {
        typeAnnotation = node.typeAnnotation;
    }
    else if (node.type === experimental_utils_1.AST_NODE_TYPES.TSParameterProperty) {
        typeAnnotation = node.parameter.typeAnnotation;
    }
    if (typeAnnotation && typeAnnotation.typeAnnotation.type === experimental_utils_1.AST_NODE_TYPES.TSTypeReference) {
        return typeName(typeAnnotation.typeAnnotation.typeName);
    }
    return undefined;
}
function typeName(entity) {
    if (entity.type === experimental_utils_1.AST_NODE_TYPES.Identifier) {
        return entity.name;
    }
    else {
        return `${typeName(entity.left)}.${entity.right.name}`;
    }
}
function assignParameterAsInstanceProperty(parameter, paramVar, builder) {
    let paramName;
    /* istanbul ignore else */
    if (parameter.type === 'Identifier') {
        paramName = parameter.name;
    }
    else if (parameter.type === 'AssignmentPattern' && parameter.left.type === 'Identifier') {
        paramName = parameter.left.name;
    }
    else {
        // Should not happen, parameter properties are currently only supported with
        // identifiers or simple assignment (having identifiers as LHS)
        return;
    }
    builder.assignExpr(ucfg_builders_1.fieldAccess(ucfg_builders_1._this(), paramName), paramVar, parameter.loc);
}
//# sourceMappingURL=utils-parameters.js.map