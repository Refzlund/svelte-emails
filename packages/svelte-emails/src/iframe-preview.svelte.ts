/**
 * IframePreview scroll anchoring and morphdom utilities.
 * 
 * Provides scroll position preservation during content updates
 * by tracking anchor elements and their visual offsets.
 * 
 * ## Architecture Overview
 * 
 * This module handles two distinct scroll anchoring scenarios:
 * 
 * 1. **Width-based anchoring** (resize): When the preview container width changes,
 *    the content reflows. We use a DIRECT ELEMENT REFERENCE because the DOM
 *    doesn't change - only the layout does. This is fast and reliable.
 * 
 * 2. **Content-based anchoring** (editing): When HTML content changes via morphdom,
 *    DOM elements may be replaced. We use a SIGNATURE (tag + class + content + Y position)
 *    to find the "same" element after the DOM update.
 * 
 * ## Why Two Approaches?
 * 
 * - Direct references are faster and more accurate, but become invalid after morphdom
 * - Signatures survive DOM replacement but require lookup and may fail if content changes drastically
 * 
 * ## Coordinate System
 * 
 * The iframe doesn't scroll internally - the PARENT container scrolls.
 * - `element.getBoundingClientRect().top` = element's Y position from iframe top (document Y)
 * - `scrollContainer.scrollTop` = how far the parent has scrolled
 * - `offsetFromViewportTop = documentY - scrollTop` = visual position from viewport top
 * 
 * To restore scroll: `newScrollTop = newDocumentY - desiredOffsetFromViewportTop`
 */

import morphdom from 'morphdom'

// ============================================================================
// Types
// ============================================================================

/**
 * Anchor data for width-based scroll anchoring (resize).
 * 
 * Uses a direct element reference since the element persists during resize -
 * only the layout changes, not the DOM structure.
 */
export interface WidthAnchorData {
	/** Direct reference to the anchor element */
	element: Element
	/** Distance from viewport top before resize */
	offsetFromViewportTop: number
}

/**
 * Anchor data for content-based scroll anchoring (morphdom).
 * 
 * Uses a signature because morphdom may replace DOM elements entirely.
 * The signature helps us find the "same" logical element after replacement.
 */
export interface ContentAnchorData {
	/** Signature: "tag|className|contentPreview|approxY" to identify element after DOM changes */
	signature: string
	/** Distance from viewport top before content change */
	offsetFromViewportTop: number
}

// ============================================================================
// Constants
// ============================================================================

/** 
 * Selector for elements that can serve as scroll anchors.
 * 
 * These are block-level elements likely to have stable positions.
 * We exclude inline elements (span, a, etc.) as they're less reliable anchors.
 */
const ANCHOR_SELECTOR = 'h1, h2, h3, h4, h5, h6, p, div, table, img, section, article, header, footer'

/** Minimum element height (px) to be considered as an anchor */
const MIN_ANCHOR_HEIGHT = 10

/** Minimum scroll difference (px) to trigger scroll adjustment */
const SCROLL_TOLERANCE = 2

/** Content preview length for signature generation */
const SIGNATURE_CONTENT_LENGTH = 50

/** Partial match prefix length for fallback signature matching */
const SIGNATURE_PREFIX_LENGTH = 20

// ============================================================================
// Script Tag Stripping
// ============================================================================

/**
 * Strip script tags to prevent warnings in sandboxed iframes.
 * 
 * Note: Uses character code construction for the closing tag to avoid
 * false positives when bundlers scan for script tags in string literals.
 */
export function stripScriptTags(content: string): string {
	const endTag = String.fromCharCode(60) + '/script>'
	return content.replace(new RegExp('<script\\b[^>]*>[\\s\\S]*?' + endTag, 'gi'), '')
}

// ============================================================================
// Element Signatures (for content-based anchoring)
// ============================================================================

