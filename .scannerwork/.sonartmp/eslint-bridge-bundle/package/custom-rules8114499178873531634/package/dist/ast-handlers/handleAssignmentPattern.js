"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAssignmentPattern = void 0;
const results_1 = require("./results");
const utils_assignments_1 = require("./utils-assignments");
function handleAssignmentPattern(node, _ucfgBuilder, _blockBuilder, childResults) {
    const { left, right } = node;
    utils_assignments_1.handleAssignmentLike(left, childResults.get(left), childResults.get(right), childResults.getExitBlockBuilder(right));
    return new results_1.AssignmentPatternResult(childResults.get(left), childResults.get(right));
}
exports.handleAssignmentPattern = handleAssignmentPattern;
//# sourceMappingURL=handleAssignmentPattern.js.map