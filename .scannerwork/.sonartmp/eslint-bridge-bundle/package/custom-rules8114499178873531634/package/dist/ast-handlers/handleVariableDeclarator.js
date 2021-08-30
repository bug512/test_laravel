"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleVariableDeclarator = void 0;
const ucfg_builders_1 = require("../ucfg-builders");
const results_1 = require("./results");
const utils_assignments_1 = require("./utils-assignments");
function handleVariableDeclarator(decl, _ucfgBuilder, blockBuilder, childResults) {
    const lhsNode = decl.id;
    const rhsNode = decl.init;
    if (rhsNode) {
        const lhsRes = childResults.get(lhsNode);
        const rhsRes = childResults.get(rhsNode);
        const asgnRes = utils_assignments_1.handleAssignmentLike(lhsNode, lhsRes, rhsRes, blockBuilder);
        if (lhsNode.type === 'Identifier') {
            return new results_1.VariableDeclaratorResult(asgnRes.expression, lhsNode.name);
        }
        else {
            return new results_1.VariableDeclaratorResult(asgnRes.expression);
        }
    }
    if (lhsNode.type === 'Identifier') {
        /*
          RHS node can be missing on variable declarators of "for-in" and "for-of" loops.
          In this case, the initializer will only be computed on exit of the loop node.
          We begin a BlockBuilder fragment here to ensure the assignment is made in the correct UCFG block.
        */
        const fragment = blockBuilder.beginFragment();
        return new results_1.VariableDeclaratorResult(ucfg_builders_1._undefined(), lhsNode.name, childResults.get(lhsNode), fragment);
    }
    return new results_1.VariableDeclaratorResult(ucfg_builders_1._undefined());
}
exports.handleVariableDeclarator = handleVariableDeclarator;
//# sourceMappingURL=handleVariableDeclarator.js.map