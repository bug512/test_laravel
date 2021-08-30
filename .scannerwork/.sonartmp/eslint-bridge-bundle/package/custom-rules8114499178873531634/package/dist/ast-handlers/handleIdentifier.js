"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleIdentifier = void 0;
const utils_identifiers_1 = require("./utils-identifiers");
/** On-exit handler for identifiers. */
function handleIdentifier(identifier, ucfgBuilder, blockBuilder, _childResults, ctx) {
    return utils_identifiers_1.handleIdentifierLike(identifier, ucfgBuilder, blockBuilder, ctx);
}
exports.handleIdentifier = handleIdentifier;
//# sourceMappingURL=handleIdentifier.js.map