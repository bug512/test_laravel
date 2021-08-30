"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAssignmentExpression = void 0;
const backend_1 = require("../backend");
const ucfg_builders_1 = require("../ucfg-builders");
const results_1 = require("./results");
const utils_assignments_1 = require("./utils-assignments");
function handleAssignmentExpression(node, _ucfgBuilder, blockBuilder, childResults) {
    const { left: lhsNode, right: rhsNode, operator } = node;
    const lhsRes = childResults.get(lhsNode);
    const rhsRes = childResults.get(rhsNode);
    if (operator === '=') {
        return utils_assignments_1.handleAssignmentLike(lhsNode, lhsRes, rhsRes, blockBuilder);
    }
    if (operator === '+=') {
        const operands = [lhsRes.toExpression(), rhsRes.toExpression()];
        const res = backend_1.concat(operands, blockBuilder, node.loc);
        return utils_assignments_1.handleAssignmentLike(lhsNode, lhsRes, new results_1.ExpressionResult(res), blockBuilder);
    }
    if (['??=', '||='].includes(operator)) {
        return utils_assignments_1.handleAssignmentLike(lhsNode, lhsRes, rhsRes, childResults.getExitBlockBuilder(rhsNode));
    }
    if (operator === '&&=') {
        // Similar to the handling of logical expressions:
        // We treat the `&&` specially: in `a &&= b`, if `a` is returned, then it's falsy,
        // but falsy values cannot be tainted.
        return utils_assignments_1.handleAssignmentLike(lhsNode, lhsRes, rhsRes, blockBuilder);
    }
    return new results_1.ExpressionResult(ucfg_builders_1._undefined());
}
exports.handleAssignmentExpression = handleAssignmentExpression;
//# sourceMappingURL=handleAssignmentExpression.js.map