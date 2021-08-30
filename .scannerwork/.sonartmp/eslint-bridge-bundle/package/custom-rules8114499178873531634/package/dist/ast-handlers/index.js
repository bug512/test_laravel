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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlers = void 0;
const handleArrayExpression_1 = require("./handleArrayExpression");
const handleArrayPattern_1 = require("./handleArrayPattern");
const handleArrowExpression_1 = require("./handleArrowExpression");
const handleAssignmentExpression_1 = require("./handleAssignmentExpression");
const handleAssignmentPattern_1 = require("./handleAssignmentPattern");
const handleAwaitExpression_1 = require("./handleAwaitExpression");
const handleBinaryExpression_1 = require("./handleBinaryExpression");
const handleCallExpression_1 = require("./handleCallExpression");
const handleChainExpression_1 = require("./handleChainExpression");
const handleClassDeclaration_1 = require("./handleClassDeclaration");
const handleConditionalExpression_1 = require("./handleConditionalExpression");
const handleForInStatement_1 = require("./handleForInStatement");
const handleForOfStatement_1 = require("./handleForOfStatement");
const handleFunctionDeclaration_1 = require("./handleFunctionDeclaration");
const handleFunctionExpression_1 = require("./handleFunctionExpression");
const handleIdentifier_1 = require("./handleIdentifier");
const handleJSXAttribute_1 = require("./handleJSXAttribute");
const handleJSXElement_1 = require("./handleJSXElement");
const handleJSXExpressionContainer_1 = require("./handleJSXExpressionContainer");
const handleJSXIdentifier_1 = require("./handleJSXIdentifier");
const handleJSXMemberExpression_1 = require("./handleJSXMemberExpression");
const handleJSXOpeningElement_1 = require("./handleJSXOpeningElement");
const handleJSXSpreadAttribute_1 = require("./handleJSXSpreadAttribute");
const handleLiteral_1 = require("./handleLiteral");
const handleLogicalExpression_1 = require("./handleLogicalExpression");
const handleMemberExpression_1 = require("./handleMemberExpression");
const handleMethodDefinition_1 = require("./handleMethodDefinition");
const handleNew_1 = require("./handleNew");
const handleObjectExpression_1 = require("./handleObjectExpression");
const handleObjectPattern_1 = require("./handleObjectPattern");
const handleProgram_1 = require("./handleProgram");
const handleProperty_1 = require("./handleProperty");
const handleRestElement_1 = require("./handleRestElement");
const handleReturn_1 = require("./handleReturn");
const handleSequenceExpression_1 = require("./handleSequenceExpression");
const handleSpreadElement_1 = require("./handleSpreadElement");
const handleSuper_1 = require("./handleSuper");
const handleTaggedTemplateExpression_1 = require("./handleTaggedTemplateExpression");
const handleTemplateElement_1 = require("./handleTemplateElement");
const handleTemplateLiteral_1 = require("./handleTemplateLiteral");
const handleThis_1 = require("./handleThis");
const handleTSAsExpression_1 = require("./handleTSAsExpression");
const handleTSNonNullExpression_1 = require("./handleTSNonNullExpression");
const handleTSPrivateIdentifier_1 = require("./handleTSPrivateIdentifier");
const handleTSTypeAssertion_1 = require("./handleTSTypeAssertion");
const handleUnaryExpression_1 = require("./handleUnaryExpression");
const handleVariableDeclaration_1 = require("./handleVariableDeclaration");
const handleVariableDeclarator_1 = require("./handleVariableDeclarator");
const moduleSystems = __importStar(require("./module-systems"));
const propagateChildResults_1 = require("./propagateChildResults");
const results_1 = require("./results");
// Adding new handler for an AST element
// =====================================
//
// 1. Locate the AST element in the `handlers` below.
// 2. If the handler has nothing to do on node entry
//    2a. use an `onExit(handleYourAstType)` as handler
//    2b. create the `handleYourAstType` in a separate
//        file called `handleYourAstType.ts`, with
//        the signature determined by `onExit` parameter type
//        (the `N` will be your node type, the `R` will be some `Result`,
//        see 2g)
//    2c. You will have access to the original node, the builder that
//        is active on node end, and, most crucially:
//        you'll have all results returned by child nodes.
//    2d. The "results" can have different types, and are tagged: they all
//        have a `type` field, see `Result` definition
//        for what's available.
//    2e. You'll often want to convert the results into UCFG-`Expr`s.
//        There are helper methods (`resultToExpression`, `resultsToExpression`)
//        for that.
//    2f. Use the block builders to generate the necessary UCFG-instructions.
//    2g. The handler must return an `Result`. There are
//        again helper methods called `<something>Result` for building the
//        wrappers (see e.g. `new ExpressionResult`, `new MemberExpressionResult`,
//        `undefinedResult` etc.). If you don't find the kind of result you want,
//        create a new one in `results.ts`, set its `type` property to the name
//        of the element, and also provide a little constructor method that creates
//        an appropriately tagged object. Keep the return types as precise as
//        possible.
//    2h. Returning a value corresponding to JS `undefined` and returning a
//        value that represents `undefined` in UCFG are two different things.
//        See paragraph on `undefined` below.
// 3. If the handler must do something on node entry, you have to implement
//    the entire `AstHandler` interface. This will allow you to do
//    two separate steps: one on entry, one on exit.
//    On entry, you get only the original node and the builders (no results
//    from the child nodes are available yet).
//    Once the on-entry step is finished, you have to return the handler that
//    will be called on exit. To construct the on-exit handler,
//    proceed as in part 2. Take a look at e.g. `handleFunctionDeclaration` for
//    inspiration.
//
//
// Returning various `undefined` values
// ====================================
//
// An `Result` cannot be `undefined`; it must
// always be an object, and it must always have the `type` property.
//
// If a handler is not supposed to "return" anything meaningful to the
// parent AST element, there is a special `Result` for that:
// it's an object with just the `type: 'undefined'` property. An instance
// is obtained by invoking `undefinedResult()`.
//
// If a handler is supposed to return a UCFG expression that corresponds to
// an `undefined` in JS, then you have to construct an `Result`
// that actually holds an expression. This is best achieved by invoking
// `new ExpressionResult(_undefined())`, whereas `_undefined()` comes from `ucfg_pb`,
// and `new ExpressionResult` is the helper that builds appropriately tagged
// `Result`.
//
//
// Example: Without child nodes - string literals
// =========================================
//
// 1. Create a test in `tests/ast-handlers/`.
// 2. Set JS code to contain something with a string literal, e.g. `print("hello")`;
// 3. Add `onExit(handleLiteral)` handler for `Literal`.
// 4. Create a `handleLiteral` file and method. Signature is determined by what `onExit` expects.
//    For the return type, `ExpressionResult` seems appropriate, because all we want to
//    do is to return the expression, without adding any extra information.
// 5. Handle what's important (e.g. strings, numbers, etc.), create a `Expr`
//    in each case.
// 9. `return new ExpressionResult(pbExpr)`
// 10. Fix the test (possibly by copying the expected UCFGs from the terminal)
//
//
// Example: With child nodes - string concatenation
// ================================================
//
// 1. Add test with string concat. It will fail if `BinaryExpression` handler is missing.
// 2. Add handler for `BinaryExpression`. We again need only `onExit`-handler, so it's
//    `BinaryExpression: onExit(handleBinaryExpression)`.
// 3. Create missing `handleBinaryExpression` method in its own file,
//    with interface determined by `onExit`.
// 4. Suppose that, for the sake of this example, we want to handle only string concatenation.
//    The more interesting steps in the implementation then are:
//     4a. Convert the child results into `Expr`s using `resultToExpression`,
//         because we assume that all children are also subexpressions.
//     4b. If the operator is `+`, then use the `blockBuilder` to `call` the
//         special built-in `__concat` method, passing the `Expr`s obtained in
//         the previous step as arguments.
//     4c. Pass the location of the node to the `call` method.
//     4d. The result of `call` method is a variable.
//         Wrap it in an `new ExpressionResult` and return.
// 5. Fix the test.
exports.handlers = {
    ArrayExpression: results_1.onExit(handleArrayExpression_1.handleArrayExpression),
    ArrayPattern: results_1.onExit(handleArrayPattern_1.handleArrayPattern),
    ArrowFunctionExpression: handleArrowExpression_1.handleArrowFunctionExpression,
    AssignmentExpression: results_1.onExit(handleAssignmentExpression_1.handleAssignmentExpression),
    AssignmentPattern: results_1.onExit(handleAssignmentPattern_1.handleAssignmentPattern),
    AwaitExpression: results_1.onExit(handleAwaitExpression_1.handleAwaitExpression),
    BinaryExpression: results_1.onExit(handleBinaryExpression_1.handleBinaryExpression),
    BlockStatement: results_1.defaultHandler,
    BreakStatement: results_1.defaultHandler,
    CallExpression: results_1.onExit(handleCallExpression_1.handleCallExpression),
    CatchClause: results_1.defaultHandler,
    ChainExpression: results_1.onExit(handleChainExpression_1.handleChainExpression),
    ClassBody: results_1.onExit(propagateChildResults_1.propagateChildResults),
    ClassDeclaration: results_1.onExit(handleClassDeclaration_1.handleClassDeclaration),
    // not a typo, `Declaration` in `handleClassDeclaration` for `ClassExpression` is intentional.
    ClassExpression: results_1.onExit(handleClassDeclaration_1.handleClassDeclaration),
    ClassProperty: results_1.defaultHandler,
    ConditionalExpression: results_1.onExit(handleConditionalExpression_1.handleConditionalExpression),
    ContinueStatement: results_1.defaultHandler,
    DebuggerStatement: results_1.defaultHandler,
    Decorator: results_1.onExit(propagateChildResults_1.propagateChildResults),
    DoWhileStatement: results_1.defaultHandler,
    EmptyStatement: results_1.defaultHandler,
    ExportAllDeclaration: results_1.onExit(moduleSystems.handleExportAllDeclaration),
    ExportDefaultDeclaration: results_1.onExit(moduleSystems.handleExportDefaultDeclaration),
    ExportNamedDeclaration: results_1.onExit(moduleSystems.handleExportNamedDeclaration),
    ExportSpecifier: results_1.onExit(moduleSystems.handleExportSpecifier),
    ExpressionStatement: results_1.defaultHandler,
    ForInStatement: results_1.onExit(handleForInStatement_1.handleForInStatement),
    ForOfStatement: results_1.onExit(handleForOfStatement_1.handleForOfStatement),
    ForStatement: results_1.defaultHandler,
    FunctionDeclaration: handleFunctionDeclaration_1.handleFunctionDeclaration,
    FunctionExpression: handleFunctionExpression_1.handleFunctionExpression,
    Identifier: results_1.onExit(handleIdentifier_1.handleIdentifier),
    IfStatement: results_1.defaultHandler,
    ImportDeclaration: results_1.onExit(moduleSystems.handleImportDeclaration),
    ImportDefaultSpecifier: results_1.onExit(moduleSystems.handleImportDefaultSpecifier),
    ImportExpression: results_1.onExit(moduleSystems.handleImportExpression),
    ImportNamespaceSpecifier: results_1.onExit(moduleSystems.handleImportNamespaceSpecifier),
    ImportSpecifier: results_1.onExit(moduleSystems.handleImportSpecifier),
    JSXAttribute: results_1.onExit(handleJSXAttribute_1.handleJSXAttribute),
    JSXClosingElement: results_1.defaultHandler,
    JSXClosingFragment: results_1.defaultHandler,
    JSXElement: results_1.onExit(handleJSXElement_1.handleJSXElement),
    JSXEmptyExpression: results_1.defaultJSXChildHandler,
    JSXExpressionContainer: results_1.onExit(handleJSXExpressionContainer_1.handleJSXExpressionContainer),
    JSXFragment: results_1.defaultJSXChildHandler,
    JSXIdentifier: results_1.onExit(handleJSXIdentifier_1.handleJSXIdentifier),
    JSXMemberExpression: results_1.onExit(handleJSXMemberExpression_1.handleJSXMemberExpression),
    JSXOpeningElement: results_1.onExit(handleJSXOpeningElement_1.handleJSXOpeningElement),
    JSXOpeningFragment: results_1.defaultHandler,
    JSXSpreadAttribute: results_1.onExit(handleJSXSpreadAttribute_1.handleJSXSpreadAttribute),
    JSXSpreadChild: results_1.defaultJSXChildHandler,
    JSXText: results_1.defaultJSXChildHandler,
    LabeledStatement: results_1.defaultHandler,
    Literal: results_1.onExit(handleLiteral_1.handleLiteral),
    LogicalExpression: results_1.onExit(handleLogicalExpression_1.handleLogicalExpression),
    MemberExpression: results_1.onExit(handleMemberExpression_1.handleMemberExpression),
    MetaProperty: results_1.defaultHandler,
    MethodDefinition: results_1.onExit(handleMethodDefinition_1.handleMethodDefinition),
    NewExpression: results_1.onExit(handleNew_1.handleNew),
    ObjectExpression: results_1.onExit(handleObjectExpression_1.handleObjectExpression),
    ObjectPattern: results_1.onExit(handleObjectPattern_1.handleObjectPattern),
    Program: handleProgram_1.handleProgram,
    Property: results_1.onExit(handleProperty_1.handleProperty),
    RestElement: results_1.onExit(handleRestElement_1.handleRestElement),
    ReturnStatement: results_1.onExit(handleReturn_1.handleReturn),
    SequenceExpression: results_1.onExit(handleSequenceExpression_1.handleSequenceExpression),
    SpreadElement: results_1.onExit(handleSpreadElement_1.handleSpreadElement),
    Super: results_1.onExit(handleSuper_1.handleSuper),
    SwitchCase: results_1.defaultHandler,
    SwitchStatement: results_1.defaultHandler,
    TaggedTemplateExpression: results_1.onExit(handleTaggedTemplateExpression_1.handleTaggedTemplateExpression),
    TemplateElement: results_1.onExit(handleTemplateElement_1.handleTemplateElement),
    TemplateLiteral: results_1.onExit(handleTemplateLiteral_1.handleTemplateLiteral),
    ThisExpression: results_1.onExit(handleThis_1.handleThis),
    ThrowStatement: results_1.defaultHandler,
    TryStatement: results_1.defaultHandler,
    TSAbstractClassProperty: results_1.defaultHandler,
    TSAbstractKeyword: results_1.defaultHandler,
    TSAbstractMethodDefinition: results_1.defaultHandler,
    TSAnyKeyword: results_1.defaultHandler,
    TSArrayType: results_1.defaultHandler,
    TSAsExpression: results_1.onExit(handleTSAsExpression_1.handleTSAsExpression),
    TSAsyncKeyword: results_1.defaultHandler,
    TSBigIntKeyword: results_1.defaultHandler,
    TSBooleanKeyword: results_1.defaultHandler,
    TSCallSignatureDeclaration: results_1.defaultHandler,
    TSClassImplements: results_1.defaultHandler,
    TSConditionalType: results_1.defaultHandler,
    TSConstructorType: results_1.defaultHandler,
    TSConstructSignatureDeclaration: results_1.defaultHandler,
    TSDeclareFunction: results_1.defaultHandler,
    TSDeclareKeyword: results_1.defaultHandler,
    TSEmptyBodyFunctionExpression: results_1.defaultHandler,
    TSEnumDeclaration: results_1.defaultHandler,
    TSEnumMember: results_1.defaultHandler,
    TSExportAssignment: results_1.onExit(moduleSystems.handleExportAssignment),
    TSExportKeyword: results_1.defaultHandler,
    TSExternalModuleReference: results_1.defaultHandler,
    TSFunctionType: results_1.defaultHandler,
    TSImportEqualsDeclaration: results_1.onExit(moduleSystems.handleImportEquals),
    TSImportType: results_1.defaultHandler,
    TSIndexedAccessType: results_1.defaultHandler,
    TSIndexSignature: results_1.defaultHandler,
    TSInferType: results_1.defaultHandler,
    TSInterfaceBody: results_1.defaultHandler,
    TSInterfaceDeclaration: results_1.defaultHandler,
    TSInterfaceHeritage: results_1.defaultHandler,
    TSIntersectionType: results_1.defaultHandler,
    TSLiteralType: results_1.defaultHandler,
    TSMappedType: results_1.defaultHandler,
    TSMethodSignature: results_1.defaultHandler,
    TSModuleBlock: results_1.defaultHandler,
    TSModuleDeclaration: results_1.defaultHandler,
    TSNamedTupleMember: results_1.defaultHandler,
    TSNamespaceExportDeclaration: results_1.defaultHandler,
    TSNeverKeyword: results_1.defaultHandler,
    TSNonNullExpression: results_1.onExit(handleTSNonNullExpression_1.handleTSNonNullExpression),
    TSNullKeyword: results_1.defaultHandler,
    TSNumberKeyword: results_1.defaultHandler,
    TSObjectKeyword: results_1.defaultHandler,
    TSOptionalType: results_1.defaultHandler,
    TSParameterProperty: results_1.defaultHandler,
    TSParenthesizedType: results_1.defaultHandler,
    TSPrivateKeyword: results_1.defaultHandler,
    TSPrivateIdentifier: results_1.onExit(handleTSPrivateIdentifier_1.handleTSPrivateIdentifier),
    TSPropertySignature: results_1.defaultHandler,
    TSProtectedKeyword: results_1.defaultHandler,
    TSPublicKeyword: results_1.defaultHandler,
    TSQualifiedName: results_1.defaultHandler,
    TSReadonlyKeyword: results_1.defaultHandler,
    TSRestType: results_1.defaultHandler,
    TSStaticKeyword: results_1.defaultHandler,
    TSStringKeyword: results_1.defaultHandler,
    TSSymbolKeyword: results_1.defaultHandler,
    TSTemplateLiteralType: results_1.defaultHandler,
    TSThisType: results_1.defaultHandler,
    TSTupleType: results_1.defaultHandler,
    TSTypeAliasDeclaration: results_1.defaultHandler,
    TSTypeAnnotation: results_1.defaultHandler,
    TSTypeAssertion: results_1.onExit(handleTSTypeAssertion_1.handleTSTypeAssertion),
    TSTypeLiteral: results_1.defaultHandler,
    TSTypeOperator: results_1.defaultHandler,
    TSTypeParameter: results_1.defaultHandler,
    TSTypeParameterDeclaration: results_1.defaultHandler,
    TSTypeParameterInstantiation: results_1.defaultHandler,
    TSTypePredicate: results_1.defaultHandler,
    TSTypeQuery: results_1.defaultHandler,
    TSTypeReference: results_1.defaultHandler,
    TSUndefinedKeyword: results_1.defaultHandler,
    TSUnionType: results_1.defaultHandler,
    TSUnknownKeyword: results_1.defaultHandler,
    TSVoidKeyword: results_1.defaultHandler,
    UnaryExpression: results_1.onExit(handleUnaryExpression_1.handleUnaryExpression),
    UpdateExpression: results_1.defaultHandler,
    VariableDeclaration: results_1.onExit(handleVariableDeclaration_1.handleVariableDeclaration),
    VariableDeclarator: results_1.onExit(handleVariableDeclarator_1.handleVariableDeclarator),
    WhileStatement: results_1.defaultHandler,
    WithStatement: results_1.defaultHandler,
    YieldExpression: results_1.defaultHandler,
};
__exportStar(require("./results"), exports);
//# sourceMappingURL=index.js.map