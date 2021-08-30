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
exports.processIdentifierInRefPosition = exports.varAsLvalue = exports.refAsLValue = exports.handleIdentifierLike = void 0;
const _1 = require(".");
const backend = __importStar(require("../backend"));
const framework_classifier_1 = require("../framework-classifier");
const lexical_structure_1 = require("../lexical-structure");
const ucfg_builders_1 = require("../ucfg-builders");
const utils_1 = require("../utils");
function handleIdentifierLike(identifier, ucfgBuilder, blockBuilder, ctx) {
    // The following conditional statement should better be replaced by
    // proper binding of the `module` and `exports` variables at module scope;
    // Like this, it will not work when `module` and `exports` are used from
    // inside of functions instead of at top-level of a module.
    if (identifier.name === 'module' || identifier.name === 'exports') {
        return new _1.IdentifierResult(identifier.name, [ucfg_builders_1.vbl(identifier.name)]);
    }
    const lexStruct = ctx.lexicalStructure;
    const resolvedAsRef = lexStruct.resolveRefInUcfg(identifier);
    if (resolvedAsRef) {
        return new _1.IdentifierResult(identifier.name, [refAsLValue(resolvedAsRef, ucfgBuilder, blockBuilder)], blockBuilder.beginFragment());
    }
    const resolvedAsVar = lexStruct.resolveVarsInUcfg(identifier);
    if (resolvedAsVar) {
        return new _1.IdentifierResult(identifier.name, resolvedAsVar.map(varAsLvalue));
    }
    // Renaming with object destructuring introduces identifiers that cannot be resolved
    // with the lexical structure, e.g. `f` in `{ f: foo } = obj`. Those aren't marked as
    // "unresolved" for the sake of pattern matching object destructuring.
    const ancestors = ctx.ruleContext.getAncestors();
    const parent = ancestors.pop();
    const grandparent = ancestors.pop();
    if ((parent === null || parent === void 0 ? void 0 : parent.type) === 'Property' &&
        parent.key === identifier &&
        (grandparent === null || grandparent === void 0 ? void 0 : grandparent.type) === 'ObjectPattern') {
        return new _1.IdentifierResult(identifier.name, [ucfg_builders_1.vbl(identifier.name)]);
    }
    if (identifier.type === 'JSXIdentifier' &&
        ctx.frameworkClassifier.getClassificationLabel() === framework_classifier_1.FrameworkClassificationLabel.React &&
        utils_1.startsWithLowerCase(identifier.name)) {
        // Temporary workaround
        //
        // Identifiers for built-in HTML tags require a naming convention with the stub system (SONARSEC-2392).
        return new _1.IdentifierResult(identifier.name, [ucfg_builders_1.vbl(identifier.name)]);
    }
    return new _1.IdentifierResult(identifier.name, [ucfg_builders_1.vbl(`!unresolved_id:${identifier.name}!`)]);
}
exports.handleIdentifierLike = handleIdentifierLike;
/**
 * Emits the instructions for an identifier that has been resolved as a reference.
 * The resulting expression can be both read and written into.
 */
function refAsLValue(resolvedAsRef, ucfgBuilder, builder) {
    if (resolvedAsRef instanceof lexical_structure_1.RefOuter) {
        const scopeName = lexical_structure_1.scopeIdToName(resolvedAsRef.scopeId);
        const scopeFetch = builder.expr(`sc-${resolvedAsRef.scopeId}`, ucfg_builders_1.fieldAccess(backend.ENV, scopeName), '');
        return ucfg_builders_1.fieldAccess(scopeFetch, resolvedAsRef.varName);
    }
    else if (resolvedAsRef instanceof lexical_structure_1.RefLocalOnStack) {
        return ucfg_builders_1.vbl(resolvedAsRef.varName);
    }
    else if (resolvedAsRef instanceof lexical_structure_1.RefLocalOnScope) {
        const scopeName = lexical_structure_1.scopeIdToName(resolvedAsRef.scopeId);
        return ucfg_builders_1.fieldAccess(scopeName, resolvedAsRef.varName);
    }
    else if (resolvedAsRef instanceof lexical_structure_1.RefGlobal) {
        // Global, user defined
        const scopeFetch = backend.globalContext(ucfgBuilder, builder);
        return ucfg_builders_1.fieldAccess(scopeFetch, resolvedAsRef.varName);
    }
    else {
        // Global, built-in
        const globalBuiltins = backend.globalContextBuiltins(ucfgBuilder, builder);
        return ucfg_builders_1.fieldAccess(globalBuiltins, resolvedAsRef.varName);
    }
}
exports.refAsLValue = refAsLValue;
/**
 * Constructs an `LValue` for an identifier that has been resolved as variable.
 *
 * Returns either property fetch or a variable, does not emit any instructions.
 */
function varAsLvalue(resolvedAsVar) {
    if (resolvedAsVar.isScopeAllocated) {
        const scopeName = lexical_structure_1.scopeIdToName(resolvedAsVar.effectiveBinding.effectiveScopeId);
        return ucfg_builders_1.fieldAccess(scopeName, resolvedAsVar.effectiveBinding.effectiveName);
    }
    else {
        return ucfg_builders_1.vbl(resolvedAsVar.effectiveBinding.effectiveName);
    }
}
exports.varAsLvalue = varAsLvalue;
function processIdentifierInRefPosition(identifier, ucfgBuilder, builder, lexStruct) {
    const resolvedAsRef = lexStruct.resolveRefInUcfg(identifier);
    /* istanbul ignore else */
    if (resolvedAsRef) {
        return refAsLValue(resolvedAsRef, ucfgBuilder, builder);
    }
    else {
        // 1. Should not happen: this method should be used only if we are sure
        //    that we are dealing with an identifier in reference position.
        // 2. If it happens: doesn't matter, then we have just one more variable
        //    that doesn't point to anything.
        return ucfg_builders_1.vbl(identifier.name);
    }
}
exports.processIdentifierInRefPosition = processIdentifierInRefPosition;
//# sourceMappingURL=utils-identifiers.js.map