"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleTaggedTemplateExpression = void 0;
const backend = __importStar(require("../backend"));
const ucfg_builders_1 = require("../ucfg-builders");
const utils_calls_1 = require("./utils-calls");
function handleTaggedTemplateExpression(node, ucfgBuilder, blockBuilder, childResults, ctx) {
    const { tag, quasi } = node;
    const { quasis, expressions } = childResults.get(quasi);
    const quasisArray = backend.emptyArray('quasis', blockBuilder);
    for (const q of quasis) {
        blockBuilder.call('void_q', '__arrayAdd', [quasisArray, ucfg_builders_1.last(), q]);
    }
    const args = [quasisArray, ...expressions];
    if (tag.type === 'Identifier') {
        return utils_calls_1.handleFunctionCall(tag, args, ucfgBuilder, blockBuilder, childResults, ctx, node.loc);
    }
    else if (tag.type === 'MemberExpression') {
        return utils_calls_1.handleMethodCall(tag, args, ucfgBuilder, blockBuilder, childResults, ctx, node.loc);
    }
    else {
        return utils_calls_1.handleExpressionCall(tag, args, ucfgBuilder, blockBuilder, childResults, ctx, node.loc);
    }
}
exports.handleTaggedTemplateExpression = handleTaggedTemplateExpression;
//# sourceMappingURL=handleTaggedTemplateExpression.js.map