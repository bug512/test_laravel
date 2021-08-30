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
exports.handleArrayExpression = void 0;
const backend = __importStar(require("../backend"));
const ucfg_builders_1 = require("../ucfg-builders");
const results_1 = require("./results");
// Hardcoded limit on array length to avoid performance issues
const MAX_ARRAY_LENGTH = 16;
function handleArrayExpression(arrayExpr, ucfgBuilder, blockBuilder, childResults) {
    const res = backend.emptyArray('array', blockBuilder, arrayExpr.loc);
    for (let i = 0; i < Math.min(arrayExpr.elements.length, MAX_ARRAY_LENGTH); i++) {
        const elemNode = arrayExpr.elements[i];
        if (elemNode) {
            const elemRes = childResults.get(elemNode).toExpression();
            if (elemNode.type === 'SpreadElement') {
                blockBuilder.call('void', '__arrayAddAll', [res, ucfg_builders_1.last(), elemRes], {}, undefined, elemNode.loc);
            }
            else {
                blockBuilder.call('void', '__arrayAdd', [res, ucfg_builders_1.last(), elemRes], {}, undefined, elemNode.loc);
            }
        }
        else {
            blockBuilder.call('void', '__arrayAdd', [res, ucfg_builders_1.last(), ucfg_builders_1._undefined()], {});
        }
    }
    const globalBuiltins = backend.globalContextBuiltins(ucfgBuilder, blockBuilder);
    const singletonArrayConstructor = blockBuilder.expr('arrayCons', ucfg_builders_1.fieldAccess(globalBuiltins, 'Array'));
    backend.setPrototype(res, ucfg_builders_1.fieldAccess(singletonArrayConstructor, 'prototype'), blockBuilder);
    return new results_1.ExpressionResult(res);
}
exports.handleArrayExpression = handleArrayExpression;
//# sourceMappingURL=handleArrayExpression.js.map