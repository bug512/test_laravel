"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAssignmentLike = void 0;
const ucfg_builders_1 = require("../ucfg-builders");
const results_1 = require("./results");
const utils_destructuring_1 = require("./utils-destructuring");
/**
 * Handles assignment-like expressions / variable declarators,
 * including different left-hand sides (property writes, various
 * patterns).
 */
function handleAssignmentLike(lhs, lhsResult, rhsResult, blockBuilder) {
    const rhsUxpr = rhsResult.toExpression();
    if (lhs.type === 'Identifier') {
        const lhsIdRes = lhsResult;
        // Take the first lValue: left hand sides of assignments never generate more than one binding
        blockBuilder.assignExpr(lhsIdRes.lValues[0], rhsUxpr, lhs.loc);
    }
    else if (lhs.type === 'MemberExpression') {
        const { emitWrite } = lhsResult;
        emitWrite(rhsUxpr, blockBuilder);
        return new results_1.ExpressionResult(ucfg_builders_1._undefined());
    }
    else if (lhs.type === 'ObjectPattern' || lhs.type === 'ArrayPattern') {
        utils_destructuring_1.resolveDestructuring(lhsResult, rhsUxpr, blockBuilder, lhs);
        return new results_1.ExpressionResult(ucfg_builders_1._undefined());
    }
    return new results_1.ExpressionResult(rhsUxpr);
}
exports.handleAssignmentLike = handleAssignmentLike;
//# sourceMappingURL=utils-assignments.js.map