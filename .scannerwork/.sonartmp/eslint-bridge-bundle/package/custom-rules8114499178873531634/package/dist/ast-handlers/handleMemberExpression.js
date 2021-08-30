"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMemberExpression = void 0;
const utils_member_expressions_1 = require("./utils-member-expressions");
function handleMemberExpression(memberExpr, _ucfgBuilder, blockBuilder, childResults, ctx) {
    return utils_member_expressions_1.handleMemberExpressionLike(memberExpr, blockBuilder, childResults, ctx);
}
exports.handleMemberExpression = handleMemberExpression;
//# sourceMappingURL=handleMemberExpression.js.map