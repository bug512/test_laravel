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
exports.handleProgram = void 0;
const backend = __importStar(require("../backend"));
const ucfg_builders_1 = require("../ucfg-builders");
const ucfg_id_1 = require("../ucfg-id");
const results_1 = require("./results");
const utils_environments_1 = require("./utils-environments");
function handleProgram(node, ucfgBuilder, blockBuilder, ctx) {
    ucfgBuilder.setMethodId(ucfg_id_1.ucfgIdForModule(ctx.ruleContext.getFilename()));
    if (ctx.includePreamble) {
        let preambleBuilder;
        const maybeUcfgPreambleBuilder = ucfgBuilder.getFragmentBuilder('preamble');
        /* istanbul ignore else */
        if (maybeUcfgPreambleBuilder) {
            preambleBuilder = maybeUcfgPreambleBuilder;
        }
        else {
            // impossible. A `Program`'s UCFG builder always includes a fragment builder
            // for function hoisting, used here for the sake of preamble generation.
            preambleBuilder = blockBuilder.beginFragment();
        }
        preambleBuilder.assignNewObject(backend.ENV, 'Object');
        preambleBuilder.assignNewObject(ucfg_builders_1.fieldAccess(backend.ENV, 'global'), 'Object');
        preambleBuilder.assignNewObject('module', 'Object');
        preambleBuilder.assignExpr(ucfg_builders_1.fieldAccess('module', 'exports'), ucfg_builders_1._this());
        preambleBuilder.assignExpr('exports', ucfg_builders_1._this());
    }
    const scopeFragmentBuilder = utils_environments_1.getScopeFragmentBuilder(ucfgBuilder, blockBuilder);
    utils_environments_1.createScopeIfNecessary(node, scopeFragmentBuilder, ctx);
    return () => new results_1.UndefinedResult();
}
exports.handleProgram = handleProgram;
//# sourceMappingURL=handleProgram.js.map