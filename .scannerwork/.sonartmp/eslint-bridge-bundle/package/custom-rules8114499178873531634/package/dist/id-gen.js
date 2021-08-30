"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdGen = void 0;
var IdGen;
(function (IdGen) {
    /**
     * Creates an ID-generator that generates strings from continuously
     * incremented counters.
     *
     * @param initialValues
     *        optional initial values of the counters for some of the prefixes
     *        (if no initial value is specified, 0 is used by default).
     */
    function counterBasedIdGen(initialValues) {
        const counters = new Map();
        if (initialValues) {
            for (const [gr, num] of Object.entries(initialValues)) {
                counters.set(gr, num || 0);
            }
        }
        return {
            freshId(prefix) {
                let currId = counters.get(prefix);
                if (!currId) {
                    currId = 0;
                }
                const result = `${prefix}_${currId}`;
                counters.set(prefix, currId + 1);
                return result;
            },
        };
    }
    IdGen.counterBasedIdGen = counterBasedIdGen;
})(IdGen = exports.IdGen || (exports.IdGen = {}));
//# sourceMappingURL=id-gen.js.map