/**
 * Create a signature for an element to identify it after DOM changes.
 * 
 * Format: "tagName|className|contentPreview|approximateY"
 * 
 * We include approximate Y position (rounded to 50px) to distinguish between
 * multiple elements with the same tag/class/content (e.g., empty tables).
 * The rounding allows for small layout shifts while still being distinctive.
 * 
 * @example "div|my-class|This is the beginning...|250"
 */
function getElementSignature(el: Element): string {
	const tag = el.tagName.toLowerCase()
	const className = el.className || ''
	const contentPreview = (el.textContent || '').trim().slice(0, SIGNATURE_CONTENT_LENGTH)
	// Round Y position to nearest 50px to allow for small layout changes
	const approxY = Math.round(el.getBoundingClientRect().top / 50) * 50
	
	return `${tag}|${className}|${contentPreview}|${approxY}`
}

/**
 * Find an element by its signature in a document.
 * 
 * Uses a multi-pass approach for resilience:
 * 1. Exact match (tag + class + content + approx Y position)
 * 2. Match by tag + class + content (ignoring Y if content is distinctive)
 * 3. Match by tag + class + Y position (for empty-content elements)
 * 4. Partial content match (first 20 chars)
 * 
 * Performance: Early-exits on first match
 */
function findElementBySignature(doc: Document, signature: string): Element | null {
	const elements = doc.body?.querySelectorAll(ANCHOR_SELECTOR)
	if (!elements) return null
	
	const parts = signature.split('|')
	const tag = parts[0]
	const className = parts[1]
	const contentPreview = parts[2]
	const approxY = parts[3] ? parseInt(parts[3], 10) : null
	
	// Pass 1: Exact match including Y position
	for (const el of elements) {
		if (el.tagName.toLowerCase() !== tag) continue
		if ((el.className || '') !== className) continue
		
		const elContent = (el.textContent || '').trim().slice(0, SIGNATURE_CONTENT_LENGTH)
		if (elContent !== contentPreview) continue
		
		if (approxY !== null) {
			const elApproxY = Math.round(el.getBoundingClientRect().top / 50) * 50
			// Allow some tolerance (100px = 2 rounding steps)
			if (Math.abs(elApproxY - approxY) <= 100) {
				return el
			}
		} else {
			return el
		}
	}
	
	// Pass 2: Match by content only (if content is distinctive - more than 10 chars)
	if (contentPreview && contentPreview.length > 10) {
		for (const el of elements) {
			if (el.tagName.toLowerCase() !== tag) continue
			if ((el.className || '') !== className) continue
			
			const elContent = (el.textContent || '').trim().slice(0, SIGNATURE_CONTENT_LENGTH)
			if (elContent === contentPreview) {
				return el
			}
		}
	}
	
	// Pass 3: Match by Y position only (for empty/short content elements)
	if (approxY !== null && (!contentPreview || contentPreview.length <= 10)) {
		for (const el of elements) {
			if (el.tagName.toLowerCase() !== tag) continue
			if ((el.className || '') !== className) continue
			
			const elApproxY = Math.round(el.getBoundingClientRect().top / 50) * 50
			if (Math.abs(elApproxY - approxY) <= 100) {
				return el
			}
		}
	}
	
	// Pass 4: Partial content match (fallback for minor edits)
	const targetPrefix = contentPreview.slice(0, SIGNATURE_PREFIX_LENGTH)
	if (targetPrefix && targetPrefix.length > 5) {
		for (const el of elements) {
			if (el.tagName.toLowerCase() !== tag) continue
			if ((el.className || '') !== className) continue
			
			const elPrefix = (el.textContent || '').trim().slice(0, SIGNATURE_PREFIX_LENGTH)
			if (elPrefix === targetPrefix) {
				return el
			}
		}
	}
	
	return null
}

// ============================================================================
// Anchor Finding (shared by both anchoring strategies)
// ============================================================================

