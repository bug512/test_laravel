"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleJSXExpressionContainer = void 0;
const framework_classifier_1 = require("../framework-classifier");
const ucfg_builders_1 = require("../ucfg-builders");
const results_1 = require("./results");
/** On-exit handler for JSX expression containers. */
function handleJSXExpressionContainer(jsxExpressionContainer, _ucfgBuilder, _blockBuilder, childResults, ctx) {
    if (ctx.frameworkClassifier.getClassificationLabel() === framework_classifier_1.FrameworkClassificationLabel.React) {
        const expr = childResults.get(jsxExpressionContainer.expression).toExpression();
        return new results_1.JSXChildResult([expr], () => expr);
    }
    else {
        return new results_1.JSXChildResult([], () => ucfg_builders_1._undefined());
    }
}
exports.handleJSXExpressionContainer = handleJSXExpressionContainer;
//# sourceMappingURL=handleJSXExpressionContainer.js.map