"use strict";
/*
 * Copyright (C) 2020-2021 SonarSource SA
 * All rights reserved
 * mailto:info AT sonarsource DOT com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resultsToExpressions = exports.onExit = exports.defaultJSXChildHandler = exports.missingImplementationHandler = exports.defaultHandler = exports.Results = exports.UndefinedResult = exports.VariableDeclarationResult = exports.VariableDeclaratorResult = exports.TaggedTemplateLiteralResult = exports.PropertyResult = exports.RestElementResult = exports.ArrayPatternResult = exports.PropertyPatternResult = exports.ObjectPatternResult = exports.JSXSpreadAttributeResult = exports.JSXAttributeResult = exports.JSXOpeningElementResult = exports.JSXChildResult = exports.ImportSpecifierResult = exports.ImportNamespaceSpecifierResult = exports.ImportDefaultSpecifierResult = exports.AssignmentPatternResult = exports.IdentifierResult = exports.ExportSpecifierResult = exports.PropagatedChildResults = exports.MethodDefinitionResult = exports.ClassDeclarationResult = exports.FunctionExpressionResult = exports.MemberExpressionResult = exports.ExpressionResult = void 0;
const ucfg_builders_1 = require("../ucfg-builders");
const utils_1 = require("../utils");
class ResultBase {
    toExpression() {
        return ucfg_builders_1._undefined();
    }
}
/**
 * A result that contains some UCFG-expression.
 */
class ExpressionResult extends ResultBase {
    constructor(expression) {
        super();
        this.expression = expression;
    }
    toExpression() {
        return this.expression;
    }
}
exports.ExpressionResult = ExpressionResult;
/**
 * Result for "property fetch" = "member expression" = "member access",
 * like `a['b']` or `a.b`.
 */
// There are at least three difficulties with `a.b`-expressions, one simple,
// and one complicated, one self-inflicted.
//
// The first gotcha is that the `b` in `a.b` is represented by `Identifier`.
// The expressions like `a.b` are supposed to be treated as `a['b']`, i.e.
// the `b` identifier must be converted into string, to differentiate it
// from `a[b]` where `b` is a variable.
//
// The second gotcha is more subtle.
// The problem is that `o.m` is not actually a subexpression of `o.m(x)` which
// could be evaluated to a single value.
// This can be easily seen by comparing the output of
// `var a = 58; var o = { a: 42, b() { return this.a; } }; o.b()` vs.
// `var a = 58; var o = { a: 42, b() { return this.a; } }; var e = o.b; e()`.
// The example shows that `o.b` does not just evaluate to the fetched method
// `o.b`, but it also changes the implicit dynamically bounded `this`-receiver.
// In the first case, the implicit `this` is `o`, whereas in the second
// case it is the ambient context.
//
// Third difficulty is that of how our `__proto__`-mechanism works, a member
// expression cannot be represented by two values either: in some cases, it
// can additionally desugar into two additional special built-in methods
// `__getProto` and `__setProto`.
//
// (Add fourth and fifth difficulty: __mapGet, __mapSet);
//
// All in all, it seems reasonable to assume that nobody except a member
// expression itself can know how to rewrite it properly. Therefore, a
// result for a member expression comes with two opaque methods `emitFetch`
// and `emitWrite`, which will do the right thing depending on the name
// of the property, the `computed`-status of the property, and the context
// in which the member expression occurs.
class MemberExpressionResult extends ResultBase {
    constructor(emitFetch, emitWrite) {
        super();
        this.emitFetch = emitFetch;
        this.emitWrite = emitWrite;
    }
    toExpression() {
        return this.emitFetch().fetchedValue;
    }
}
exports.MemberExpressionResult = MemberExpressionResult;
class FunctionExpressionResult extends ResultBase {
    constructor(ucfgId, functionValueVbl, name) {
        super();
        this.ucfgId = ucfgId;
        this.functionValueVbl = functionValueVbl;
        this.name = name;
    }
    toExpression() {
        return this.functionValueVbl;
    }
}
exports.FunctionExpressionResult = FunctionExpressionResult;
/**
 * Results for either class expressions or class declarations.
 *
 * Since expressions can also be named, it seemed reasonable to combine
 * them with declarations, because the both entities can carry basically
 * the same information, differring only by their context.
 */
