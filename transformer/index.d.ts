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
import ts from "typescript";
interface TransformerConfig {
}
/**
 * Main transformer factory.
 * Called by roblox-ts during compilation.
 */
export default function (program: ts.Program, config?: TransformerConfig): (context: ts.TransformationContext) => (sourceFile: ts.SourceFile) => ts.SourceFile;
export {};
