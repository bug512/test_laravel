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
exports.resolveDestructuring = void 0;
const backend_1 = require("../backend");
const ucfg_builders_1 = require("../ucfg-builders");
const pb = __importStar(require("../ucfg_pb"));
const results_1 = require("./results");
function resolveDestructuring(pattern, scrutinee, builder, syntacticNode) {
    if (pattern instanceof results_1.IdentifierResult) {
        // Always take the first lValue - identifiers never generate more than one binding
        // when used as pattern.
        builder.assignExpr(pattern.lValues[0], scrutinee, syntacticNode.loc);
    }
    else if (pattern instanceof results_1.AssignmentPatternResult) {
        const scrutineeVar = builder.ensureStoredInVariable(scrutinee);
        backend_1.assignUnion(scrutineeVar, [scrutineeVar, pattern.rhsResult.toExpression()], builder);
        resolveDestructuring(pattern.lhsResult, scrutineeVar, builder, syntacticNode);
    }
    else if (pattern instanceof results_1.ObjectPatternResult) {
        pattern.properties.forEach(p => resolveDestructuring(p.patternResult, scrutinee, builder, p.syntacticNode));
    }
    else if (pattern instanceof results_1.PropertyPatternResult) {
        if (pattern.key instanceof pb.Constant) {
            // Identifiers in non-computed properties will be interpreted as string constants
            // by the `convertMemberExpressionPropertyToExpression`-helper method.
            const field = pattern.key.getValue();
            const scrutineeVar = builder.ensureStoredInVariable(scrutinee);
            const newScrutinee = ucfg_builders_1.fieldAccess(scrutineeVar, field);
            resolveDestructuring(pattern.pattern, newScrutinee, builder, syntacticNode);
        }
        else {
            // Temporary workaround.
            //
            // Handle computed properties, i.e. { [key]: pttrn } = obj (SONARSEC-2107).
        }
    }
    else if (pattern instanceof results_1.ArrayPatternResult) {
        resolveDestructuringForArrayPattern(pattern, scrutinee, builder);
    }
    else if (pattern instanceof results_1.RestElementResult) {
        // The case where the parent pattern is an array is intercepted by the `ArrayPattern`,
        // so we can assume that this rest element is used inside an object-pattern.
        // Temporary workaround
        // We do not allocate a new object and copy over the unused properties. Instead,
        // we will simply bind the whole scrutinee to the rest element pattern.
        resolveDestructuring(pattern.wrappedPattern, scrutinee, builder, pattern.wrappedSyntacticNode);
    }
}
exports.resolveDestructuring = resolveDestructuring;
function resolveDestructuringForArrayPattern(arrayPattern, scrutinee, builder) {
    const arrScrutineeVar = builder.ensureStoredInVariable(scrutinee);
    for (let idx = 0; idx < arrayPattern.elementPatterns.length; idx++) {
        const elemResAndNode = arrayPattern.elementPatterns[idx];
        if (elemResAndNode !== null) {
            const { syntacticNode: elemNode, patternResult: elemPatRes } = elemResAndNode;
            if (elemPatRes instanceof results_1.RestElementResult) {
                // `Rest` behaves differently from other patterns, because
                // 1. it can occur only inside object or array pattern
                // 2. it matches "multiple" scrutinees at once (it slices the scrutinee for the array pattern)
                // therefore, it's treated right here inside the ArrayPattern case, without recursing.
                const restScrutinee = builder.call(`restScrut`, backend_1.SLICE_REST, [arrScrutineeVar, ucfg_builders_1.intLiteral(idx)], {}, undefined, elemNode.loc);
                // Note that we recurse on `elemPatRes.wrappedPattern`; We've processed the `RestElement` right here, and are
                // now recursing on the pattern wrapped inside of the `RestElement`, not on the `RestElement` itself.
                resolveDestructuring(elemPatRes.wrappedPattern, restScrutinee, builder, elemPatRes.wrappedSyntacticNode);
            }
            else {
                const elementScrutinee = builder.call(`elemScrutinee${idx}`, backend_1.ARRAY_GET, [
                    arrScrutineeVar,
                    ucfg_builders_1.intLiteral(idx),
                ]);
                resolveDestructuring(elemPatRes, elementScrutinee, builder, elemNode);
            }
        }
        // otherwise do nothing, just wait for the index to be advanced by `1`
    }
}
//# sourceMappingURL=utils-destructuring.js.map