class ClassDeclarationResult extends ResultBase {
    constructor(classValueVbl, name) {
        super();
        this.classValueVbl = classValueVbl;
        this.name = name;
    }
    toExpression() {
        return this.classValueVbl;
    }
}
exports.ClassDeclarationResult = ClassDeclarationResult;
class MethodDefinitionResult extends ResultBase {
    constructor(name, methodVar) {
        super();
        this.name = name;
        this.methodVar = methodVar;
    }
}
exports.MethodDefinitionResult = MethodDefinitionResult;
class PropagatedChildResults extends ResultBase {
    constructor(propagatedChildResults) {
        super();
        this.propagatedChildResults = propagatedChildResults;
    }
}
exports.PropagatedChildResults = PropagatedChildResults;
/**
 * The `x as y`-part in export clauses like `export {x as y} from 'z';`.
 *
 * Despite same syntax, `x` can have vastly different meanings in different
 * contexts.
 *
 *   - inside of `export { x as y } from 'z'`, the `x` is a property of an external module.
 *   - inside of `export { x as y }`, the `x` is a local variable, that must be resolved
 *     according to the rules for variable scoping.
 *
 * This is why the `local` is exported twice, in two different formats:
 *
 *   - once as a string-typed property name
 *   - another time as a variable
 */
class ExportSpecifierResult extends ResultBase {
    constructor(localName, exportedName, localExpr) {
        super();
        this.localName = localName;
        this.exportedName = exportedName;
        this.localExpr = localExpr;
    }
    toExpression() {
        return this.localExpr;
    }
}
exports.ExportSpecifierResult = ExportSpecifierResult;
/**
 * A result of processing an identifier.
 *
 * An identifier can be used for both writing and reading values,
 * so it includes an `lValue`. Furthermore, identifiers appear
 * as property names, therefore we also save the original name.
 */
class IdentifierResult extends ResultBase {
    /**
     * Constructs `Result`s that wrap an identifier.
     *
     * @param name the original name of the identifier (for properties)
     * @param lValue identifier interpreted as a readable/writable variable reference
     * @param fragment UCFG FragmentBuilder to allow for an assignment call to be made in the correct UCFG block
     */
    constructor(name, lValues, fragment) {
        super();
        this.name = name;
        this.lValues = lValues;
        this.fragment = fragment;
    }
    toExpression() {
        return this.lValues[0];
    }
}
exports.IdentifierResult = IdentifierResult;
class AssignmentPatternResult extends ResultBase {
    constructor(lhsResult, rhsResult) {
        super();
        this.lhsResult = lhsResult;
        this.rhsResult = rhsResult;
    }
}
exports.AssignmentPatternResult = AssignmentPatternResult;
/**
 * Traversal results of default import specifiers, such as `d` in `import d from 'z'`.
 *
 * The local name is a binder, thus we need the `lValue` of it.
 */
class ImportDefaultSpecifierResult extends ResultBase {
    constructor(local) {
        super();
        this.local = local;
    }
}
exports.ImportDefaultSpecifierResult = ImportDefaultSpecifierResult;
/**
 * Traversal results of import specifiers of shape `* as local` in `import * as local from 'z'`.
 */
class ImportNamespaceSpecifierResult extends ResultBase {
    constructor(local) {
        super();
        this.local = local;
    }
}
exports.ImportNamespaceSpecifierResult = ImportNamespaceSpecifierResult;
/**
 * Traversal results for specifiers of shape `x as y` from `import { x as y } from 'z'`.
 *
 * Note that the apparent asymmetry between the imported name (`x`) and the
 * local name (`y`):
 *   - the imported name `x` is really just a string valued property name of the imported module
 *   - the local name `y` is a binder; it can be represented differently dependening
 *     on scopes in which it appears.
 */
