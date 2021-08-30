"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRestElement = void 0;
const results_1 = require("./results");
function handleRestElement(node, _ucfgBuilder, _blockBuilder, childResults) {
    // Just propagate both the syntactic node and the result to the parent;
    // It's easier to decide in `resolveDestructuring` what to do with it.
    return new results_1.RestElementResult(node.argument, childResults.get(node.argument));
}
exports.handleRestElement = handleRestElement;
//# sourceMappingURL=handleRestElement.js.map