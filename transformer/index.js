"use strict";
/**
 * OjaInjection Transformer
 *
 * Automatically tracks constructor parameters for dependency injection.
 * Generates metadata storage code at compile time.
 *
 * What it does:
 * 1. Finds classes decorated with @Singleton, @Scoped, @Factory
 * 2. Analyzes constructor parameters
 * 3. Generates Reflect.DefineMetadata calls to store parameter types
 *
 * This enables autowiring for concrete classes while still supporting
 * interface injection via @Inject(token).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const typescript_1 = __importDefault(require("typescript"));
/**
 * Main transformer factory.
 * Called by roblox-ts during compilation.
 */
function default_1(program, config) {
    return (context) => {
        return (sourceFile) => {
            // Collect metadata statements to add at the end
            const metadataStatements = [];
            // Visit all nodes in the source file
            const visitor = createVisitor(context, sourceFile, metadataStatements);
            const visitedFile = typescript_1.default.visitNode(sourceFile, visitor);
            // Add metadata statements at the end of the file
            if (metadataStatements.length > 0) {
                return context.factory.updateSourceFile(visitedFile, [
                    ...visitedFile.statements,
                    ...metadataStatements,
                ]);
            }
            return visitedFile;
        };
    };
}
/**
 * Creates a visitor function that processes each node in the AST.
 */
function createVisitor(context, sourceFile, metadataStatements) {
    const factory = context.factory;
    const visitor = (node) => {
        // Check if this is a class declaration
        if (typescript_1.default.isClassDeclaration(node) && node.name) {
            // Check if class has our lifetime decorators
            if (hasLifetimeDecorator(node)) {
                // Extract constructor parameters
                const constructor = getConstructor(node);
                if (constructor && constructor.parameters.length > 0) {
                    // Generate metadata storage statements
                    const generatedStatements = generateParameterMetadata(factory, node.name, constructor.parameters, sourceFile);
                    // Add to our collection (will be added at end of file)
                    metadataStatements.push(...generatedStatements);
                }
            }
            // Return the class node unchanged
            return node;
        }
        // For all other nodes, continue visiting children
        return typescript_1.default.visitEachChild(node, visitor, context);
    };
    return visitor;
}
/**
 * Checks if a class has @Singleton, @Scoped, or @Factory decorator.
 */
function hasLifetimeDecorator(node) {
    if (!node.modifiers)
        return false;
    return node.modifiers.some((modifier) => {
        if (!typescript_1.default.isDecorator(modifier))
            return false;
        const expression = modifier.expression;
        if (!typescript_1.default.isCallExpression(expression))
            return false;
        const decoratorName = expression.expression.getText();
        return decoratorName === "Singleton" || decoratorName === "Scoped" || decoratorName === "Factory";
    });
}
/**
 * Gets the constructor from a class declaration.
 */
function getConstructor(node) {
    for (const member of node.members) {
        if (typescript_1.default.isConstructorDeclaration(member)) {
            return member;
        }
    }
    return undefined;
}
/**
 * Generates Reflect.DefineMetadata statements for constructor parameters.
 */
function generateParameterMetadata(factory, className, parameters, sourceFile) {
    // Extract parameter type information
    const parameterTypes = [];
    for (const param of parameters) {
        // Skip if parameter has @Inject decorator (decorator handles it)
        if (hasInjectDecorator(param)) {
            parameterTypes.push(undefined);
            continue;
        }
        // Skip @RuntimeParameter
        if (hasRuntimeParameterDecorator(param)) {
            parameterTypes.push(undefined);
            continue;
        }
        // Get parameter type
        const typeName = getParameterTypeName(param, sourceFile);
        parameterTypes.push(typeName ?? undefined);
    }
    // Generate: Reflect.DefineMetadata(ClassName, MetadataKeys.Dependencies, [Type1, Type2, ...])
    const statements = [];
    // Only generate if we have parameter types to store
    const hasTypes = parameterTypes.some((t) => t !== undefined);
    if (hasTypes) {
        // Create array of parameter types (or undefined for @Inject params)
        const paramArray = factory.createArrayLiteralExpression(parameterTypes.map((typeName) => {
            if (typeName === undefined) {
                return factory.createIdentifier("undefined");
            }
            return factory.createIdentifier(typeName);
        }));
        // Reflect.DefineMetadata(ClassName, MetadataKeys.Dependencies, [...])
        const metadataCall = factory.createExpressionStatement(factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier("Reflect"), factory.createIdentifier("DefineMetadata")), undefined, [
            className, // Class constructor
            factory.createPropertyAccessExpression(factory.createIdentifier("MetadataKeys"), factory.createIdentifier("Dependencies")),
            paramArray,
        ]));
        statements.push(metadataCall);
    }
    return statements;
}
/**
 * Checks if parameter has @Inject decorator.
 */
function hasInjectDecorator(param) {
    if (!param.modifiers)
        return false;
    return param.modifiers.some((modifier) => {
        if (!typescript_1.default.isDecorator(modifier))
            return false;
        const expression = modifier.expression;
        if (!typescript_1.default.isCallExpression(expression))
            return false;
        return expression.expression.getText() === "Inject";
    });
}
/**
 * Checks if parameter has @RuntimeParameter decorator.
 */
function hasRuntimeParameterDecorator(param) {
    if (!param.modifiers)
        return false;
    return param.modifiers.some((modifier) => {
        if (!typescript_1.default.isDecorator(modifier))
            return false;
        const expression = modifier.expression;
        if (!typescript_1.default.isCallExpression(expression))
            return false;
        return expression.expression.getText() === "RuntimeParameter";
    });
}
/**
 * Extracts the type name from a parameter declaration.
 */
function getParameterTypeName(param, sourceFile) {
    if (!param.type)
        return undefined;
    // Get the type text
    const typeText = param.type.getText(sourceFile);
    // For type references (like AudioManager, ILogger), return the identifier
    if (typescript_1.default.isTypeReferenceNode(param.type)) {
        const typeName = param.type.typeName;
        if (typescript_1.default.isIdentifier(typeName)) {
            return typeName.text;
        }
    }
    // For other types, return the text representation
    return typeText;
}