class ImportSpecifierResult extends ResultBase {
    constructor(imported, local) {
        super();
        this.imported = imported;
        this.local = local;
    }
}
exports.ImportSpecifierResult = ImportSpecifierResult;
/**
 * A result for anything that can appear in a JSXChild position, i.e. it behaves
 * like an HTML tag or a series of HTML tags.
 *
 * If it is a tag that corresponds to an HTML element that is irrelevant for
 * taint propagation, it can also "skip itself", and return a list with the relevant
 * child nodes.
 */
class JSXChildResult extends ResultBase {
    constructor(relevantNodes, onDemandExpr) {
        super();
        this.relevantNodes = relevantNodes;
        this.onDemandExpr = onDemandExpr;
    }
    toExpression() {
        return this.onDemandExpr();
    }
}
exports.JSXChildResult = JSXChildResult;
class JSXOpeningElementResult extends ResultBase {
    constructor(name, attributes) {
        super();
        this.name = name;
        this.attributes = attributes;
    }
}
exports.JSXOpeningElementResult = JSXOpeningElementResult;
class JSXAttributeResult extends ResultBase {
    constructor(name, value) {
        super();
        this.name = name;
        this.value = value;
    }
}
exports.JSXAttributeResult = JSXAttributeResult;
class JSXSpreadAttributeResult extends ResultBase {
    constructor(arg) {
        super();
        this.arg = arg;
    }
}
exports.JSXSpreadAttributeResult = JSXSpreadAttributeResult;
class ObjectPatternResult extends ResultBase {
    constructor(properties) {
        super();
        this.properties = properties;
    }
}
exports.ObjectPatternResult = ObjectPatternResult;
class PropertyPatternResult extends ResultBase {
    constructor(key, pattern) {
        super();
        this.key = key;
        this.pattern = pattern;
    }
}
exports.PropertyPatternResult = PropertyPatternResult;
class ArrayPatternResult extends ResultBase {
    /**
     * @param elementPatterns Either `null` (for omitted elements in between commas),
     *                        or the node, together with the propagated child result.
     */
    constructor(elementPatterns) {
        super();
        this.elementPatterns = elementPatterns;
    }
}
exports.ArrayPatternResult = ArrayPatternResult;
class RestElementResult extends ResultBase {
    /**
     * Rest-pattern wrapping another pattern.
     *
     * For example, in `var [a, b, ...[c, d, e]] = [1,2,3,4,5]`,
     * the `...[c, d, e]` would be the rest-pattern, and the
     * `[c, d, e]` would correspond to the wrapped pattern.
     *
     * @param wrappedSyntacticNode the wrapped node (the part following the three dots)
     * @param wrappedPattern the wrapped pattern.
     */
    constructor(wrappedSyntacticNode, wrappedPattern) {
        super();
        this.wrappedSyntacticNode = wrappedSyntacticNode;
        this.wrappedPattern = wrappedPattern;
    }
}
exports.RestElementResult = RestElementResult;
class PropertyResult extends ResultBase {
    constructor(key, value) {
        super();
        this.key = key;
        this.value = value;
    }
}
exports.PropertyResult = PropertyResult;
class TaggedTemplateLiteralResult extends ResultBase {
    constructor(quasis, expressions) {
        super();
        this.quasis = quasis;
        this.expressions = expressions;
    }
}
exports.TaggedTemplateLiteralResult = TaggedTemplateLiteralResult;
/**
 * Result of traversing declarations like
 *
 * `const x = 42;`
 *
 * where the left hand side can potentially be a more complex pattern.
 *
 * If the left hand side is a single identifier, then it should be
 * stored as the `exportableName`.
 */
class VariableDeclaratorResult extends ResultBase {
    /**
     * Factory method for `VariableDeclaratorResult`s.
     *
     * Invocations should provide an `exportableName` in cases where the left hand side is not a pattern.
     * Optional IdentifierResult and FragmentBuilder to allow for an assignment call to be made in the correct UCFG block
     * after exiting the parent node.
     */
    constructor(value, exportableName, identifierResult, fragment) {
        super();
        this.value = value;
        this.exportableName = exportableName;
        this.identifierResult = identifierResult;
        this.fragment = fragment;
    }
    toExpression() {
        return this.value;
    }
}
exports.VariableDeclaratorResult = VariableDeclaratorResult;
/**
 * List of declarators with exportable names.
 */
