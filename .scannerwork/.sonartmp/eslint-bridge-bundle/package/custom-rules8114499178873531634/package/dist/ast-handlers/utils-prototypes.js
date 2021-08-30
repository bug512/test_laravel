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
exports.initFunctionPrototype = void 0;
const backend = __importStar(require("../backend"));
const ucfg_builders_1 = require("../ucfg-builders");
function attachPrototypeProperty(functionValue, parentUcfgBuilder, builder) {
    const prototypeProperty = builder.newObject('prototype', 'Object');
    const globalBuiltins = backend.globalContextBuiltins(parentUcfgBuilder, builder);
    const objectConstructor = builder.expr('objectCons', ucfg_builders_1.fieldAccess(globalBuiltins, 'Object'));
    const objectPrototype = builder.expr('objectProt', ucfg_builders_1.fieldAccess(objectConstructor, 'prototype'));
    // Set the prototype of the `f.prototype` property so that
    // `f.prototype.__proto__ === Object.prototype` holds.
    backend.setPrototype(prototypeProperty, objectPrototype, builder);
    builder.assignExpr(ucfg_builders_1.fieldAccess(functionValue, 'prototype'), prototypeProperty);
}
function initFunctionPrototype(functionValue, parentUcfgBuilder, builder) {
    // Set the Function.Prototype stubs as prototype
    const funcProto = builder.newObject('functionPrototype', backend.FUNCTION_PROTOTYPE_TYPE_NAME);
    backend.setPrototype(functionValue, funcProto, builder);
    attachPrototypeProperty(functionValue, parentUcfgBuilder, builder);
}
exports.initFunctionPrototype = initFunctionPrototype;
//# sourceMappingURL=utils-prototypes.js.map