/**
 * Find a stable anchor element near the top of the visible viewport.
 * 
 * ## Selection Strategy
 * 
 * We use a scoring system that prefers elements 10-200px below the viewport top:
 * 
 * - **10-200px range (ideal)**: Elements solidly in view, stable position
 * - **0-10px range (penalized)**: Too close to edge, margin collapse can cause drift
 * - **>200px (heavily penalized)**: Too far down, less relevant to user's focus
 * - **-50 to 0px (penalized)**: Partially above viewport, acceptable fallback
 * 
 * ## Why avoid the viewport edge?
 * 
 * Elements at exactly 0px offset are prone to "drift" because:
 * 1. CSS margin collapse can change their effective position
 * 2. Headings (h1, h2) often have large top margins that collapse differently
 * 3. Small rounding errors become noticeable at the edge
 * 
 * By preferring elements 10+ pixels into the viewport, we get more stable anchors.
 * 
 * ## Performance
 * 
 * Single pass through elements, O(n) where n = number of anchor candidates.
 * getBoundingClientRect() calls are batched by the browser's layout engine.
 */
export function findAnchorElement(
	doc: Document,
	scrollTop: number
): { element: Element; offsetFromViewportTop: number } | null {
	const body = doc.body
	if (!body) return null
	
	const elements = body.querySelectorAll(ANCHOR_SELECTOR)
	let bestMatch: { element: Element; offsetFromViewportTop: number } | null = null
	let bestScore = Infinity
	
	for (const el of elements) {
		const rect = el.getBoundingClientRect()
		
		// Skip tiny elements (likely invisible or decorative)
		if (rect.height < MIN_ANCHOR_HEIGHT) continue
		
		// Calculate visual offset from viewport top
		// Positive = below viewport top, Negative = above viewport top
		const offsetFromViewportTop = rect.top - scrollTop
		
		// Skip elements too far above viewport (not useful as anchors)
		if (offsetFromViewportTop < -50) continue
		
		// Score calculation: lower is better
		let score: number
		if (offsetFromViewportTop >= 10 && offsetFromViewportTop <= 200) {
			// Ideal range - element is solidly visible
			score = offsetFromViewportTop
		} else if (offsetFromViewportTop >= 0 && offsetFromViewportTop < 10) {
			// Right at viewport edge - penalize due to margin collapse issues
			score = offsetFromViewportTop + 100
		} else if (offsetFromViewportTop > 200) {
			// Too far down the page
			score = offsetFromViewportTop + 500
		} else {
			// Slightly above viewport (-50 to 0)
			score = Math.abs(offsetFromViewportTop) + 200
		}
		
		if (score < bestScore) {
			bestScore = score
			bestMatch = { element: el, offsetFromViewportTop }
		}
	}
	
	return bestMatch
}

// ============================================================================
// Width-based Scroll Anchoring (for container resize)
// ============================================================================

/**
 * Snapshot anchor position before width change.
 * 
 * Returns a direct element reference since resize doesn't change the DOM,
 * only the layout. This is more reliable than signature-based lookup.
 */
export function snapshotWidthAnchor(
	doc: Document,
	scrollTop: number
): WidthAnchorData | null {
	return findAnchorElement(doc, scrollTop)
}

/**
 * Restore scroll position after width change.
 * 
 * Uses the direct element reference to get the element's new position
 * after reflow, then calculates the scroll needed to maintain the same
 * visual offset from viewport top.
 * 
 * The `void scrollContainer.offsetHeight` forces a synchronous layout,
 * ensuring the height change is applied before we set scrollTop.
 * Without this, the browser may batch the operations and cause flicker.
 */
export function restoreWidthScroll(
	scrollContainer: HTMLElement,
	heightTarget: HTMLElement,
	anchorData: WidthAnchorData,
	newHeight: number
): void {
	// Get element's new document Y after reflow
	const anchorTopNow = anchorData.element.getBoundingClientRect().top
	
	// Calculate scroll to maintain same visual offset
	const newScrollTop = anchorTopNow - anchorData.offsetFromViewportTop
	
	// Update height and scroll synchronously to prevent flicker
	heightTarget.style.height = `${newHeight}px`
	void scrollContainer.offsetHeight // Force synchronous layout
	scrollContainer.scrollTop = Math.max(0, newScrollTop)
}

