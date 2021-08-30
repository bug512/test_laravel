"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSequenceExpression = void 0;
function handleSequenceExpression(node, _ucfgBuilder, _blockBuilder, childResults, _ctx) {
    const { expressions } = node;
    return childResults.get(expressions[expressions.length - 1]);
}
exports.handleSequenceExpression = handleSequenceExpression;
//# sourceMappingURL=handleSequenceExpression.js.map