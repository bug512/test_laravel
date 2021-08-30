"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAwaitExpression = void 0;
function handleAwaitExpression(awaitExpression, _ucfgBuilder, blockBuilder, childReturns) {
    const { argument } = awaitExpression;
    return childReturns.get(argument);
}
exports.handleAwaitExpression = handleAwaitExpression;
//# sourceMappingURL=handleAwaitExpression.js.map