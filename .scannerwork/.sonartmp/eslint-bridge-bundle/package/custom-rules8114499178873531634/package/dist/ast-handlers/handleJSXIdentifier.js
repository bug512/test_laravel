"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleJSXIdentifier = void 0;
const utils_identifiers_1 = require("./utils-identifiers");
/** On-exit handler for JSX identifiers. */
function handleJSXIdentifier(jsxIdentifier, ucfgBuilder, blockBuilder, _childResults, ctx) {
    return utils_identifiers_1.handleIdentifierLike(jsxIdentifier, ucfgBuilder, blockBuilder, ctx);
}
exports.handleJSXIdentifier = handleJSXIdentifier;
//# sourceMappingURL=handleJSXIdentifier.js.map