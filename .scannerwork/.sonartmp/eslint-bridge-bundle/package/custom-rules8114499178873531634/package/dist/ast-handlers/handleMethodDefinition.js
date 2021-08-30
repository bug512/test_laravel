"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMethodDefinition = void 0;
const results_1 = require("./results");
const utils_member_expressions_1 = require("./utils-member-expressions");
function handleMethodDefinition(methodDefinition, _ucfgBuilder, blockBuilder, childResults, _ctx) {
    const nameExpr = utils_member_expressions_1.convertMemberExpressionPropertyToExpression(methodDefinition.computed, childResults.get(methodDefinition.key), blockBuilder);
    return new results_1.MethodDefinitionResult(nameExpr, childResults.get(methodDefinition.value).toExpression());
}
exports.handleMethodDefinition = handleMethodDefinition;
//# sourceMappingURL=handleMethodDefinition.js.map