"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.relocateBlocks = exports.union = exports.assignUnion = exports.getBuiltinNameForBinaryOperator = exports.EnvironmentAllocation = exports.setPrototype = exports.getPrototype = exports.attemptConvertToConstantString = exports.storeObjectProperty = exports.fetchObjectProperty = exports.setupCalleeParameters = exports.declareFunction = exports.concat = exports.objectAssign = exports.emptyArray = exports.intLiteral = exports.stringLiteral = exports.globalContextBuiltins = exports.globalContext = exports.callMethod = exports.callFunction = exports.THIS = exports.MODULE_ENV = exports.ENV = exports.FUNCTION_PROTOTYPE_TYPE_NAME = exports.ARRAY_INSTANCE_TYPE_NAME = exports.SLICE_REST = exports.ARRAY_GET = exports.IMPORT_DEFAULT = void 0;
const ucfg_builders_1 = require("./ucfg-builders");
const pb = __importStar(require("./ucfg_pb"));
const utils_1 = require("./utils");
const utils_graphs_1 = require("./utils-graphs");
const INITIALIZE_GLOBAL = '__initializeGlobal';
const GLOBAL_BUILTINS = '%globalBuiltins';
exports.IMPORT_DEFAULT = '__importDefault';
exports.ARRAY_GET = '__arrayGet';
exports.SLICE_REST = '__sliceRest';
exports.ARRAY_INSTANCE_TYPE_NAME = 'ArraySymbol';
exports.FUNCTION_PROTOTYPE_TYPE_NAME = '%SonarFunctionPrototype';
/**
 * Name for both the second synthetic variable of every method, as well
 * as for the property of function objects that hold the environment of the
 * closure.
 */
exports.ENV = '%env';
/**
 * Name of special property attached to user-defined modules, which
 * captures the "merged" environment of all closures in a module,
 * if the 'envMerging' mode is activated.
 */
exports.MODULE_ENV = '%moduleEnv';
/**
 * Name of the env-property that stores the value of lexically bound `this`.
 */
exports.THIS = '_this';
/**
 * Handles function calls of shape `f(x1, ..., xn)` where `f` is not a member
 * expression (and thus does not provide an implicit `this`).
 */
function callFunction(callee, argExprs, ucfgBuilder, blockBuilder, loc) {
    const rcvArgs = [globalContext(ucfgBuilder, blockBuilder), ...argExprs];
    return blockBuilder.dynamicCall('funcRes', callee, rcvArgs, {}, undefined, loc);
}
exports.callFunction = callFunction;
/**
 * Handles method calls of shape `objExpr.methodName(a1, ..., aN)`.
 */
function callMethod(lookedUpMethod, receiverThis, argExprs, blockBuilder, loc) {
    const rcvArgs = [receiverThis, ...argExprs];
    return blockBuilder.dynamicCall('methRes', lookedUpMethod, rcvArgs, {}, undefined, loc);
}
exports.callMethod = callMethod;
/**
 * Returns a variable that refers to the `global`-context of the current UCFG.
 *
 * Creates the variable once, if necessary.
 */
function globalContext(ucfgBuilder, blockBuilder) {
    if (!ucfgBuilder.checkHasSharedDef('global')) {
        const sharedReadonlyFragment = ucfgBuilder.getFragmentBuilder('shared-readonly') || blockBuilder;
        sharedReadonlyFragment.assignExpr('%global', ucfg_builders_1.fieldAccess(exports.ENV, 'global'));
        ucfgBuilder.setHasSharedDef('global');
    }
    return ucfg_builders_1.vbl('%global');
}
exports.globalContext = globalContext;
/**
 * Returns a variable that refers to the global built-ins (coming from stub system).
 *
 * Creates the variable once, if necessary.
 */
function globalContextBuiltins(ucfgBuilder, blockBuilder) {
    if (!ucfgBuilder.checkHasSharedDef('globalBuiltins')) {
        const sharedReadonlyFragment = ucfgBuilder.getFragmentBuilder('shared-readonly') || blockBuilder;
        sharedReadonlyFragment.assignCall(GLOBAL_BUILTINS, INITIALIZE_GLOBAL);
        ucfgBuilder.setHasSharedDef('globalBuiltins');
    }
    return ucfg_builders_1.vbl(GLOBAL_BUILTINS);
}
exports.globalContextBuiltins = globalContextBuiltins;
/**
 * Sets up a JS string literal (with all required prototypes).
 */
function stringLiteral(s, _builder) {
    // Temporary workaround: connect with `String`-prototype
    return ucfg_builders_1.stringLiteral(s);
}
exports.stringLiteral = stringLiteral;
/**
 * Instantiates a JS integer literal (with all required prototypes).
 */
