"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleJSXAttribute = void 0;
const framework_classifier_1 = require("../framework-classifier");
const results_1 = require("./results");
const utils_jsx_1 = require("./utils-jsx");
/** On-exit handler for JSX attributes. */
function handleJSXAttribute(jsxAttribute, _ucfgBuilder, _blockBuilder, childResults, ctx) {
    const name = jsxAttribute.name.name;
    if (ctx.frameworkClassifier.getClassificationLabel() === framework_classifier_1.FrameworkClassificationLabel.React) {
        const valueProperty = utils_jsx_1.attemptExtractTaintableJSXAttributeValue(jsxAttribute);
        const valueExpr = valueProperty && childResults.get(valueProperty).toExpression();
        return new results_1.JSXAttributeResult(name, valueExpr);
    }
    else {
        // Temporary workaround: handle Vue case.
        return new results_1.JSXAttributeResult(name, undefined);
    }
}
exports.handleJSXAttribute = handleJSXAttribute;
//# sourceMappingURL=handleJSXAttribute.js.map