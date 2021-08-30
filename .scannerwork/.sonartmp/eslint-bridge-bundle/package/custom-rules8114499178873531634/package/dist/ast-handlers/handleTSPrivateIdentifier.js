"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleTSPrivateIdentifier = void 0;
const ucfg_builders_1 = require("../ucfg-builders");
const results_1 = require("./results");
function handleTSPrivateIdentifier(privateIdentifier, _ucfgBuilder, _blockBuilder, _childResults, _ctx) {
    const escapedText = 'escapedText';
    /* istanbul ignore else */
    if (privateIdentifier.hasOwnProperty(escapedText)) {
        // @ts-ignore Property 'escapedText' does not exist on type 'Node'
        // There is no "name" property accessible for private identifiers as TSPrivateIdentifier is not currently exposed
        const privateIdentifierName = privateIdentifier[escapedText];
        return new results_1.IdentifierResult(privateIdentifierName, [ucfg_builders_1.vbl(privateIdentifierName)]);
    }
    else {
        // Should not happen
        return new results_1.UndefinedResult();
    }
}
exports.handleTSPrivateIdentifier = handleTSPrivateIdentifier;
//# sourceMappingURL=handleTSPrivateIdentifier.js.map