"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleThis = void 0;
const ucfg_builders_1 = require("../ucfg-builders");
const results_1 = require("./results");
const utils_this_1 = require("./utils-this");
function handleThis(_node, _ucfgBuilder, _blockBuilder, _childResults, ctx) {
    const firstThisBindingAncestor = utils_this_1.findFirstThisBinderAncestor(ctx.ruleContext.getAncestors().reverse());
    if (firstThisBindingAncestor && firstThisBindingAncestor.type === 'ArrowFunctionExpression') {
        return new results_1.ExpressionResult(ctx.envAllocationStrategy.fetchLexicalThis(ctx.lexicalThisState));
    }
    else {
        return new results_1.ExpressionResult(ucfg_builders_1._this());
    }
}
exports.handleThis = handleThis;
//# sourceMappingURL=handleThis.js.map