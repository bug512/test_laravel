"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.propagateChildResults = void 0;
const results_1 = require("./results");
/**
 * Helper method for propagating child results through nodes that do nothing by themselves, such
 * as, for example, `ClassBody`, which is just a list of `ClassElement`s.
 *
 * @returns `childResults` unchanged.
 */
function propagateChildResults(_classDecl, _ucfgBuilder, _blockBuilder, childResults, _ctx) {
    return new results_1.PropagatedChildResults(childResults);
}
exports.propagateChildResults = propagateChildResults;
//# sourceMappingURL=propagateChildResults.js.map