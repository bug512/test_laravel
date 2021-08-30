"use strict";
/*
 * Copyright (C) 2020-2020 SonarSource SA
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
exports.handleExportAssignment = exports.handleImportEquals = exports.asImportSource = exports.handleImportExpression = exports.handleImportDeclaration = exports.handleImportDefaultSpecifier = exports.handleImportNamespaceSpecifier = exports.handleImportSpecifier = exports.handleExportAllDeclaration = exports.handleExportSpecifier = exports.handleExportDefaultDeclaration = exports.handleExportNamedDeclaration = exports.importModule = void 0;
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
const backend = __importStar(require("../backend"));
const ucfg_builders_1 = require("../ucfg-builders");
const ucfg_id_1 = require("../ucfg-id");
const utils_1 = require("../utils");
const results_1 = require("./results");
const EXPORTS = 'exports';
/**
 * Helper method that handles both cases of importing user-defined and stubbed modules.
 *
 * It's supposed to be used with `UcfgBuilder`s `getOrElseUpdateSharedImport`, together
 * these methods ensure that import a module at most once per file, so that it's not
 * duplicated if there are multiple imports / re-exports referring to the same module.
 */
function importModule(ucfgBuilder, blockBuilder, ctx, loc) {
    return (source) => {
        const resolved = ctx.resolveModule(source);
        console.log(`DEBUG Resolved '${source}' as '${resolved}'`);
        console.log(`DEBUG      ... '${source}' was imported in '${ctx.ruleContext.getFilename()}'`);
        if (resolved) {
            return importUserDefinedModule(source, resolved, ucfgBuilder, blockBuilder, loc);
        }
        else {
            return importBuiltInModule(source, ucfgBuilder, blockBuilder, ctx, loc);
        }
    };
}
exports.importModule = importModule;
function importUserDefinedModule(importSource, resolved, ucfgBuilder, blockBuilder, loc) {
    const importsFragmentBuilder = utils_1.assertIsDefinedNonNull(ucfgBuilder.getFragmentBuilder('shared-imports'), 'The fragment builder for shared imports must always be defined');
    const shortenedNameHint = shortenImportSource(importSource);
    const ucfgId = ucfg_id_1.ucfgIdForModule(resolved);
    const varNameWithHint = `usrMod-${shortenedNameHint}`;
    const moduleVar = importsFragmentBuilder.call(varNameWithHint, '__includeModule', [ucfg_builders_1.stringLiteral(ucfgId)], {});
    backend.objectAssign(ucfg_builders_1.vbl(backend.ENV), ucfg_builders_1.fieldAccess(moduleVar, backend.MODULE_ENV), blockBuilder, loc);
    return moduleVar;
}
function importBuiltInModule(importSource, ucfgBuilder, blockBuilder, ctx, loc) {
    ctx.frameworkClassifier.addImportHint(importSource);
    const importsFragmentBuilder = utils_1.assertIsDefinedNonNull(ucfgBuilder.getFragmentBuilder('shared-imports'), 'The fragment builder for shared imports must always be defined');
    const shortenedNameHint = shortenImportSource(importSource);
    const globalBuiltins = backend.globalContextBuiltins(ucfgBuilder, blockBuilder);
    const varNameWithHint = `stub-${shortenedNameHint}`;
    return importsFragmentBuilder.dynamicCall(varNameWithHint, ucfg_builders_1.fieldAccess(globalBuiltins, 'require'), [ucfg_builders_1._undefined(), ucfg_builders_1._undefined(), ucfg_builders_1.stringLiteral(importSource)], {}, undefined, loc);
}
/**
 * Creates a human-readable short hint, suitable as variable prefix,
 * from an import source (i.e. module reference, as used inside `import` or `require`).
 */
