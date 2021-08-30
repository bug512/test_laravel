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
exports.TaintAnalysisRuleTraversalState = exports.AstFrame = void 0;
/*
 * This file contains stack-like data structures that are used throughout
 * the analysis of a single file. These stacks are used for keeping
 * information for UCFGs and AST-nodes while their child-nodes are processed
 * by the ESLint's node traverser. The state of the stacks is shared by the callbacks
 * which are given to ESLint as `RuleListener`.
 */
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
const fs = __importStar(require("fs"));
const ast_handlers_1 = require("../ast-handlers");
const ah = __importStar(require("../ast-handlers/results"));
const backend_1 = require("../backend");
const framework_classifier_1 = require("../framework-classifier");
const id_gen_1 = require("../id-gen");
const lexical_structure_1 = require("../lexical-structure");
const ucfg_builders_1 = require("../ucfg-builders");
const ucfg_id_1 = require("../ucfg-id");
const utils_1 = require("../utils");
const options_1 = require("./options");
const resolve_module_1 = require("./resolve-module");
const save_ucfg_files_1 = require("./save-ucfg-files");
/**
 * Stack frame that knows how to resume the processing of an
 * AST element once all children were processed.
 *
 * Also holds the map with the values returned by the children.
 * This map is modified each time a child finishes processing,
 * and is then passed to the `onExit`-handler.
 */
class AstFrame {
    constructor(node, onExit, childReturns = ah.Results.empty()) {
        this.node = node;
        this.onExit = onExit;
        this.childReturns = childReturns;
    }
    addResultReturnedByChild(child, result, exitBlockBuilder) {
        this.childReturns.setEntry(child, result, exitBlockBuilder);
    }
    resume(blockBuilderAtNodeEnd) {
        return this.onExit(this.childReturns, blockBuilderAtNodeEnd);
    }
}
exports.AstFrame = AstFrame;
/**
 * Stack-element with builders required to process the current code path.
 */
class BuildersStackElement {
    constructor(ucfgBuilder, blockBuilder, bindsThis, segments = new Map()) {
        this.ucfgBuilder = ucfgBuilder;
        this.blockBuilder = blockBuilder;
        this.bindsThis = bindsThis;
        this.segments = segments;
    }
}
/**
 * Manages multiple data structures (mostly stacks) that are shared between
 * all handlers of the rule-listener; Also provides some common contextual objects
 * that are instantiated once for each analyzed file.
 */