function intLiteral(n, _blockBuilder) {
    // Temporary workaround: connect with `Number`-prototype
    return ucfg_builders_1.intLiteral(n);
}
exports.intLiteral = intLiteral;
/**
 * Instantiates an empty array.
 *
 * @param varNamePrefix prefix of the name of the variable which stores the reference to the array
 * @param blockBuilder block builder to be used to instantiate the array
 * @param loc optional location
 * @returns variable holding a new array instance
 */
function emptyArray(varNamePrefix, blockBuilder, loc) {
    return blockBuilder.newObject(varNamePrefix, exports.ARRAY_INSTANCE_TYPE_NAME, loc);
}
exports.emptyArray = emptyArray;
/**
 * Invokes UCFG-object assign function that assigns all properties from source to target.
 */
function objectAssign(target, source, builder, loc) {
    const args = [ucfg_builders_1._undefined(), target, source];
    builder.call('void', '__objectAssign', args, {}, undefined, loc);
}
exports.objectAssign = objectAssign;
/**
 * Invokes UCFG-concat function that concatenates string operands.
 */
function concat(operands, blockBuilder, loc) {
    return blockBuilder.call('concat', '__concat', operands, {}, undefined, loc);
}
exports.concat = concat;
/** Invokes a magic UCFG-method that converts a string literal into a FunctionReferenceSymbol. */
function declareFunction(ucfgId, blockBuilder) {
    return blockBuilder.call('func', '__declareFunction', [ucfg_builders_1.stringLiteral(ucfgId)]);
}
exports.declareFunction = declareFunction;
/**
 * Creates parameters on the callee-side of the caller-callee contract.
 */
function setupCalleeParameters(params, ucfgBuilder) {
    ucfgBuilder.setParameters([ucfg_builders_1.vbl(exports.ENV), ...params]);
}
exports.setupCalleeParameters = setupCalleeParameters;
function fetchObjectProperty(objVar, property, builder, fieldAccessLoc) {
    const key = attemptConvertToConstantString(property);
    if (typeof key === 'string') {
        return ucfg_builders_1.fieldAccess(objVar, key);
    }
    else {
        return builder.call('var', '__mapGet', [objVar, property], {}, undefined, fieldAccessLoc);
    }
}
exports.fetchObjectProperty = fetchObjectProperty;
function storeObjectProperty(objVar, property, value, builder, fieldWriteLoc) {
    const key = attemptConvertToConstantString(property);
    if (key === '__proto__') {
        setPrototype(objVar, value, builder, fieldWriteLoc);
    }
    else if (typeof key === 'string') {
        builder.assignExpr(ucfg_builders_1.fieldAccess(objVar, key), value, fieldWriteLoc);
    }
    else {
        builder.call('void', '__mapSet', [objVar, property, value], {}, undefined, fieldWriteLoc);
    }
}
exports.storeObjectProperty = storeObjectProperty;
function attemptConvertToConstantString(property) {
    if (property instanceof pb.Constant) {
        return property.getValue();
    }
    else {
        return undefined;
    }
}
exports.attemptConvertToConstantString = attemptConvertToConstantString;
function getPrototype(obj, builder, loc) {
    return builder.call('prototype', '__getProto', [obj], {}, undefined, loc);
}
exports.getPrototype = getPrototype;
function setPrototype(obj, prototyp, builder, loc) {
    builder.call('void', '__setProto', [obj, prototyp], {}, undefined, loc);
}
exports.setPrototype = setPrototype;
var EnvironmentAllocation;
(function (EnvironmentAllocation) {
    function defaultEnvironmentAllocation() {
        return new DefaultEnvironmentAllocationStrategy();
    }
    EnvironmentAllocation.defaultEnvironmentAllocation = defaultEnvironmentAllocation;
    function mergingEnvironmentAllocation() {
        return new MergingEnvironmentAllocationStrategy();
    }
    EnvironmentAllocation.mergingEnvironmentAllocation = mergingEnvironmentAllocation;
    class DefaultEnvironmentAllocationStrategy {
        allocateEnvironment(builder) {
            return builder.newObject('env', 'Object');
        }
        attachEnvironmentToClosure(closure, env, builder) {
            storeObjectProperty(closure, stringLiteral(exports.ENV, builder), env, builder);
        }
        fetchEnvironmentFromClosure(closure, builder) {
            const closureVar = builder.ensureStoredInVariable(closure);
            return fetchObjectProperty(closureVar, stringLiteral(exports.ENV, builder), builder);
        }
        provideInCurrentEnvironment(env, scopeName, builder) {
            /* not needed; Delete once the `envMerging` is reverted. */
        }
        propagateIntoNestedEnvironment(outerEnv, nestedEnv, scopeName, builder) {
            builder.assignExpr(ucfg_builders_1.fieldAccess(nestedEnv, scopeName), ucfg_builders_1.fieldAccess(outerEnv, scopeName));
        }
        storeCurrentLexicalThis(env, _lexicalThisState, builder) {
            builder.assignExpr(ucfg_builders_1.fieldAccess(env, exports.THIS), ucfg_builders_1._this());
        }
        storeOuterLexicalThis(nestedEnv, _lexicalThisState, builder) {
            builder.assignExpr(ucfg_builders_1.fieldAccess(nestedEnv, exports.THIS), ucfg_builders_1.fieldAccess(exports.ENV, exports.THIS));
        }
        fetchLexicalThis(_lexicalThisState) {
            return ucfg_builders_1.fieldAccess(exports.ENV, exports.THIS);
        }
    }
    class MergingEnvironmentAllocationStrategy {
        allocateEnvironment(_builder) {
            return ucfg_builders_1.vbl(exports.ENV);
        }
        attachEnvironmentToClosure(_closure, _env, _builder) { }
        fetchEnvironmentFromClosure(_closure, _builder) {
            return ucfg_builders_1.vbl(exports.ENV);
        }
        provideInCurrentEnvironment(env, scopeName, builder) {
            // Temporary workaround.
            //
            // Delete this entire method as soon as `envMerging` mode is eliminated.
            builder.assignExpr(ucfg_builders_1.fieldAccess(env, scopeName), ucfg_builders_1.vbl(scopeName));
        }
        propagateIntoNestedEnvironment(_outerEnv, _nestedEnv, _scopeName, _builder) {
            /*
             * intentionally left blank.
             *
             * In the fallback mode, the _outerEnv and the _nestedEnv are the same object,
             * no need to copy anything over.
             */
        }
        storeCurrentLexicalThis(env, lexicalThisState, builder) {
            builder.assignExpr(ucfg_builders_1.fieldAccess(env, lexicalThisState.lastThisBindingName), ucfg_builders_1._this());
        }
        storeOuterLexicalThis(nestedEnv, lexicalThisState, builder) {
            // intentionally left blank.
            // No need to copy anything, it's all in the same environment-object anyway.
        }
        fetchLexicalThis(lexicalThisState) {
            return ucfg_builders_1.fieldAccess(exports.ENV, lexicalThisState.lastThisBindingName);
        }
    }
})(EnvironmentAllocation = exports.EnvironmentAllocation || (exports.EnvironmentAllocation = {}));
const BINARY_OPERATORS_BUILTINS = (() => {
    const m = new Map();
    const prefix = '__js_';
    `
  * mul
  / div
  % mod
  - sub
  << shift_left
  >> shift_right
  >>> shift_right
  < less_than
  > greater_than
  <= less_or_equal
  >= greater_or_equal
  instanceof instanceof
  in in
  == equal
  != unequal
  === equal
  !== unequal
  & bitwise_and
  ^ bitwise_xor
  | bitwise_or
  `
        .trim()
        .split('\n')
        .forEach(s => {
        const [k, v] = s.trim().split(' ');
        m.set(k, `${prefix}${v}`);
    });
    return m;
})();
/**
 * Maps binary operators to corresponding IDs of built-in functions.
 *
 * Updating assignment operators are excluded.
 *
 * Short-circuiting operators `&&` and `||` are excluded
 * (they generate blocks and jumps, not single instructions).
 */
