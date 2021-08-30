"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleJSXOpeningElement = void 0;
const framework_classifier_1 = require("../framework-classifier");
const ucfg_builders_1 = require("../ucfg-builders");
const utils_1 = require("../utils");
const results_1 = require("./results");
/** On-exit handler for JSX opening elements. */
function handleJSXOpeningElement(jsxOpeningElement, _ucfgBuilder, _blockBuilder, childResults, ctx) {
    if (ctx.frameworkClassifier.getClassificationLabel() === framework_classifier_1.FrameworkClassificationLabel.React) {
        const { name } = jsxOpeningElement;
        const attributes = [];
        // Even though TSESTree.JSXOpeningElement says that its attribute are JSXAttribute nodes, they can actually be
        // JSXSpreadAttribute nodes. Therefore, the child results can also be instances of JSXSpreadAttributeResult.
        childResults.getArray(jsxOpeningElement.attributes).forEach(attr => {
            if (attr instanceof results_1.JSXSpreadAttributeResult ||
                (attr instanceof results_1.JSXAttributeResult && attr.value)) {
                attributes.push(attr);
            }
        });
        let nameExpr;
        if (name.type === 'JSXIdentifier' && utils_1.startsWithLowerCase(name.name)) {
            // Lowercase identifiers are converted into string literals, so that
            // <a href="...">...</a> becomes createElement('a', ...)
            nameExpr = ucfg_builders_1.stringLiteral(name.name);
        }
        else {
            nameExpr = childResults.get(name).toExpression();
        }
        return new results_1.JSXOpeningElementResult(nameExpr, attributes);
    }
    else {
        // Temporary workaround: Check whether Vue requires special handling.
        return new results_1.JSXOpeningElementResult(childResults.get(jsxOpeningElement.name).toExpression(), []);
    }
}
exports.handleJSXOpeningElement = handleJSXOpeningElement;
//# sourceMappingURL=handleJSXOpeningElement.js.map