"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleVariableDeclaration = void 0;
const results_1 = require("./results");
function handleVariableDeclaration(declaration, _ucfgBuilder, _blockBuilder, childResults) {
    const declaratorResults = childResults.getArray(declaration.declarations);
    return new results_1.VariableDeclarationResult(declaratorResults);
}
exports.handleVariableDeclaration = handleVariableDeclaration;
//# sourceMappingURL=handleVariableDeclaration.js.map