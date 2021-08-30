"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleJSXSpreadAttribute = void 0;
const framework_classifier_1 = require("../framework-classifier");
const results_1 = require("./results");
/** On-exit handler for JSX spread attributes. */
function handleJSXSpreadAttribute(jsxSpreadAttribute, _ucfgBuilder, _blockBuilder, childResults, ctx) {
    if (ctx.frameworkClassifier.getClassificationLabel() === framework_classifier_1.FrameworkClassificationLabel.React) {
        const arg = childResults.get(jsxSpreadAttribute.argument).toExpression();
        return new results_1.JSXSpreadAttributeResult(arg);
    }
    else {
        return new results_1.UndefinedResult();
    }
}
exports.handleJSXSpreadAttribute = handleJSXSpreadAttribute;
//# sourceMappingURL=handleJSXSpreadAttribute.js.map