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
exports.handleLiteral = void 0;
const backend = __importStar(require("../backend"));
const ucfg_builders_1 = require("../ucfg-builders");
const results_1 = require("./results");
function handleLiteral(lit, _ucfgBuilder, blockBuilder) {
    if (typeof lit.value === 'string') {
        return new results_1.ExpressionResult(backend.stringLiteral(lit.value, blockBuilder));
    }
    else if (typeof lit.value === 'number') {
        return new results_1.ExpressionResult(backend.intLiteral(lit.value, blockBuilder));
    }
    else if (typeof lit.value === 'boolean') {
        const boolAsInt = lit.value ? 1 : 0;
        return new results_1.ExpressionResult(backend.intLiteral(boolAsInt, blockBuilder));
    }
    // Temporary workaround [no ticket id] (At least RegEx must be handled)
    return new results_1.ExpressionResult(ucfg_builders_1._undefined());
}
exports.handleLiteral = handleLiteral;
//# sourceMappingURL=handleLiteral.js.map