// ============================================================================
// Content-based Scroll Anchoring (for morphdom updates)
// ============================================================================

/**
 * Snapshot anchor position before content change.
 * 
 * Returns a signature-based anchor because morphdom may replace DOM elements.
 * We can't use direct references since they may become invalid.
 */
export function snapshotContentAnchor(
	doc: Document,
	scrollTop: number
): ContentAnchorData | null {
	const anchor = findAnchorElement(doc, scrollTop)
	if (!anchor) return null
	
	return {
		signature: getElementSignature(anchor.element),
		offsetFromViewportTop: anchor.offsetFromViewportTop
	}
}

/**
 * Restore scroll position after content change.
 * 
 * Looks up the anchor element by signature, then calculates the scroll
 * needed to maintain the same visual offset.
 * 
 * Only adjusts scroll if the difference exceeds SCROLL_TOLERANCE (2px)
 * to prevent micro-drift from subpixel rendering differences.
 * 
 * If anchor not found, preserves current scroll position.
 */
export function restoreContentScroll(
	doc: Document,
	scrollContainer: HTMLElement,
	heightTarget: HTMLElement,
	anchorData: ContentAnchorData,
	newHeight: number
): void {
	const anchorEl = findElementBySignature(doc, anchorData.signature)
	const currentScroll = scrollContainer.scrollTop
	
	// Update height first
	heightTarget.style.height = `${newHeight}px`
	
	if (anchorEl) {
		const newScrollTop = anchorEl.getBoundingClientRect().top - anchorData.offsetFromViewportTop
		
		// Only adjust if difference is significant (prevents micro-drift)
		if (Math.abs(newScrollTop - currentScroll) > SCROLL_TOLERANCE) {
			void scrollContainer.offsetHeight // Force synchronous layout
			scrollContainer.scrollTop = Math.max(0, newScrollTop)
		}
	} else {
		// Anchor not found - preserve current scroll position
		void scrollContainer.offsetHeight
		scrollContainer.scrollTop = currentScroll
	}
}

// ============================================================================
// Height Calculation
// ============================================================================

/**
 * Calculate the content height of an iframe document.
 * 
 * Uses multiple measurement techniques and takes the maximum to ensure
 * all content is visible without scrolling. This handles edge cases like:
 * - Margin collapse at document edges
 * - Subpixel rendering differences
 * - Different browser measurement behaviors
 * - Floated or absolutely positioned elements
 * 
 * The measurements used:
 * - `body.scrollHeight`: Content height including overflow
 * - `body.offsetHeight`: Rendered height including borders
 * - `documentElement.scrollHeight`: Full document scroll height
 * - `documentElement.offsetHeight`: Full document rendered height
 * 
 * Body margins are added since they contribute to visual height but
 * aren't always included in scrollHeight/offsetHeight measurements.
 * 
 * `Math.ceil()` ensures subpixel values don't cause 1px scroll gaps.
 */
export function calculateContentHeight(doc: Document): number {
	const body = doc.body
	const html = doc.documentElement
	if (!body) return 0
	
	const bodyStyle = doc.defaultView?.getComputedStyle(body)
	const marginTop = parseFloat(bodyStyle?.marginTop || '0')
	const marginBottom = parseFloat(bodyStyle?.marginBottom || '0')
	const bodyMargins = marginTop + marginBottom
	
	// Take maximum of all measurement approaches for robustness
	const height = Math.max(
		body.scrollHeight,
		body.offsetHeight,
		html.scrollHeight,
		html.offsetHeight
	)
	
	return Math.ceil(height + bodyMargins)
}

