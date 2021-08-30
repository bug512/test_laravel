"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleTemplateElement = void 0;
const ucfg_builders_1 = require("../ucfg-builders");
const results_1 = require("./results");
function handleTemplateElement(node, _ucfgBuilder, _blockBuilder) {
    const value = node.value.cooked;
    return new results_1.ExpressionResult(ucfg_builders_1.stringLiteral(value));
}
exports.handleTemplateElement = handleTemplateElement;
//# sourceMappingURL=handleTemplateElement.js.map