class TaintAnalysisRuleTraversalState {
    constructor(ruleContext, emittedUcfgs, lexicalStructure, scopeNameGen, packageJsonDependencies) {
        this.ruleContext = ruleContext;
        this.emittedUcfgs = emittedUcfgs;
        this.scopeNameGen = scopeNameGen;
        /** Stack of "activation records" that belong to the traversed nodes. */
        this.astElementStack = [];
        /** Stack with current ucfg-builder and block-builder. */
        this.builderStack = [];
        /** Stack of names of environment-properties in which the innermost value of `this` is stored. */
        this.lexicalThisStack = [];
        /** Stack of names of environment-properties in which the innermost value of `super` is stored. */
        this.lexicalSuperStack = [];
        /** Flag that is set whenever we are expect to encounter an entry-block next. */
        this.isAtEntry = false;
        /**
         * Line numbers of processed comments; This is to avoid duplication of
         * preserved comments in cases where a comment belong both to parent node
         * and child node.
         */
        this.processedCommentLines = new Set();
        this.onCodePathStart = (codePath, node) => {
            const loc = node.loc;
            loc.source = this.ruleContext.getFilename();
            const shortId = this.scopeNameGen.getUcfgId(node);
            let ucfgId;
            if (node.type === 'Program') {
                ucfgId = ucfg_id_1.ucfgIdForModule(this.ruleContext.getFilename());
            }
            else {
                ucfgId = ucfg_id_1.defaultUcfgId(this.ruleContext.getFilename(), this.cwd, node, shortId);
            }
            const currentUcfgBuilder = ucfg_builders_1.beginUcfg(ucfgId, ucfg_builders_1._this(), [], loc, this.builderStack.length > 0 ? utils_1.peek(this.builderStack) : undefined);
            // Synthetic block that is kept as a back-up for
            // AST nodes that might accidentally end up outside of any code path segment.
            const dummyUcfg = ucfg_builders_1.beginUcfg('dummy-catchall-ucfg', ucfg_builders_1._this());
            const initialDummyBlock = dummyUcfg.beginBlock('dummy-catchall-block', loc);
            const bindsThis = pushLexicalThis(node, shortId, this.lexicalThisStack, this.builderStack.length, this.handlerContext);
            this.builderStack.push(new BuildersStackElement(currentUcfgBuilder, initialDummyBlock, bindsThis));
            this.isAtEntry = true;
        };
        this.onCodePathSegmentStart = (segment, node) => {
            const ucfgBuilder = this.activeUcfgBuilder();
            const blockBuilder = ucfgBuilder.beginBlock(segment.id, node.loc, this.isAtEntry);
            const topBuilders = utils_1.peek(this.builderStack);
            topBuilders.blockBuilder = blockBuilder;
            topBuilders.segments.set(segment.id, segment);
            if (this.isAtEntry) {
                initializeFragmentBuilders(ucfgBuilder, blockBuilder);
            }
            this.isAtEntry = false;
        };
        this.onCodePathSegmentEnd = (_segment, _node) => {
            // Temporary workaround [no ticket] Debug `try-finally` control flow.
            //
            // The builder for segment is deliberately not cleared.
            // For whatever reason,
            // `try { a() } finally { b() } z();`
            // does not produce any block at all for `z` to live in.
            // So, it's better it ends up in a wrong block rather than crashing everything.
            this.isAtEntry = false;
        };
        this.onCodePathEnd = (_codePath, _node) => {
            const { ucfgBuilder, segments, bindsThis } = utils_1.assertIsDefinedNonNull(this.builderStack.pop(), 'For each `pop()` there must have been a corresponding `push()`');
            addTerminatorsToBlocks(ucfgBuilder, segments, this.options.preamble);
            const newUcfg = backend_1.relocateBlocks(ucfgBuilder.build());
            this.emittedUcfgs.set(ucfgBuilder.getMethodId(), newUcfg);
            this.isAtEntry = false;
            popLexicalThis(this.lexicalThisStack, bindsThis);
            const scannerworkDir = new save_ucfg_files_1.ScannerworkDir(this.options);
            if (this.builderStack.length === 0 && this.options.emit) {
                for (const generatedUcfgBuilder of this.handlerContext.generatedUcfgBuilders) {
                    const newGeneratedUcfg = generatedUcfgBuilder.build();
                    this.emittedUcfgs.set(generatedUcfgBuilder.getMethodId(), newGeneratedUcfg);
                }
                for (const [k, v] of this.emittedUcfgs.entries()) {
                    const filePath = scannerworkDir.ucfgFilePath(k);
                    fs.writeFileSync(filePath, v.serializeBinary());
                }
            }
        };
        this.onNodeStart = (node) => {
            const handler = (ast_handlers_1.handlers[node.type] || ah.defaultHandler);
            if (this.handlerContext.preserveComments) {
                for (const comment of this.ruleContext.getSourceCode().getComments(node).leading) {
                    if (comment.type === experimental_utils_1.AST_TOKEN_TYPES.Line &&
                        !this.processedCommentLines.has(comment.loc.start.line)) {
                        this.processedCommentLines.add(comment.loc.start.line);
                        this.activeBlockBuilder().comment(comment.value);
                    }
                }
            }
            const onExit = handler(node, this.activeUcfgBuilder(), this.activeBlockBuilder(), this.handlerContext);
            const frame = new AstFrame(node, onExit);
            this.astElementStack.push(frame);
            pushSuperIfNecessary(node, this.lexicalSuperStack, this.activeUcfgBuilder().getMethodId(), this.handlerContext);
        };
        this.onNodeEnd = (node) => {
            // Finish processing an AST element:
            // - pop the stack frame,
            // - Invoke its `onExit` handler with the collected return values,
            // - add the return value to the parent frame (if present).
            // - pop the `super` from the stack, if necessary
            const frame = utils_1.assertIsDefinedNonNull(this.astElementStack.pop(), 'For each "pop"-operation, there must have been a corresponding "push"');
            const exitBlockBuilder = this.activeBlockBuilder();
            const result = frame.resume(exitBlockBuilder);
            if (this.astElementStack.length > 0) {
                utils_1.peek(this.astElementStack).addResultReturnedByChild(node, result, exitBlockBuilder);
            }
            popSuperIfNecessary(node, this.lexicalSuperStack, this.handlerContext);
        };
        this.cwd = process.cwd();
        const options = options_1.extractOptions(ruleContext);
        this.options = options;
        this.handlerContext = this.configureAstHandlerContext(options, lexicalStructure, ruleContext, packageJsonDependencies);
    }
    activeUcfgBuilder() {
        return utils_1.peek(this.builderStack).ucfgBuilder;
    }
    activeBlockBuilder() {
        return utils_1.peek(this.builderStack).blockBuilder;
    }
    configureAstHandlerContext(options, lexicalStructure, ruleContext, packageJsonDependencies) {
        return {
            envAllocationStrategy: options.envMerging
                ? backend_1.EnvironmentAllocation.mergingEnvironmentAllocation()
                : backend_1.EnvironmentAllocation.defaultEnvironmentAllocation(),
            lexicalStructure,
            ruleContext,
            includePreamble: options.preamble,
            preserveComments: options.preserveComments,
            lexicalThisState: new lexical_structure_1.LexicalThisState(0, `${backend_1.THIS}_topLevel`),
            lexicalSuperState: new lexical_structure_1.LexicalSuperState(`<super-not-bound>`),
            resolveModule: (module) => resolve_module_1.resolveModule(module, ruleContext),
            generatedUcfgBuilders: [],
            idGen: id_gen_1.IdGen.counterBasedIdGen({ P: 0 }),
            frameworkClassifier: new framework_classifier_1.FrameworkClassifier(ruleContext.getFilename(), packageJsonDependencies),
        };
    }
    /**
     * Creates an ESLint `RuleListener`, which contains several callbacks, which are
     * all interconnected through the state of this object.
     */
    createRuleListener() {
        return {
            onCodePathStart: this.onCodePathStart,
            onCodePathEnd: this.onCodePathEnd,
            onCodePathSegmentStart: this.onCodePathSegmentStart,
            onCodePathSegmentEnd: this.onCodePathSegmentEnd,
            '*': this.onNodeStart,
            '*:exit': this.onNodeEnd,
        };
    }
}
exports.TaintAnalysisRuleTraversalState = TaintAnalysisRuleTraversalState;
/**
 * Pushes the property name of last lexical `this` on the `lexicalThisStack`, if necessary.
 *
 * Returns a boolean which is `true` if a name has been pushed, `false` otherwise.
 */
