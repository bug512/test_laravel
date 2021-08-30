"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleObjectPattern = void 0;
const results_1 = require("./results");
function handleObjectPattern(node, _ucfgBuilder, _blockBuilder, childResults) {
    const { properties } = node;
    return new results_1.ObjectPatternResult(properties.map(p => ({ syntacticNode: p, patternResult: childResults.get(p) })));
}
exports.handleObjectPattern = handleObjectPattern;
//# sourceMappingURL=handleObjectPattern.js.map