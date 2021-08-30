"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleForInStatement = void 0;
const ucfg_builders_1 = require("../ucfg-builders");
const results_1 = require("./results");
function handleForInStatement(forInStatement, _ucfgBuilder, _blockBuilder, childResults) {
    const left = forInStatement.left;
    let fragment;
    let identifierResult;
    if (left.type === 'VariableDeclaration') {
        const variableDeclaratorRes = childResults.get(left).variableDeclaratorResults[0];
        identifierResult = variableDeclaratorRes.identifierResult;
        fragment = variableDeclaratorRes.fragment;
    }
    else if (left.type === 'Identifier') {
        identifierResult = childResults.get(left);
        fragment = identifierResult.fragment;
    }
    if (identifierResult && fragment) {
        fragment.assignExpr(identifierResult.lValues[0], ucfg_builders_1.iter(), left.loc);
    }
    return new results_1.UndefinedResult();
}
exports.handleForInStatement = handleForInStatement;
//# sourceMappingURL=handleForInStatement.js.map