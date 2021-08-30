"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleReturn = void 0;
const ucfg_builders_1 = require("../ucfg-builders");
const results_1 = require("./results");
function handleReturn(retStmt, _ucfgBuilder, blockBuilder, childResults, _ctx) {
    const res = retStmt.argument ? childResults.get(retStmt.argument).toExpression() : ucfg_builders_1._undefined();
    blockBuilder.ret(res, retStmt.loc);
    return new results_1.UndefinedResult();
}
exports.handleReturn = handleReturn;
//# sourceMappingURL=handleReturn.js.map