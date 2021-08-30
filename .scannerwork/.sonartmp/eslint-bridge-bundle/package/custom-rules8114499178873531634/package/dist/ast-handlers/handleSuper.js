"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchSuperFromEnv = exports.handleSuper = void 0;
const backend_1 = require("../backend");
const ucfg_builders_1 = require("../ucfg-builders");
const results_1 = require("./results");
function handleSuper(_node, _ucfgBuilder, blockBuilder, _childResults, ctx) {
    return new results_1.ExpressionResult(fetchSuperFromEnv(blockBuilder, ctx));
}
exports.handleSuper = handleSuper;
function fetchSuperFromEnv(blockBuilder, ctx) {
    return blockBuilder.expr('superRef', ucfg_builders_1.fieldAccess(backend_1.ENV, ctx.lexicalSuperState.lastSuperBindingName));
}
exports.fetchSuperFromEnv = fetchSuperFromEnv;
//# sourceMappingURL=handleSuper.js.map