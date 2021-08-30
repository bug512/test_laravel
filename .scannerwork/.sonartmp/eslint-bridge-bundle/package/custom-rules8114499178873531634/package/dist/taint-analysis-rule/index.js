"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ruleFactory = void 0;
const framework_classifier_1 = require("../framework-classifier");
const id_gen_1 = require("../id-gen");
const lexical_structure_1 = require("../lexical-structure");
const options_1 = require("./options");
const scope_name_gen_1 = require("./scope-name-gen");
const traversal_state_1 = require("./traversal-state");
/**
 * Creates a new `TaintAnalysisRule` with fresh UID-generators.
 */
function ruleFactory() {
    // Global counter to make sure all generated UCFGs are strictly separate from one another.
    // (kept between the analyses of multiple files)
    const generatedUcfgIdSupplier = id_gen_1.IdGen.counterBasedIdGen({
        U: 1,
        P: 0,
    });
    const emittedUcfgs = new Map();
    const packageJsonDependencies = framework_classifier_1.PackageJsonDependenciesCache.empty();
    let lexicalStructure = undefined;
    let rootScope = undefined;
    /**
     * Clear and reset various structures between the runs on different files,
     * in order to avoid memory leaks.
     *
     * In particular, it clears the array with the generated UCFGs, and
     * removes the `lexicalStructure`, which is exposed for tests.
     */
    function resetRuleState() {
        emittedUcfgs.clear();
        rootScope = undefined;
        lexicalStructure = undefined;
    }
    return {
        meta: {
            schema: [
                {
                    type: 'object',
                    properties: options_1.OPTIONS_SCHEMA,
                },
                {
                    title: 'sonar-context',
                    type: 'object',
                    properties: {
                        workDir: {
                            type: 'string',
                        },
                    },
                },
            ],
            messages: [],
            type: 'layout',
        },
        create(context) {
            resetRuleState();
            rootScope = context.getScope();
            const scopeIdGen = id_gen_1.IdGen.counterBasedIdGen({
                P: 1,
            });
            const scopeNameGen = scope_name_gen_1.createUcfgIdSavingScopeNameGen(generatedUcfgIdSupplier, scopeIdGen);
            lexicalStructure = lexical_structure_1.analyzeLexicalStructure(rootScope, scopeNameGen);
            return new traversal_state_1.TaintAnalysisRuleTraversalState(context, emittedUcfgs, lexicalStructure, scopeNameGen, packageJsonDependencies).createRuleListener();
        },
        getEmittedUcfgs() {
            return emittedUcfgs;
        },
        getLexicalStructure() {
            return lexicalStructure;
        },
        getDiagnosticPrettyPrint() {
            /* istanbul ignore else */
            if (rootScope && lexicalStructure) {
                return lexical_structure_1.diagnosticPrettyPrint(rootScope, lexicalStructure);
            }
            else {
                // Cannot happen: if it happens, it means that our test setup is wrong.
                // Inconsequential: used only during tests anyway.
                return `Failed to generate diagnostic pretty print: scope: ${Boolean(rootScope)} lexEnv: ${Boolean(lexicalStructure)}`;
            }
        },
    };
}
exports.ruleFactory = ruleFactory;
//# sourceMappingURL=index.js.map