// Suppress browser violation warnings about document.write()
// We use it intentionally for instant iframe updates
const originalWarn = console.warn
console.warn = (...args: unknown[]) => {
	if (typeof args[0] === 'string' && args[0].includes('document.write()')) return
	originalWarn.apply(console, args)
}
