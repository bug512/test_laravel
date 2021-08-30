"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleArrayPattern = void 0;
const results_1 = require("./results");
function handleArrayPattern(node, _ucfgBuilder, _blockBuilder, childResults) {
    const { elements } = node;
    return new results_1.ArrayPatternResult(elements.map(e => {
        if (e === null) {
            // This can actually happen in patterns like `[,,a]`
            return null;
        }
        else {
            return { syntacticNode: e, patternResult: childResults.get(e) };
        }
    }));
}
exports.handleArrayPattern = handleArrayPattern;
//# sourceMappingURL=handleArrayPattern.js.map