function shortenImportSource(importSource) {
    // delete everything until last slash, retain only a-z and dashes.
    return importSource
        .toLowerCase()
        .replace(/.*\//g, '')
        .replace(/[^a-z-]/g, '');
}
/** Handlers for ES6 `import`/`export` clauses. */
function handleExportNamedDeclaration(clause, ucfgBuilder, blockBuilder, childResults, context) {
    const decl = clause.declaration;
    if (!decl) {
        if (clause.source) {
            // Unsure if it can be something other than Literal
            if (clause.source.type === 'Literal') {
                const source = asImportSource(clause.source.value);
                handleNamedReexports(clause, source, ucfgBuilder, blockBuilder, childResults, context, clause.loc);
            }
        }
        else {
            handleNamedExports(clause, blockBuilder, childResults, clause.loc);
        }
    }
    else if (decl.type === 'FunctionDeclaration') {
        handleNamedFunctionDeclaration(decl, blockBuilder, childResults, clause.loc);
    }
    else if (decl.type === 'ClassDeclaration') {
        handleNamedClassDeclaration(decl, blockBuilder, childResults, clause.loc);
    }
    else if (decl.type === 'VariableDeclaration') {
        handleNamedVariableDeclaration(decl, blockBuilder, childResults, clause.loc);
    }
    // Can happen: `export type Foo = {};` results in TSTypeAliasTypeDeclaration etc.
    return new results_1.UndefinedResult();
}
exports.handleExportNamedDeclaration = handleExportNamedDeclaration;
function handleNamedExports(clause, blockBuilder, childResults, loc) {
    // It's the `export { x as y }`-case, `x` is referencing some value.
    for (const specifier of clause.specifiers) {
        const specifierResult = childResults.get(specifier);
        blockBuilder.assignExpr(ucfg_builders_1.fieldAccess(EXPORTS, specifierResult.exportedName), specifierResult.localExpr, loc);
    }
}
function handleNamedReexports(clause, source, ucfgBuilder, blockBuilder, childResults, context, loc) {
    // It's the `export { x as y } from 'z'`-case, `x` is just a property name.
    // Note that in re-exports, the `z` is actually treated as if it were yet another
    // import.
    const importedModuleVar = ucfgBuilder.getOrElseUpdateSharedImport(source, importModule(ucfgBuilder, blockBuilder, context, clause.loc));
    for (const specifier of clause.specifiers) {
        const specifierResult = childResults.get(specifier);
        blockBuilder.assignExpr(ucfg_builders_1.fieldAccess(EXPORTS, specifierResult.exportedName), ucfg_builders_1.fieldAccess(importedModuleVar, specifierResult.localName), loc);
    }
}
function handleNamedFunctionDeclaration(decl, blockBuilder, childResults, loc) {
    const { name, functionValueVbl } = childResults.get(decl);
    /* istanbul ignore else */
    if (name) {
        blockBuilder.assignExpr(ucfg_builders_1.fieldAccess(EXPORTS, name), functionValueVbl, loc);
    }
    else {
        // There can be nameless function declarations, but they occur only in `ExportDefaultDeclaration`s
        // 1. Should not occur: nameless function declarations should not occur inside of `ExportNamedDeclaration`s
        // 2. Harmless: the worst thing that can happen is that we omit a declaration.
    }
}
function handleNamedClassDeclaration(decl, blockBuilder, childResults, loc) {
    const { name, classValueVbl } = childResults.get(decl);
    /* istanbul ignore else */
    if (name) {
        blockBuilder.assignExpr(ucfg_builders_1.fieldAccess('exports', name), classValueVbl, loc);
    }
    else {
        // There can be nameless class declarations, but they occur only in `ExportDefaultDeclaration`s
        // 1. Should not occur: nameless class declarations should not occur inside of `ExportNamedDeclaration`s
        // 2. Harmless: the worst thing that can happen is that we omit a declaration.
    }
}
function handleNamedVariableDeclaration(decl, blockBuilder, childResults, loc) {
    const { exportableDeclarators } = childResults.get(decl);
    for (const { exportableName, value } of exportableDeclarators) {
        blockBuilder.assignExpr(ucfg_builders_1.fieldAccess('exports', exportableName), value, loc);
    }
}
function handleExportDefaultDeclaration(exportDefaultDecl, _ucfgBuilder, blockBuilder, childResults, _context) {
    const resultExpr = childResults.get(exportDefaultDecl.declaration).toExpression();
    blockBuilder.assignExpr(ucfg_builders_1.fieldAccess('exports', 'default'), resultExpr, exportDefaultDecl.loc);
    return new results_1.UndefinedResult();
}
exports.handleExportDefaultDeclaration = handleExportDefaultDeclaration;
function handleExportSpecifier(exportSpecifier, _ucfgBuilder, _blockBuilder, childResults, _context) {
    const localVbl = childResults.get(exportSpecifier.local).toExpression();
    return new results_1.ExportSpecifierResult(exportSpecifier.local.name, exportSpecifier.exported.name, localVbl);
}
exports.handleExportSpecifier = handleExportSpecifier;
function handleExportAllDeclaration(decl, ucfgBuilder, blockBuilder, _childResults, context) {
    var _a;
    // source is probably always a Literal
    if (decl.exported && ((_a = decl.source) === null || _a === void 0 ? void 0 : _a.type) === 'Literal') {
        const source = asImportSource(decl.source.value);
        const importedModule = ucfgBuilder.getOrElseUpdateSharedImport(source, importModule(ucfgBuilder, blockBuilder, context, decl.loc));
        blockBuilder.assignExpr(ucfg_builders_1.fieldAccess(EXPORTS, decl.exported.name), importedModule, decl.loc);
    }
    // The `export * from 'm'` will be handled later.
    return new results_1.UndefinedResult();
}
exports.handleExportAllDeclaration = handleExportAllDeclaration;
function handleImportSpecifier(importSpec, _ucfgBuilder, _blockBuilder, childResults, _ctx) {
    const localRes = childResults.get(importSpec.local);
    return new results_1.ImportSpecifierResult(importSpec.imported.name, localRes);
}
exports.handleImportSpecifier = handleImportSpecifier;
function handleImportNamespaceSpecifier(importSpec, _ucfgBuilder, _blockBuilder, childResults, _ctx) {
    const localRes = childResults.get(importSpec.local);
    return new results_1.ImportNamespaceSpecifierResult(localRes);
}
exports.handleImportNamespaceSpecifier = handleImportNamespaceSpecifier;
function handleImportDefaultSpecifier(importSpec, _ucfgBuilder, _blockBuilder, childResults, _ctx) {
    const localRes = childResults.get(importSpec.local);
    return new results_1.ImportDefaultSpecifierResult(localRes);
}
exports.handleImportDefaultSpecifier = handleImportDefaultSpecifier;
function handleImportDeclaration(importDecl, ucfgBuilder, blockBuilder, childResults, ctx) {
    if ('importKind' in importDecl && importDecl['importKind'] === 'type') {
        // Type imports are for TS-compile time only,
        // clauses like `import type { Foo } from 'bar'` are erased at runtime,
        // ignore it for now.
        return new results_1.UndefinedResult();
    }
    const source = asImportSource(importDecl.source.value);
    const moduleVar = ucfgBuilder.getOrElseUpdateSharedImport(source, importModule(ucfgBuilder, blockBuilder, ctx, importDecl.loc));
    for (const specifier of importDecl.specifiers) {
        if (specifier.type === 'ImportSpecifier') {
            // The `imported as local` in `import { imported as local } from 'moduleName'`
            const importSpecRes = childResults.get(specifier);
            blockBuilder.assignExpr(importSpecRes.local.lValues[0], ucfg_builders_1.fieldAccess(moduleVar, importSpecRes.imported), importDecl.loc);
        }
        else if (specifier.type === 'ImportDefaultSpecifier') {
            // The `local` in `import local from 'moduleName'`
            const importDefSpecRes = childResults.get(specifier);
            const extractedDefault = blockBuilder.call('default', backend.IMPORT_DEFAULT, [
                ucfg_builders_1._undefined(),
                moduleVar,
            ]);
            blockBuilder.assignExpr(importDefSpecRes.local.lValues[0], extractedDefault, importDecl.loc);
        }
        else {
            // The `local` in `import * as local from 'moduleName'`
            const importNsSpecRes = childResults.get(specifier);
            blockBuilder.assignExpr(importNsSpecRes.local.lValues[0], moduleVar, importDecl.loc);
        }
    }
    return new results_1.UndefinedResult();
}
exports.handleImportDeclaration = handleImportDeclaration;
function handleImportExpression(node, ucfgBuilder, blockBuilder, _childResults, ctx) {
    const source = node.source;
    if (source && source.type === 'Literal' && source.value) {
        const moduleVar = ucfgBuilder.getOrElseUpdateSharedImport(asImportSource(source.value), importModule(ucfgBuilder, blockBuilder, ctx, node.loc));
        return new results_1.ExpressionResult(moduleVar);
    }
    else {
        // Temporary workaround
        //
        // Handle resolving of dynamic source
        return new results_1.ExpressionResult(ucfg_builders_1._undefined());
    }
}
exports.handleImportExpression = handleImportExpression;
function asImportSource(sourceValue) {
    return ((sourceValue === null || sourceValue === void 0 ? void 0 : sourceValue.toString()) || '__invalid-import-source__');
}
exports.asImportSource = asImportSource;
function handleImportEquals(tsNode, ucfgBuilder, blockBuilder, childResults, ctx) {
    const { moduleReference } = tsNode;
    if (moduleReference.type === experimental_utils_1.AST_NODE_TYPES.TSExternalModuleReference &&
        moduleReference.expression.type === 'Literal') {
        const source = moduleReference.expression.value;
        const importedModuleVar = ucfgBuilder.getOrElseUpdateSharedImport(asImportSource(source), importModule(ucfgBuilder, blockBuilder, ctx, tsNode.loc));
        const { lValues: [lValue], } = childResults.get(tsNode.id);
        blockBuilder.assignExpr(lValue, importedModuleVar, tsNode.loc);
    }
    return new results_1.UndefinedResult();
}
exports.handleImportEquals = handleImportEquals;
function handleExportAssignment(exportAssignment, _ucfgBuilder, blockBuilder, childResults, _ctx) {
    const exportedValue = childResults
        .get(exportAssignment.expression)
        .toExpression();
    blockBuilder.assignExpr(ucfg_builders_1.fieldAccess('module', 'exports'), exportedValue, exportAssignment.loc);
    return new results_1.UndefinedResult();
}
exports.handleExportAssignment = handleExportAssignment;
//# sourceMappingURL=module-systems.js.map