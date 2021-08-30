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
exports.handleObjectExpression = void 0;
const backend = __importStar(require("../backend"));
const results_1 = require("./results");
function handleObjectExpression(objectExpression, _ucfgBuilder, blockBuilder, childResults) {
    const obj = blockBuilder.newObject('object', 'Object', objectExpression.loc);
    for (const property of objectExpression.properties) {
        /* istanbul ignore else */
        if (property.type === 'SpreadElement') {
            const value = childResults.get(property).toExpression();
            backend.objectAssign(obj, value, blockBuilder, property.loc);
        }
        else if (property.type === 'Property') {
            const { key, value } = childResults.get(property);
            backend.storeObjectProperty(obj, key, value, blockBuilder, property.loc);
        }
        else {
            // 1. Should not happen: There seems to be two other cases that need to be handled, namely
            // MethodDefinition and TSAbstractMethodDefinition. However, (abstract) method definitions
            // are parsed as properties with function expressions.
            // 2. If it happens: we realize how the missing cases look like and handle them accordingly.
        }
    }
    return new results_1.ExpressionResult(obj);
}
exports.handleObjectExpression = handleObjectExpression;
//# sourceMappingURL=handleObjectExpression.js.map