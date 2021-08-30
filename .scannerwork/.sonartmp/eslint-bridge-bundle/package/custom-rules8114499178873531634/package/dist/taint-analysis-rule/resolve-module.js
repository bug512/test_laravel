"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveModule = void 0;
const typescript_1 = __importDefault(require("typescript"));
const fs_1 = require("fs");
const path_1 = require("path");
function resolveModule(moduleName, context) {
    var _a, _b;
    const program = (_a = context.parserServices) === null || _a === void 0 ? void 0 : _a.program;
    /* istanbul ignore if */
    if (!program) {
        // 1. Rare: the only seen occurrence so far is caused by lack of configuration in test
        //          code in a benchmark project, in a directory that would usually be excluded from
        //          analysis.
        // 2. Inconsequential: a single unresolved module wouldn't affect anything else.
        return undefined;
    }
    const compilerOptions = program.getCompilerOptions();
    const filename = context.getFilename();
    const host = typescript_1.default.createCompilerHost(compilerOptions);
    const resolved = typescript_1.default.resolveModuleName(moduleName, filename, compilerOptions, host);
    const resolvedName = (_b = resolved.resolvedModule) === null || _b === void 0 ? void 0 : _b.resolvedFileName;
    const resolvedNameFixCase = resolvedName ? fs_1.realpathSync.native(resolvedName) : undefined;
    if (resolvedNameFixCase && resolvedNameFixCase.split(path_1.sep).includes('node_modules')) {
        // ignore everything from `node_modules`, redirect to stub system.
        return undefined;
    }
    return resolvedNameFixCase;
}
exports.resolveModule = resolveModule;
//# sourceMappingURL=resolve-module.js.map