class VariableDeclarationResult extends ResultBase {
    /**
     * Constructs `VariableDeclarationResult`s.
     *
     * Filters and stores only those declarators that have a definite name.
     */
    constructor(variableDeclaratorResults) {
        super();
        this.variableDeclaratorResults = variableDeclaratorResults;
        this.exportableDeclarators = variableDeclaratorResults
            .filter(d => d.exportableName)
            .map(d => d);
    }
}
exports.VariableDeclarationResult = VariableDeclarationResult;
/**
 * `Result` that is `undefined`.
 *
 * Special result that corresponds to an `undefined` value.
 * Used either where no result is expected / needed, or to signal that
 * a handler was not implemented (and the default `undefinedHandler` has been
 * used instead).
 *
 * Subtly different from an `ExpressionResult` with an `_undefined()` value,
 * even though their `toExpression()` give the same ucfg-expression.
 */
class UndefinedResult extends ResultBase {
    constructor() {
        super();
    }
}
exports.UndefinedResult = UndefinedResult;
/**
 * Objects of this type contain all results returned by the child nodes.
 *
 * Each child node is mapped to the corresponding result.
 *
 * Also, each child node keeps a reference to the block builder that
 * was available on node end. This is useful for dealing with children
 * of nodes that introduce multiple blocks, such as ternary operators and
 * short-circuiting logical operators: it allows to use the builders of
 * the child nodes to emit additional instructions in the block in which
 * they were processed, instead of the block of the parent node.
 */
class Results {
    constructor() {
        this.results = new Map();
    }
    setEntry(node, result, exitBlockBuilder) {
        this.results.set(node, { result, exitBlockBuilder });
    }
    get(node) {
        // The assertions made in this method were previously scattered over
        // the entire codebase anyway. It does not introduce any additional failure points,
        // it only collects them in one single place.
        return utils_1.assertIsDefinedNonNull(this.results.get(node), `Results for child nodes must be retrieved after the nodes have been processed (node.type = ${node.type})`).result;
    }
    getArray(nodes) {
        return nodes.map(n => this.get(n));
    }
    getExitBlockBuilder(node) {
        return utils_1.assertIsDefinedNonNull(this.results.get(node), `Every processed node must belong to some block (processed node type: ${node.type})`).exitBlockBuilder;
    }
    static empty() {
        return new Results();
    }
}
exports.Results = Results;
/** A default handler that does nothing and always returns `undefined`. */
const defaultHandler = (_n, _u, _b) => {
    return () => new UndefinedResult();
};
exports.defaultHandler = defaultHandler;
/** Same as `defaultHandler`, but prints some additional logging messages.  */
const missingImplementationHandler = (node, _u, _b) => {
    console.log('WARN Entering unhandled node: ', node.type);
    return () => {
        console.log('WARN Exiting unhandled node: ', node.type);
        return new UndefinedResult();
    };
};
exports.missingImplementationHandler = missingImplementationHandler;
const defaultJSXChildHandler = (_n, _u, _b) => {
    return () => new JSXChildResult([], () => ucfg_builders_1._undefined());
};
exports.defaultJSXChildHandler = defaultJSXChildHandler;
/**
 * Convenience factory for simple handlers that
 * can do everything on exit,
 * and don't need to do anything on entry.
 */
function onExit(doAllAtOnceOnExit) {
    return (n, u, _bStart, ctx) => {
        return (crs, bEnd) => doAllAtOnceOnExit(n, u, bEnd, crs, ctx);
    };
}
exports.onExit = onExit;
/** Converts all results to `Expr`s. */
function resultsToExpressions(results) {
    return results.map(r => r.toExpression());
}
exports.resultsToExpressions = resultsToExpressions;
//# sourceMappingURL=results.js.map