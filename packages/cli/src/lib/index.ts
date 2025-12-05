// Frontend exports
export { emailStore } from './email-store.js'
export type { ViewMode } from './email-store.js'
export type { SafeEmail } from '../cli/types.js'
export {
	createHighlightManager,
	type HighlightLang,
	type HighlightState,
	type LoadingState
} from './highlight.svelte.js'
export { generateVersion } from './utils/index.js'
export type { HighlightRequest, HighlightResponse } from './highlight-types.js'
