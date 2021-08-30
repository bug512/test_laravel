"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleJSXElement = void 0;
const backend_1 = require("../backend");
const framework_classifier_1 = require("../framework-classifier");
const ucfg_builders_1 = require("../ucfg-builders");
const utils_1 = require("../utils");
const results_1 = require("./results");
const utils_jsx_1 = require("./utils-jsx");
/** On-exit handler for JSX elements. */
function handleJSXElement(jsxElement, _ucfgBuilder, blockBuilder, childResults, ctx) {
    if (ctx.frameworkClassifier.getClassificationLabel() === framework_classifier_1.FrameworkClassificationLabel.React) {
        const { openingElement, children, loc } = jsxElement;
        const relevantChildNodes = utils_1.flatMap(children, c => childResults.get(c).relevantNodes);
        const onDemandExpr = () => {
            const { name, attributes } = childResults.get(openingElement);
            /**
             * Temporary workaround
             *
             * Build an object for the props out of the element attributes (SONARSEC-2395).
             */
            const props = blockBuilder.newObject('reactProps', 'Object', loc);
            attributes.forEach((attr, idx) => {
                if (attr instanceof results_1.JSXAttributeResult) {
                    if (attr.value) {
                        const attrLoc = openingElement.attributes[idx].loc;
                        blockBuilder.assignExpr(ucfg_builders_1.fieldAccess(props, attr.name), attr.value, attrLoc);
                    }
                }
                else {
                    backend_1.objectAssign(props, attr.arg, blockBuilder, loc);
                }
            });
            const args = [ucfg_builders_1._undefined(), ucfg_builders_1.vbl(backend_1.ENV), name, props, ...relevantChildNodes];
            return blockBuilder.call('reactElement', '__reactCreateElement', args, undefined, undefined, loc);
        };
        if (isRelevantNode(jsxElement)) {
            // The node is important, create it right away
            const res = onDemandExpr();
            return new results_1.JSXChildResult([res], () => res);
        }
        else {
            // The node itself is not relevant, propagate only the child node results, and
            // an optional way to instantiate the node as an `Expr`.
            return new results_1.JSXChildResult(relevantChildNodes, onDemandExpr);
        }
    }
    else {
        return new results_1.JSXChildResult([], () => ucfg_builders_1._undefined());
    }
}
exports.handleJSXElement = handleJSXElement;
function isRelevantNode(jsxElement) {
    /**
     * Temporary workaround
     *
     * Refine what a relevant element is:
     * - consider the element attributes, e.g. `<a href=...></a>` (SONARSEC-2395).
     * - consider built-in HTML elements that can act as sinks    (SONARSEC-2392).
     */
    const { name: tag, attributes } = jsxElement.openingElement;
    const containsTaintableAttributes = attributes.filter(attr => utils_jsx_1.isTaintableJSXAttribute(attr)).length > 0;
    const looksLikeComponentName = !(tag.type === 'JSXIdentifier' && utils_1.startsWithLowerCase(tag.name));
    return looksLikeComponentName || containsTaintableAttributes;
}
//# sourceMappingURL=handleJSXElement.js.map