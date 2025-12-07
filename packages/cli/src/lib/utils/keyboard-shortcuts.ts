/**
 * Keyboard shortcuts manager for the CLI.
 * 
 * Provides a centralized way to register and handle keyboard shortcuts.
 * Components can register callbacks that will be called when shortcuts are triggered.
 */

type ShortcutCallback = () => void

interface ShortcutCallbacks {
	toggleExamples?: ShortcutCallback
	toggleDocumentation?: ShortcutCallback
	setTab1?: ShortcutCallback
	setTab2?: ShortcutCallback
	setTab3?: ShortcutCallback
	setTab4?: ShortcutCallback
}

/** Maps key names to callback property names */
const keyToCallback: Record<string, keyof ShortcutCallbacks> = {
	e: 'toggleExamples',
	d: 'toggleDocumentation',
	'1': 'setTab1',
	'2': 'setTab2',
	'3': 'setTab3',
	'4': 'setTab4'
}

/** Input types that should ignore shortcuts (text-like inputs) */
const textInputTypes = new Set(['', 'text', 'search', 'email', 'password', 'url', 'tel', 'number'])

let callbacks: ShortcutCallbacks = {}

/**
 * Register shortcut callbacks from a component.
 * Returns an unsubscribe function.
 */
export function registerShortcuts(newCallbacks: ShortcutCallbacks): () => void {
	callbacks = { ...callbacks, ...newCallbacks }
	return () => {
		for (const key of Object.keys(newCallbacks) as (keyof ShortcutCallbacks)[]) {
			if (callbacks[key] === newCallbacks[key]) {
				delete callbacks[key]
			}
		}
	}
}

/**
 * Handle a keyboard event. Returns true if the event was handled.
 */
export function handleKeyboardShortcut(e: KeyboardEvent): boolean {
	if (!e.altKey) return false

	const target = e.target as HTMLElement
	if (target.tagName === 'TEXTAREA' || target.isContentEditable) return false
	if (target.tagName === 'INPUT' && textInputTypes.has((target as HTMLInputElement).type?.toLowerCase() ?? '')) {
		return false
	}

	const callbackKey = keyToCallback[e.key.toLowerCase()]
	const callback = callbackKey && callbacks[callbackKey]
	
	if (callback) {
		e.preventDefault()
		callback()
		return true
	}

	return false
}
