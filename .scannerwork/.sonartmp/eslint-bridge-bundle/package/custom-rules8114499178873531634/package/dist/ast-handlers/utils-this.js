"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.findFirstThisBinderAncestor = void 0;
function findFirstThisBinderAncestor(ancestors) {
    return ancestors.find(node => ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(node.type));
}
exports.findFirstThisBinderAncestor = findFirstThisBinderAncestor;
//# sourceMappingURL=utils-this.js.map