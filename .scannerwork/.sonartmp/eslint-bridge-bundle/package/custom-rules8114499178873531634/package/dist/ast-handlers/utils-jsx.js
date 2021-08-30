"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTaintableJSXAttribute = exports.attemptExtractTaintableJSXAttributeValue = void 0;
/**
 * Checks whether `jsxAttribute.value` exists, and whether it can possibly be
 * tainted. If yes, returns the `jsxAttribute.value`. Otherwise, returns `undefined`.
 *
 * @param jsxAttribute a `JSXAttribute`
 * @returns The `jsxAttribute.value` if it exists and can contain tainted values.
 */
function attemptExtractTaintableJSXAttributeValue(jsxAttribute) {
    if (jsxAttribute.value &&
        jsxAttribute.value.type === 'JSXExpressionContainer' &&
        jsxAttribute.value.expression.type !== 'JSXEmptyExpression') {
        return jsxAttribute.value;
    }
    return undefined;
}
exports.attemptExtractTaintableJSXAttributeValue = attemptExtractTaintableJSXAttributeValue;
function isTaintableJSXAttribute(jsxAttribute) {
    const jstAttrPred = jsxAttribute.type === 'JSXAttribute' &&
        !!attemptExtractTaintableJSXAttributeValue(jsxAttribute);
    const jstSpreadAttrPred = jsxAttribute.type === 'JSXSpreadAttribute';
    return jstAttrPred || jstSpreadAttrPred;
}
exports.isTaintableJSXAttribute = isTaintableJSXAttribute;
//# sourceMappingURL=utils-jsx.js.map