function getBuiltinNameForBinaryOperator(operator) {
    return BINARY_OPERATORS_BUILTINS.get(operator) || '__unknown_operator';
}
exports.getBuiltinNameForBinaryOperator = getBuiltinNameForBinaryOperator;
function assignUnion(v, expressions, builder) {
    builder.assignCall(v, '__union', [ucfg_builders_1._undefined(), ...expressions]);
}
exports.assignUnion = assignUnion;
function union(resultVarPrefix, expressions, builder) {
    return builder.call(resultVarPrefix, '__union', [ucfg_builders_1._undefined(), ...expressions]);
}
exports.union = union;
/**
 * Modifies block locations in a way that they become compatible with the
 * location-based block ordering heuristic currently used by the backend.
 *
 * @param ucfg an UCFG with all block terminators already added.
 */
function relocateBlocks(ucfg) {
    const { flowGraph, originalVertices: idsToBlocks } = utils_graphs_1.extractCfg(ucfg);
    const hsccs = utils_graphs_1.hierarchicalTarjan(flowGraph);
    const vertexOrdering = utils_1.flatMap(hsccs, h => h.getVertexOrdering());
    const blockIdToIndex = utils_1.inverseForArray(vertexOrdering);
    for (const [blockId, block] of idsToBlocks) {
        const idx = utils_1.assertIsDefinedNonNull(blockIdToIndex.get(blockId), `Failed to retrieve index of ${blockId}`);
        const syntheticLineNumber = idx + 1;
        block.setLocation(ucfg_builders_1.loc('<synthetic>', syntheticLineNumber, 1, syntheticLineNumber, 1));
    }
    return ucfg;
}
exports.relocateBlocks = relocateBlocks;
//# sourceMappingURL=backend.js.map