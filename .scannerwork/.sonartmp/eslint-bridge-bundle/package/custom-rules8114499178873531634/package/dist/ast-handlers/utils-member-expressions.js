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
exports.convertMemberExpressionPropertyToExpression = exports.handleMemberExpressionLike = void 0;
const backend = __importStar(require("../backend"));
const ucfg_builders_1 = require("../ucfg-builders");
const watchedPropertiesConfig = __importStar(require("../watched-properties.json"));
const results_1 = require("./results");
function handleMemberExpressionLike(memberExpr, blockBuilder, childResults, ctx) {
    const obj = childResults.get(memberExpr.object).toExpression();
    const propRes = childResults.get(memberExpr.property);
    const isComputed = memberExpr.type === 'MemberExpression' ? memberExpr.computed : false;
    const prop = convertMemberExpressionPropertyToExpression(isComputed, propRes, blockBuilder);
    const fragment = blockBuilder.beginFragment();
    const objVbl = fragment.ensureStoredInVariable(obj);
    const fieldName = propertyToString(memberExpr);
    const emitFetch = () => {
        if (fieldName === '__proto__') {
            const objUxpr = childResults.get(memberExpr.object).toExpression();
            return {
                fetchedValue: backend.getPrototype(objUxpr, blockBuilder, memberExpr.loc),
                implicitThis: ucfg_builders_1.vbl('<macros-generate-no-implicit-this>'),
            };
        }
        else {
            const res = backend.fetchObjectProperty(objVbl, prop, fragment, memberExpr.loc);
            return {
                fetchedValue: res,
                implicitThis: objVbl,
            };
        }
    };
    const emitWrite = (storedValue, builder) => {
        if (fieldName === '__proto__') {
            const objUxpr = childResults.get(memberExpr.object).toExpression();
            backend.setPrototype(objUxpr, storedValue, builder, memberExpr.loc);
        }
        else {
            if (memberExpr.type === 'MemberExpression' && objectContainsWatchedProperty(memberExpr)) {
                watchAssignment(memberExpr, objVbl, childResults, storedValue, builder, ctx);
            }
            backend.storeObjectProperty(objVbl, prop, storedValue, builder, memberExpr.loc);
        }
    };
    return new results_1.MemberExpressionResult(emitFetch, emitWrite);
}
exports.handleMemberExpressionLike = handleMemberExpressionLike;
function propertyToString(memberExpr) {
    if (memberExpr.type === 'MemberExpression' &&
        memberExpr.computed &&
        memberExpr.property.type === 'Literal') {
        return String(memberExpr.property.value);
    }
    else if (memberExpr.property.type === 'Identifier') {
        return memberExpr.property.name;
    }
}
function watchAssignment(node, objVbl, childResults, assignedValue, builder, ctx) {
    const obj = childResults.get(node.object).toExpression();
    const methodRef = ucfg_builders_1.fieldAccess(objVbl, '__setWatchedMemberDescendantProperty');
    const env = ctx.envAllocationStrategy.fetchEnvironmentFromClosure(methodRef, builder);
    const propertyAsString = propertyToString(node);
    if (propertyAsString !== undefined) {
        const propertyName = ucfg_builders_1.stringLiteral(propertyAsString);
        builder.dynamicCall('void', methodRef, [obj, env, propertyName, assignedValue], {}, undefined, node.loc);
    }
}
/**
 * When a field with this name is accessed, we call a magic function for the engine's stubs to be able
 * to handle special cases (e.g. when assigning a tainted value to this field should raise an issue)
 */
// Can be improved: SONARSEC-1926 proposes shared declaration location with engine
function isWatchedProperty(propertyName) {
    const WATCHED_PROPERTIES = new Set(watchedPropertiesConfig.watchedProperties);
    return propertyName && WATCHED_PROPERTIES.has(propertyName);
}
function objectContainsWatchedProperty(memberExpr) {
    const fieldName = propertyToString(memberExpr);
    return (isWatchedProperty(fieldName) ||
        (memberExpr.object.type === 'MemberExpression' &&
            objectContainsWatchedProperty(memberExpr.object)));
}
/**
 * Similar to `resultToExpression`, but for `MemberExpression` properties, which
 * additionally depend on whether the property was computed (`a[b]`) or not (`a.b`).
 */
function convertMemberExpressionPropertyToExpression(isComputed, propRes, blockBuilder) {
    if (!isComputed && propRes instanceof results_1.IdentifierResult) {
        return backend.stringLiteral(propRes.name, blockBuilder);
    }
    else {
        return propRes.toExpression();
    }
}
exports.convertMemberExpressionPropertyToExpression = convertMemberExpressionPropertyToExpression;
//# sourceMappingURL=utils-member-expressions.js.map