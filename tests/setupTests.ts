import '@testing-library/jest-dom';

// Polyfills or global mocks can be added here if needed for the test environment.
// Provide TextEncoder/TextDecoder for libraries that expect them (node < 18 compatibility)
if (typeof (global as any).TextEncoder === 'undefined') {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { TextEncoder, TextDecoder } = require('util');
	(global as any).TextEncoder = TextEncoder;
	(global as any).TextDecoder = TextDecoder;
}

// Polyfill scrollIntoView for jsdom (used by Radix UI and others)
if (typeof window !== 'undefined' && typeof window.HTMLElement !== 'undefined') {
	// @ts-ignore
	if (!window.HTMLElement.prototype.scrollIntoView) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		window.HTMLElement.prototype.scrollIntoView = function () {};
	}
}
