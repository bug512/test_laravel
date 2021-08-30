"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSpreadElement = void 0;
function handleSpreadElement(node, _ucfgBuilder, _blockBuilder, childResults, _ctx) {
    const { argument } = node;
    return childResults.get(argument);
}
exports.handleSpreadElement = handleSpreadElement;
//# sourceMappingURL=handleSpreadElement.js.map