// ============================================================================
// Morphdom Integration
// ============================================================================

/** 
 * Morphdom options for <head> element.
 * 
 * Preserves essential meta tags that shouldn't be removed during updates:
 * - charset: Document encoding (removing would break character rendering)
 * - viewport: Mobile scaling configuration (removing would break layout)
 */
export const headMorphOptions = {
	onBeforeNodeDiscarded(node: Node) {
		if (node instanceof HTMLMetaElement) {
			if (node.hasAttribute('charset') || node.getAttribute('name') === 'viewport') {
				return false // Don't discard these meta tags
			}
		}
		return true
	}
}

/** 
 * Morphdom options for <body> element.
 * 
 * Preserves images with unchanged src to avoid reload flicker.
 * When an image has the same src, we sync its other attributes
 * without triggering a network request for the image data.
 * 
 * This is important for email previews which often have many images -
 * without this optimization, every content change would reload all images.
 */
export const bodyMorphOptions = {
	onBeforeElUpdated(fromEl: Element, toEl: Element) {
		if (
			fromEl instanceof HTMLImageElement &&
			toEl instanceof HTMLImageElement &&
			fromEl.src === toEl.src
		) {
			// Image src unchanged - sync attributes without reload
			if (fromEl.alt !== toEl.alt) fromEl.alt = toEl.alt
			if (fromEl.width !== toEl.width) fromEl.width = toEl.width
			if (fromEl.height !== toEl.height) fromEl.height = toEl.height
			const newStyle = toEl.getAttribute('style')
			if (fromEl.getAttribute('style') !== newStyle) {
				fromEl.setAttribute('style', newStyle || '')
			}
			return false // Don't replace the element
		}
		return true
	}
}

/**
 * Apply new HTML to an iframe document using morphdom.
 * 
 * Morphdom efficiently diffs the DOM and applies minimal changes,
 * preserving element identity where possible. This is crucial for:
 * - Avoiding image reload flicker
 * - Preserving form input state
 * - Maintaining scroll position (with our anchoring system)
 * 
 * Performance: morphdom is highly optimized, typically O(n) where n = DOM nodes.
 * The DOMParser call is the main overhead but is unavoidable for HTML string input.
 */
export function morphHtmlToDocument(doc: Document, newHtml: string): void {
	const newDoc = new DOMParser().parseFromString(newHtml, 'text/html')
	if (doc.head && newDoc.head) morphdom(doc.head, newDoc.head, headMorphOptions)
	if (doc.body && newDoc.body) morphdom(doc.body, newDoc.body, bodyMorphOptions)
}

// ============================================================================
// Image Load Handling
// ============================================================================

/**
 * Setup load listeners on images that haven't finished loading.
 * 
 * When images load, they may change the document height, requiring
 * a height recalculation. We use { once: true } to auto-cleanup listeners.
 * 
 * Performance: Only attaches listeners to incomplete images, avoiding
 * unnecessary event overhead for cached/complete images.
 */
export function setupImageLoadListeners(doc: Document, onLoad: () => void): void {
	const images = doc.querySelectorAll('img')
	for (const img of images) {
		if (img.complete) continue
		img.addEventListener('load', onLoad, { once: true })
		img.addEventListener('error', onLoad, { once: true })
	}
}

// ============================================================================
// Mouse Event Forwarding
// ============================================================================

/**
 * Convert iframe-local mouse coordinates to parent viewport coordinates.
 * 
 * Events inside the iframe have coordinates relative to the iframe's viewport.
 * This converts them to coordinates relative to the parent document's viewport,
 * enabling effects like cursor tracking across the iframe boundary.
 */
export function toViewportCoords(
	e: MouseEvent,
	iframeElement: HTMLIFrameElement
): { clientX: number; clientY: number } {
	const rect = iframeElement.getBoundingClientRect()
	return {
		clientX: rect.left + e.clientX,
		clientY: rect.top + e.clientY
	}
}
