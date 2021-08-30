"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleChainExpression = void 0;
function handleChainExpression(node, _ucfgBuilder, _blockBuilder, childResults, _ctx) {
    const { expression } = node;
    return childResults.get(expression);
}
exports.handleChainExpression = handleChainExpression;
//# sourceMappingURL=handleChainExpression.js.map