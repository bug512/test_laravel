"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleJSXMemberExpression = void 0;
const framework_classifier_1 = require("../framework-classifier");
const results_1 = require("./results");
const utils_member_expressions_1 = require("./utils-member-expressions");
/** On-exit handler for JSX member expressions. */
function handleJSXMemberExpression(jsxMemberExpression, _ucfgBuilder, blockBuilder, childResults, ctx) {
    if (ctx.frameworkClassifier.getClassificationLabel() === framework_classifier_1.FrameworkClassificationLabel.React) {
        return utils_member_expressions_1.handleMemberExpressionLike(jsxMemberExpression, blockBuilder, childResults, ctx);
    }
    else {
        return new results_1.UndefinedResult();
    }
}
exports.handleJSXMemberExpression = handleJSXMemberExpression;
//# sourceMappingURL=handleJSXMemberExpression.js.map