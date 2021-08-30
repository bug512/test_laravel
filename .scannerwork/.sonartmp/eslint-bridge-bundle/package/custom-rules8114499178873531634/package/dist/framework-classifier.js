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
exports.FrameworkClassifier = exports.PackageJsonDependenciesCache = exports.FrameworkClassificationLabel = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const BYTE_ORDER_MARK_REGEX = /^\uFEFF/;
var FrameworkClassificationLabel;
(function (FrameworkClassificationLabel) {
    FrameworkClassificationLabel[FrameworkClassificationLabel["Vue"] = 0] = "Vue";
    FrameworkClassificationLabel[FrameworkClassificationLabel["React"] = 1] = "React";
    FrameworkClassificationLabel[FrameworkClassificationLabel["Default"] = 2] = "Default";
})(FrameworkClassificationLabel = exports.FrameworkClassificationLabel || (exports.FrameworkClassificationLabel = {}));
class PackageJsonDependenciesCache {
    constructor() {
        this.cache = new Map();
    }
    /**
     * Finds the dependencies for the file or directory at the `currPath`
     *
     * Ensures that the dependencies are cached for all directories up
     * to the directory in which the `package.json` is found.
     */
    findDependencies(currPath) {
        const cachedDependencies = this.cache.get(currPath);
        if (cachedDependencies) {
            return cachedDependencies;
        }
        const packageJsonPath = path.resolve(currPath, 'package.json');
        let result = new Set();
        if (fs.existsSync(packageJsonPath)) {
            const fileContents = fs
                .readFileSync(packageJsonPath, { encoding: 'utf8' })
                .replace(BYTE_ORDER_MARK_REGEX, '');
            try {
                result = extractDependencies(JSON.parse(fileContents));
            }
            catch (e) {
                console.log(`WARN failed to extract dependencies from ${packageJsonPath}`);
            }
        }
        else {
            const parentPath = path.dirname(currPath);
            if (parentPath !== currPath) {
                result = this.findDependencies(path.dirname(currPath));
            }
        }
        this.cache.set(currPath, result);
        return result;
    }
    /** Creates a new empty cache. */
    static empty() {
        return new PackageJsonDependenciesCache();
    }
}
exports.PackageJsonDependenciesCache = PackageJsonDependenciesCache;
class FrameworkClassifier {
    constructor(filename, packageJsonDependencies) {
        this.hints = {
            packageJsonDependencies: PackageJsonDependenciesCache.empty(),
            importsReactDom: false,
            importsReact: false,
            importsVue: false,
            filename: '',
        };
        this.hints.filename = filename;
        this.hints.packageJsonDependencies = packageJsonDependencies;
    }
    classify() {
        if (isHintingVue(this.hints)) {
            return FrameworkClassificationLabel.Vue;
        }
        else if (isHintingReact(this.hints)) {
            return FrameworkClassificationLabel.React;
        }
        else {
            const dependencies = this.hints.packageJsonDependencies.findDependencies(path.dirname(this.hints.filename));
            if (dependencies.has('vue')) {
                return FrameworkClassificationLabel.Vue;
            }
            else if (dependencies.has('react')) {
                return FrameworkClassificationLabel.React;
            }
            return FrameworkClassificationLabel.Default;
        }
    }
    addImportHint(module) {
        this.hints.importsReactDom = this.hints.importsReactDom || module === 'react-dom';
        this.hints.importsReact = this.hints.importsReact || module === 'react';
        this.hints.importsVue = this.hints.importsVue || module === 'vue';
    }
    getClassificationLabel() {
        if (!this.label) {
            this.label = this.classify();
        }
        return this.label;
    }
}
exports.FrameworkClassifier = FrameworkClassifier;
function isHintingVue(hints) {
    const { importsVue, filename } = hints;
    return importsVue || filename.endsWith('vue');
}
function isHintingReact(hints) {
    const { importsReact, importsReactDom } = hints;
    return importsReact || importsReactDom;
}
function extractDependencies(json) {
    if (typeof json === 'object' && json && 'dependencies' in json) {
        const dependencies = json.dependencies;
        if (typeof dependencies === 'object' && dependencies) {
            return new Set(Object.keys(dependencies));
        }
    }
    return new Set();
}
//# sourceMappingURL=framework-classifier.js.map