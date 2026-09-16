// `server-only` is provided by the Next.js bundler, not a real installable
// package, so it can't be resolved by Vitest/Node. Aliased to this empty module
// in vitest.config.ts so server modules (which import "server-only") are still
// unit-testable.
export {};