function pushLexicalThis(node, shortId, lexicalThisStack, ucfgNestingDepth, ctx) {
    const maybeScope = ctx.lexicalStructure.getScopeForNode(node);
    let bindsThis = false;
    if (maybeScope && lexical_structure_1.isEffectiveScope(maybeScope)) {
        bindsThis = lexical_structure_1.hasThisBinding(maybeScope);
        if (bindsThis) {
            const thisPropertyName = `${backend_1.THIS}_${ucfgNestingDepth}_${shortId}`;
            lexicalThisStack.push(thisPropertyName);
        }
        const lastThisBindingName = utils_1.peek(lexicalThisStack);
        ctx.lexicalThisState = new lexical_structure_1.LexicalThisState(ucfgNestingDepth, lastThisBindingName);
    }
    return bindsThis;
}
/**
 * Pops property name of the last lexical `this`, if necessary.
 */
function popLexicalThis(lexicalThisStack, bindsThis) {
    if (bindsThis) {
        lexicalThisStack.pop();
    }
}
function pushSuperIfNecessary(node, superStack, currentUcfgId, ctx) {
    if (bindsSuper(node)) {
        const superPropertyName = `%super_${currentUcfgId}_${node.loc.start.line}_${node.loc.start.column}`;
        superStack.push(superPropertyName);
        ctx.lexicalSuperState = new lexical_structure_1.LexicalSuperState(superPropertyName);
    }
}
function popSuperIfNecessary(node, superStack, ctx) {
    if (bindsSuper(node)) {
        superStack.pop();
        if (superStack.length > 0) {
            ctx.lexicalSuperState = new lexical_structure_1.LexicalSuperState(superStack[superStack.length - 1]);
        }
    }
}
function bindsSuper(node) {
    return !!((node.type === 'ClassDeclaration' || node.type === 'ClassExpression') &&
        node.superClass);
}
function initializeFragmentBuilders(ucfgBuilder, blockBuilder) {
    for (const k of ucfg_builders_1.FRAGMENTS) {
        ucfgBuilder.setFragmentBuilder(k, blockBuilder.beginFragment());
    }
}
function addTerminatorsToBlocks(ucfgBuilder, segments, preamble) {
    for (const [blockId, blockBuilder] of ucfgBuilder.getBlockBuilders()) {
        if (!blockBuilder.isDone()) {
            const seg = segments.get(blockId);
            const jumpTargets = utils_1.ensureDefinedOrElse(seg === null || seg === void 0 ? void 0 : seg.nextSegments, []).map(s => s.id);
            if (jumpTargets.length > 0) {
                blockBuilder.jump(jumpTargets);
            }
            else if (!ucfgBuilder.parentBuilders && preamble) {
                // Temporary workaround: that's just a temporary workaround to keep environments
                // from falling apart in the 'envMerging' mode. We smuggle the shared-environment in
                // the `%moduleEnv` property of `module.exports`. It is expected to be extracted
                // and `__objectAssign`-ed into the environment in the importing module.
                // Delete it as soon as 'envMerging' is reverted.
                const modExp = blockBuilder.expr('moduleExports', ucfg_builders_1.fieldAccess('module', 'exports'));
                const envValue = blockBuilder.call('envValue', '__moduleEnv', [ucfg_builders_1.vbl(backend_1.ENV)], {});
                blockBuilder.assignExpr(ucfg_builders_1.fieldAccess(modExp, backend_1.MODULE_ENV), envValue);
                // If the UCFG builder denotes a `Program` and preamble generation is enabled, then the
                // set up of global environment finishes with the result of module initialization.
                blockBuilder.ret(ucfg_builders_1.fieldAccess('module', 'exports'));
            }
            else {
                blockBuilder.ret();
            }
        }
    }
}
//# sourceMappingURL=traversal-state.js.map