/**
 * Container error handling and formatting utilities.
 */

import type { Constructor } from "./Types/Constructors";
import type { Token } from "./Types/Tokens";
import type { ContainerErrorInfo, ResolutionContext } from "./Types/Diagnostics";
import { isToken } from "../Tokens/CreateToken";

export class ContainerErrors {
	/**
	 * Creates a resolution context for dependency tracking.
	 */
	static CreateContext(): ResolutionContext {
		return {
			Chain: [],
		};
	}

	/**
	 * Gets the display name for a token or constructor.
	 */
	static GetTokenName(token: Token | Constructor): string {
		if (token === undefined || token === (undefined as unknown)) {
			return "undefined";
		}
		if (isToken(token)) {
			return token.__description || "UnknownToken";
		}
		return (token as unknown as { name?: string }).name || "UnknownClass";
	}

	/**
	 * Formats a resolution chain for display.
	 */
	static FormatChain(chain: (Token | Constructor)[]): string {
		if (chain.size() === 0) return "[]";

		const names = chain.map((t) => this.GetTokenName(t));
		return names.join(" → ");
	}

	/**
	 * Checks if a token is already in the resolution chain (circular dependency).
	 */
	static IsCircular(token: Token | Constructor, context: ResolutionContext): boolean {
		return context.Chain.includes(token);
	}

	/**
	 * Creates a circular dependency error.
	 */
	static CircularDependency(token: Token | Constructor, context: ResolutionContext): never {
		const chain = [...context.Chain, token];
		const errorInfo: ContainerErrorInfo = {
			Type: "CircularDependency",
			Message: `Circular dependency detected`,
			Token: token,
			ResolutionChain: chain,
			Context: this.FormatChain(chain),
		};

		error(this.FormatError(errorInfo));
	}

	/**
	 * Creates a missing registration error.
	 */
	static MissingRegistration(token: Token | Constructor, context?: ResolutionContext): never {
		const chain = context ? [...context.Chain, token] : [token];
		const errorInfo: ContainerErrorInfo = {
			Type: "MissingRegistration",
			Message: `Service not registered`,
			Token: token,
			ResolutionChain: chain,
			Context: context ? this.FormatChain(chain) : this.GetTokenName(token),
		};

		error(this.FormatError(errorInfo));
	}

	/**
	 * Creates an invalid token error.
	 */
	static InvalidToken(token: unknown, context?: ResolutionContext): never {
		const errorInfo: ContainerErrorInfo = {
			Type: "InvalidToken",
			Message: `Invalid token type`,
			Token: token as Token | Constructor,
			ResolutionChain: context?.Chain,
			Context: `Expected Token or Constructor, got ${typeOf(token)}`,
		};

		error(this.FormatError(errorInfo));
	}

	/**
	 * Creates a lifetime violation error.
	 */
	static LifetimeViolation(
		token: Token | Constructor,
		reason: string,
		context?: ResolutionContext,
	): never {
		const errorInfo: ContainerErrorInfo = {
			Type: "LifetimeViolation",
			Message: `Lifetime violation`,
			Token: token,
			ResolutionChain: context?.Chain,
			Context: reason,
		};

		error(this.FormatError(errorInfo));
	}

	/**
	 * Creates a constructor error with context.
	 */
	static ConstructorError(
		token: Token | Constructor,
		originalError: unknown,
		context?: ResolutionContext,
	): never {
		const errorInfo: ContainerErrorInfo = {
			Type: "ConstructorError",
			Message: `Error constructing service`,
			Token: token,
			ResolutionChain: context?.Chain,
			Context: `${originalError}`,
		};

		error(this.FormatError(errorInfo));
	}

	/**
	 * Creates a duplicate registration error.
	 */
	static DuplicateRegistration(token: Token | Constructor): never {
		const errorInfo: ContainerErrorInfo = {
			Type: "DuplicateRegistration",
			Message: `Duplicate registration`,
			Token: token,
			Context: `Service already registered: ${this.GetTokenName(token)}`,
		};

		error(this.FormatError(errorInfo));
	}

	/**
	 * Formats a container error with rich context.
	 */
	private static FormatError(info: ContainerErrorInfo): string {
		const lines: string[] = [];

		lines.push(`[OjaInjection] ${info.Type}: ${info.Message}`);
		lines.push(`  Service: ${this.GetTokenName(info.Token)}`);

		if (info.ResolutionChain && info.ResolutionChain.size() > 0) {
			lines.push(`  Resolution Chain:`);
			lines.push(`    ${this.FormatChain(info.ResolutionChain)}`);
		}

		if (info.Context) {
			lines.push(`  Details: ${info.Context}`);
		}

		return lines.join("\n");
	}
}
