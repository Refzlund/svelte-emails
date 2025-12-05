/**
 * Client-side image cache that converts remote images to data URLs.
 * Uses a server-side proxy to bypass CORS restrictions.
 * Images are cached in memory and persist until hard reload.
 */

const imageCache = new Map<string, string>() // url -> data URL
const pendingFetches = new Map<string, Promise<string>>() // url -> fetch promise
const failedUrls = new Map<string, number>() // url -> timestamp of failure

// Failed URLs can be retried after this time (1 minute)
const FAILED_URL_TTL = 60 * 1000

// Image URL patterns to cache
const IMAGE_PATTERNS = [
	/\.(png|jpg|jpeg|gif|webp|svg|ico|bmp)(\?.*)?$/i,
	/fpoimg\.com/i,
	/placeholder/i,
	/\/image\//i,
	/\/img\//i
]

function shouldCacheUrl(url: string): boolean {
	return IMAGE_PATTERNS.some((pattern) => pattern.test(url))
}

/**
 * Fetch image via server proxy to bypass CORS, then convert to data URL
 */
async function fetchAsDataUrl(url: string): Promise<string> {
	// Skip if previously failed (unless TTL expired)
	const failedAt = failedUrls.get(url)
	if (failedAt && Date.now() - failedAt < FAILED_URL_TTL) {
		return url
	}

	try {
		// Use server proxy to bypass CORS
		const proxyUrl = `/__svelte-emails/proxy-image?url=${encodeURIComponent(url)}`
		const response = await fetch(proxyUrl)
		
		if (!response.ok) {
			throw new Error(`Proxy failed: ${response.status}`)
		}
		
		const blob = await response.blob()
		return new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = () => resolve(reader.result as string)
			reader.onerror = reject
			reader.readAsDataURL(blob)
		})
	} catch {
		// Mark as failed with timestamp so we can retry later
		failedUrls.set(url, Date.now())
		// Return original URL on failure (will load normally in iframe)
		return url
	}
}

async function getCachedImage(url: string): Promise<string> {
	// Return cached data URL if available
	if (imageCache.has(url)) {
		return imageCache.get(url)!
	}

	// Check if already fetching
	if (pendingFetches.has(url)) {
		return pendingFetches.get(url)!
	}

	// Start fetching
	const fetchPromise = fetchAsDataUrl(url).then((dataUrl) => {
		imageCache.set(url, dataUrl)
		pendingFetches.delete(url)
		return dataUrl
	})

	pendingFetches.set(url, fetchPromise)
	return fetchPromise
}

/**
 * Extract all image URLs from HTML content
 */
function extractImageUrls(html: string): string[] {
	const urls: string[] = []
	
	// Match src attributes in img tags
	const srcRegex = /<img[^>]+src=["']([^"']+)["']/gi
	let match
	while ((match = srcRegex.exec(html)) !== null) {
		const url = match[1]
		if (url.startsWith('http') && shouldCacheUrl(url)) {
			urls.push(url)
		}
	}

	// Match background-image URLs
	const bgRegex = /background(?:-image)?:\s*url\(["']?([^"')]+)["']?\)/gi
	while ((match = bgRegex.exec(html)) !== null) {
		const url = match[1]
		if (url.startsWith('http') && shouldCacheUrl(url)) {
			urls.push(url)
		}
	}

	return [...new Set(urls)] // dedupe
}

/**
 * Replace image URLs in HTML with cached data URLs
 */
function replaceImageUrls(html: string, urlMap: Map<string, string>): string {
	let result = html

	for (const [originalUrl, cachedUrl] of urlMap) {
		// Escape special regex characters in URL
		const escaped = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
		const regex = new RegExp(escaped, 'g')
		result = result.replace(regex, cachedUrl)
	}

	return result
}

/**
 * Creates a reactive image cache manager.
 * 
 * Strategy:
 * 1. Show HTML immediately with any already-cached images replaced
 * 2. Fetch uncached images via proxy in background
 * 3. Update HTML once all images are cached (eliminates CORS errors from extensions)
 */
export function createImageCache() {
	let isLoading = $state(false)
	let processedHtml = $state('')
	let currentRawHtml = ''
	// Track which raw HTML the processedHtml corresponds to
	let processedFromRawHtml = ''

	async function processHtml(html: string): Promise<void> {
		// Track current HTML to handle rapid changes
		currentRawHtml = html
		
		// If the processed HTML doesn't match the new raw HTML, reset it immediately
		// This prevents stale processed HTML from being used during navigation
		if (processedFromRawHtml !== html) {
			processedHtml = ''
		}
		
		const urls = extractImageUrls(html)

		// If no images to cache, return HTML as-is
		if (urls.length === 0) {
			processedHtml = html
			processedFromRawHtml = html
			return
		}

		// Separate cached and uncached URLs
		const cachedUrls = urls.filter((url) => imageCache.has(url))
		const uncachedUrls = urls.filter((url) => !imageCache.has(url))

		// Replace any already-cached images immediately
		if (cachedUrls.length > 0) {
			const urlMap = new Map(cachedUrls.map((url) => [url, imageCache.get(url)!]))
			processedHtml = replaceImageUrls(html, urlMap)
			processedFromRawHtml = html
		} else {
			processedHtml = html
			processedFromRawHtml = html
		}

		// If all images are cached, we're done
		if (uncachedUrls.length === 0) {
			return
		}

		// Fetch uncached images in background
		isLoading = true
		await Promise.all(uncachedUrls.map((url) => getCachedImage(url)))
		isLoading = false
		
		// Only update if this is still the current HTML (handles rapid navigation)
		if (currentRawHtml === html) {
			// Now replace ALL image URLs with cached versions
			const allUrlMap = new Map(urls.map((url) => [url, imageCache.get(url)!]))
			processedHtml = replaceImageUrls(html, allUrlMap)
			processedFromRawHtml = html
		}
	}

	function clearCache(): void {
		imageCache.clear()
		pendingFetches.clear()
	}

	return {
		get isLoading() { return isLoading },
		get processedHtml() { return processedHtml },
		processHtml,
		clearCache
	}
}
