/**
 * Persisted preview width state for email viewer iframe.
 * 
 * Stores the preview width percentage (10-100%) in localStorage so it
 * persists across sessions. The width can be changed by dragging the
 * edges of the EmailPreview component.
 * 
 * @see ARCHITECTURE_CLI.md for usage details
 */

const STORAGE_KEY = 'svelte-emails-preview-width'
const DEFAULT_WIDTH = 80

function loadWidth(): number {
	if (typeof localStorage === 'undefined') return DEFAULT_WIDTH
	
	const stored = localStorage.getItem(STORAGE_KEY)
	if (!stored) return DEFAULT_WIDTH
	
	const parsed = parseFloat(stored)
	if (isNaN(parsed) || parsed < 10 || parsed > 100) return DEFAULT_WIDTH
	
	return parsed
}

function saveWidth(width: number): void {
	if (typeof localStorage === 'undefined') return
	localStorage.setItem(STORAGE_KEY, String(width))
}

export function createPreviewWidth() {
	let width = $state(loadWidth())

	return {
		get value() {
			return width
		},
		set value(newWidth: number) {
			width = Math.max(10, Math.min(100, newWidth))
		},
		persist() {
			saveWidth(width)
		}
	}
}
