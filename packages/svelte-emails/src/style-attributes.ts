/**
 * Email-Safe Style Attributes
 * 
 * This module defines Tailwind-like style attributes that are compatible with
 * email clients. Each category is documented with support levels.
 * 
 * ## Attribute Syntax Options
 * 
 * All bracket-style attributes support two syntax options:
 * 
 * 1. **Boolean syntax** (Tailwind-like): `<Div bg-[#ffffff] />`
 * 2. **Value syntax** (for variables): `<Div bg="#ffffff" />` or `<Div bg={myColor} />`
 * 
 * The value syntax enables using Svelte variables:
 * ```svelte
 * <script>
 *   let brandColor = '#ff6600'
 * </script>
 * <Div bg={brandColor}>Dynamic background!</Div>
 * ```
 * 
 * Support Legend:
 * - ✅ Safe (~95-100%) - Works in virtually all email clients
 * - ⚠️ Partial (~70-85%) - Works in most clients, but Outlook may ignore
 * - ❌ Avoid (~50-70%) - Limited support, use only as progressive enhancement
 * 
 * @see EMAIL_DEVELOPMENT_GUIDE.md for detailed compatibility information
 * @see CSS_UTILITIES_REFERENCE.md for utility-specific support matrices
 */

/** Boolean attributes: `{ 'attr-name': true }` - These are optional and accept true or boolean */
export type Attributes<T extends string> = { [K in T]?: boolean }

/** Value attributes: `{ 'attr': 'value' }` for use with Svelte variables */
export type ValueAttributes<T extends string> = { [K in T]?: string | number }

/** Numeric scales for spacing, sizing, etc. */
type Scales<T extends string> = 
	| `${T}-0` | `${T}-0.25` | `${T}-0.5` | `${T}-0.75` | `${T}-1` | `${T}-1.5` 
	| `${T}-2` | `${T}-2.5` 
	| `${T}-3` | `${T}-3.5`
	| `${T}-4` | `${T}-5` | `${T}-6` | `${T}-7` | `${T}-8` | `${T}-9` 
	| `${T}-10` | `${T}-11` | `${T}-12` | `${T}-14` | `${T}-16` 
	| `${T}-20` | `${T}-24` | `${T}-28` 
	| `${T}-32` | `${T}-36` | `${T}-40` | `${T}-44` | `${T}-48` | `${T}-52` | `${T}-56` | `${T}-60` 
	| `${T}-64` | `${T}-72` | `${T}-80` | `${T}-96`


// ============================================================================
// VALUE ATTRIBUTE TYPES (for Svelte variable support)
// ============================================================================

/**
 * Value-based sizing attributes.
 * Use these with Svelte variables: `<Div w={myWidth} />`
 */
export type SizingValueAttributes = ValueAttributes<
	| 'w' | 'h' | 'min-w' | 'max-w' | 'min-h'
>

/**
 * Value-based spacing attributes.
 * Use these with Svelte variables: `<Div p={myPadding} m={myMargin} />`
 */
export type SpacingValueAttributes = ValueAttributes<
	| 'p' | 'pt' | 'pr' | 'pb' | 'pl' | 'px' | 'py'
	| 'm' | 'mt' | 'mr' | 'mb' | 'ml' | 'mx' | 'my'
>

/**
 * Value-based color attributes.
 * Use these with Svelte variables: `<Div bg={myColor} text={textColor} />`
 */
export type ColorValueAttributes = ValueAttributes<
	| 'text' | 'bg'
	| 'text-opacity' | 'bg-opacity' | 'border-opacity'
>

/**
 * Value-based typography attributes.
 * Use these with Svelte variables: `<Text leading={myLineHeight} />`
 */
export type TypographyValueAttributes = ValueAttributes<
	| 'leading' | 'tracking'
>

/**
 * Value-based border attributes (excluding properties that have dual-purpose types).
 * Note: rounded and border properties are handled in dual-purpose types below.
 */
export type BorderValueAttributes = ValueAttributes<never>

/**
 * Dual-purpose border attributes.
 * These can be either boolean (enable border) or string (set border color/width).
 * - Boolean: `<Div border>` - enables default border
 * - String: `<Div border={colors.border}>` - sets border color
 */
export type BorderDualAttributes = {
	border?: boolean | string
	'border-t'?: boolean | string
	'border-r'?: boolean | string
	'border-b'?: boolean | string
	'border-l'?: boolean | string
	'border-x'?: boolean | string
	'border-y'?: boolean | string
}

/**
 * Dual-purpose rounded attributes.
 * These can be either boolean (enable rounding) or string/number (set radius).
 * - Boolean: `<Div rounded>` - enables default border radius
 * - String: `<Div rounded={radius}>` - sets custom radius
 */
export type RoundedDualAttributes = {
	rounded?: boolean | string | number
	'rounded-t'?: boolean | string | number
	'rounded-r'?: boolean | string | number
	'rounded-b'?: boolean | string | number
	'rounded-l'?: boolean | string | number
	'rounded-tl'?: boolean | string | number
	'rounded-tr'?: boolean | string | number
	'rounded-br'?: boolean | string | number
	'rounded-bl'?: boolean | string | number
}

/**
 * Value-based layout attributes.
 * Use these with Svelte variables: `<Div gap={myGap} />`
 * Note: cols and rows are handled separately as they accept both boolean and string values.
 */
export type LayoutValueAttributes = ValueAttributes<
	| 'gap' | 'span' | 'row-span' | 'cell-padding'
>

/**
 * Dual-purpose cols/rows attributes.
 * These can be either boolean (enable layout) or string (set template).
 * - Boolean: `<Div cols>` - enables column layout with auto-sizing
 * - String: `<Div cols="25% 75%">` - sets column widths
 */
export type ColsRowsAttributes = {
	cols?: boolean | string
	rows?: boolean | string
}

/**
 * Value-based effect attributes.
 * Use these with Svelte variables: `<Div opacity={myOpacity} />`
 */
export type EffectValueAttributes = ValueAttributes<
	| 'opacity'
>

/**
 * Value-based email-specific attributes.
 * Use these with Svelte variables: `<Email body-bg={myBg} mobile-threshold={breakpoint} />`
 */
export type EmailValueAttributes = ValueAttributes<
	| 'body-bg'
	| 'mobile-threshold'
>

/**
 * All value-based attributes combined.
 * These attributes accept string/number values for use with Svelte variables.
 */
export type AllValueAttributes = 
	& SizingValueAttributes
	& SpacingValueAttributes
	& ColorValueAttributes
	& TypographyValueAttributes
	& BorderValueAttributes
	& LayoutValueAttributes
	& EffectValueAttributes


// ============================================================================
// SIZING ATTRIBUTES
// ============================================================================

/**
 * ✅ Safe Width Utilities
 * 
 * Fixed pixel and percentage widths are universally supported.
 * Use `w-full` (100%) for fluid layouts.
 * 
 * **Note:** `w-screen` is supported as an alias for `w-full` (100%).
 * Actual viewport units (`100vw`) are not supported in email.
 * 
 * **Value syntax:** `<Div w="500px" />` or `<Div w={myWidth} />`
 */
export type SafeWidthAttributes = Attributes<
	| Scales<'w'> 
	| `w-[${string}]` 
	| 'w-full' | 'w-screen'
	| 'w-auto'
>

/**
 * ✅ Safe Height Utilities
 * 
 * Fixed pixel heights are supported. Use `h-auto` for content-driven height.
 * 
 * **Note:** `h-screen` is supported as an alias for `h-full` (100%).
 * Actual viewport units (`100vh`) are not supported in email.
 */
export type SafeHeightAttributes = Attributes<
	| Scales<'h'> 
	| `h-[${string}]` 
	| 'h-auto' | 'h-full' | 'h-screen'
>

/**
 * ⚠️ Limited Support Width Utilities
 * 
 * - `max-w-*`: Essential for fluid layouts (mobile responsiveness).
 *   Outlook Windows ignores this, but it's required for modern clients.
 * - `min-w-*`: ~85% support - Outlook Windows ignores this.
 * - `w-fit`, `w-min`, `w-max`: Intrinsic sizing - inconsistent support.
 * 
 * **Note:** `w-screen` (viewport units) is removed as it fails in Outlook.
 */
export type LimitedWidthAttributes = Attributes<
	| Scales<'min-w'> | `min-w-[${string}]` | 'min-w-full' | 'min-w-min' | 'min-w-max' | 'min-w-fit'
	| Scales<'max-w'> | `max-w-[${string}]` | 'max-w-full' | 'max-w-min' | 'max-w-max' | 'max-w-fit' | 'max-w-none'
	| 'max-w-xs' | 'max-w-sm' | 'max-w-md' | 'max-w-lg' | 'max-w-xl' 
	| 'max-w-2xl' | 'max-w-3xl' | 'max-w-4xl' | 'max-w-5xl' | 'max-w-6xl' | 'max-w-7xl'
	| 'w-fit' | 'w-min' | 'w-max'
>

/**
 * ⚠️ Limited Support Height Utilities
 * 
 * - `min-h-*`: ~80% support - Outlook Windows ignores this (treats `height` as min-height).
 * - `min-h-screen`: Aliased to `min-height: 100%`. Outlook ignores this.
 * - `h-fit`, `h-min`, `h-max`: Intrinsic sizing - inconsistent support.
 * 
 * **Note:** `max-h-*` is removed because `overflow: hidden` is unreliable,
 * so constraining height without overflow control is dangerous.
 */
export type LimitedHeightAttributes = Attributes<
	| Scales<'min-h'> | `min-h-[${string}]` | 'min-h-full' | 'min-h-screen'
	| 'min-h-min' | 'min-h-max' | 'min-h-fit'
	| 'h-fit' | 'h-min' | 'h-max'
>

/**
 * All sizing attributes (safe + limited)
 * Consider using only SafeWidthAttributes & SafeHeightAttributes for maximum compatibility.
 */
export type SizingAttributes = 
	& SafeWidthAttributes 
	& SafeHeightAttributes 
	& LimitedWidthAttributes 
	& LimitedHeightAttributes


// ============================================================================
// SPACING ATTRIBUTES
// ============================================================================

/**
 * ✅ Safe Padding Utilities (~100% support)
 * 
 * Padding is universally supported across all email clients, including Outlook.
 * This is the preferred method for creating space around elements.
 * 
 * Table cell padding is especially reliable - you can also use the `cellpadding`
 * HTML attribute for older clients.
 */
export type PaddingAttributes = Attributes<
	| Scales<'p'> | `p-[${string}]`
	| Scales<'pt'> | `pt-[${string}]`
	| Scales<'pr'> | `pr-[${string}]`
	| Scales<'pb'> | `pb-[${string}]`
	| Scales<'pl'> | `pl-[${string}]`
	| Scales<'px'> | `px-[${string}]`
	| Scales<'py'> | `py-[${string}]`
>

/**
 * ✅ Emulated Margin Utilities (rendered as wrapper padding)
 * 
 * **Implementation Strategy: Margin-as-Wrapper-Padding**
 * 
 * Since Outlook.com/Hotmail dropped CSS margin support, we emulate margins
 * by wrapping elements in a container table cell with padding. This provides
 * 100% email client compatibility while preserving the familiar margin API.
 * 
 * Example transformation:
 * ```svelte
 * <Div m-4>Content</Div>
 * ```
 * 
 * Renders as:
 * ```html
 * <table role="presentation" cellpadding="0" cellspacing="0" border="0">
 *   <tr>
 *     <td style="padding: 16px;">
 *       <table role="presentation" cellpadding="0" cellspacing="0" border="0">
 *         <tr>
 *           <td style="...">Content</td>
 *         </tr>
 *       </table>
 *     </td>
 *   </tr>
 * </table>
 * ```
 * 
 * The outer cell provides "margin" via padding, while the inner cell
 * contains the actual element with its own padding/styles.
 * 
 * **Centering (`m-auto`, `mx-auto`):**
 * Horizontal centering is achieved via `align="center"` on the wrapper table
 * or `margin: 0 auto` (which does work for block-level tables in most clients).
 * 
 * **Benefits:**
 * - 100% email client support (uses only padding)
 * - Familiar Tailwind-like API for developers
 * - Transparent to component authors
 * 
 * **Trade-off:**
 * - Slightly more HTML nesting (one extra wrapper table per margin)
 * - Renderer complexity (must detect margin attributes and wrap)
 */
export type MarginAttributes = Attributes<
	| Scales<'m'> | `m-[${string}]` | 'm-auto'
	| Scales<'mt'> | `mt-[${string}]` | 'mt-auto'
	| Scales<'mr'> | `mr-[${string}]` | 'mr-auto'
	| Scales<'mb'> | `mb-[${string}]` | 'mb-auto'
	| Scales<'ml'> | `ml-[${string}]` | 'ml-auto'
	| Scales<'mx'> | `mx-[${string}]` | 'mx-auto'
	| Scales<'my'> | `my-[${string}]` | 'my-auto'
>

/**
 * All spacing attributes (padding + emulated margins)
 * 
 * Both padding and margin utilities are safe to use:
 * - Padding: Applied directly as inline CSS
 * - Margins: Emulated via wrapper table with padding (see MarginAttributes)
 */
export type SpacingAttributes = PaddingAttributes & MarginAttributes


// ============================================================================
// COLOR ATTRIBUTES
// ============================================================================

/**
 * ✅ Safe Color Utilities (~100% support)
 * 
 * Text color (`color`) and background color (`background-color`) are fully
 * supported across all email clients. Use hex colors for precision.
 * 
 * ## Opacity Modifier Attributes
 * 
 * Use separate opacity modifier attributes instead of the `/opacity` suffix
 * (which doesn't work as HTML attributes due to the `/` character):
 * 
 * - `bg-opacity-50` instead of `bg-[#000]/50`
 * - `text-opacity-75` instead of `text-[#f00]/75`
 * - `border-opacity-25` instead of `border-[#00f]/25`
 * 
 * **Implementation Strategy: Background-Aware Color Blending**
 * 
 * Since `rgba()` and CSS `opacity` have poor email support (~70-83%, Outlook
 * Windows fails), we emulate opacity by blending colors at render time.
 * 
 * The renderer tracks background colors through the component tree. When a
 * color with an opacity modifier is used, it calculates the blended solid
 * color based on the nearest ancestor's background color.
 * 
 * **Example:**
 * ```svelte
 * <Div bg-[#ffffff]>
 *   <Text text-opacity-50 text-[#000000]>50% black on white = #808080</Text>
 * </Div>
 * ```
 * 
 * Renders as:
 * ```html
 * <td style="background-color: #ffffff;">
 *   <p style="color: #808080;">50% black on white = #808080</p>
 * </td>
 * ```
 * 
 * **Blending formula:** `result = fg * alpha + bg * (1 - alpha)`
 * 
 * **Opacity values:** Use Tailwind-style values (0-100) or decimals:
 * - `*-opacity-0` = fully transparent (becomes background color)
 * - `*-opacity-50` = 50% opacity
 * - `*-opacity-100` = fully opaque (no blending)
 * - `*-opacity-[0.75]` = arbitrary decimal value
 * 
 * **Usage examples:**
 * - `text-opacity-50 text-[#ff0000]` → 50% red text
 * - `bg-opacity-25 bg-[#0000ff]` → 25% blue background
 * - `border-opacity-10 border-[#000000]` → 10% black border
 * 
 * **Benefits:**
 * - ✅ 100% email client support (outputs solid hex)
 * - ✅ Works as valid HTML attributes
 * - ✅ Mathematically accurate blending
 * - ✅ Works with any hex color format
 * 
 * **Limitation:**
 * - Requires a known background color in the ancestor chain
 * - If no background is set, defaults to white (#ffffff)
 * - Nested semi-transparent elements compound correctly
 * 
 * Note: `inherit`, `current`, and `transparent` have limited usefulness in
 * email since CSS inheritance is inconsistent.
 */

/** Standard opacity scale (Tailwind-style, 0-100) */
type OpacityScale = 
	| '0' | '5' | '10' | '15' | '20' | '25' 
	| '30' | '35' | '40' | '45' | '50' 
	| '55' | '60' | '65' | '70' | '75' 
	| '80' | '85' | '90' | '95' | '100'

export type ColorAttributes = Attributes<
	// Text color
	| `text-[${string}]` 
	| 'text-inherit' | 'text-current' | 'text-transparent'
	// Background color
	| `bg-[${string}]` 
	| 'bg-inherit' | 'bg-current' | 'bg-transparent'
	// Color opacity modifiers (use instead of /opacity suffix)
	| `text-opacity-${OpacityScale}` | `text-opacity-[${string}]`
	| `bg-opacity-${OpacityScale}` | `bg-opacity-[${string}]`
	| `border-opacity-${OpacityScale}` | `border-opacity-[${string}]`
>


// ============================================================================
// ALIGNMENT ATTRIBUTES
// ============================================================================

/**
 * ✅ Content Alignment Utilities (~100% support)
 * 
 * Controls where content is placed within a container cell.
 * Combines `text-align` and `vertical-align` into a single intuitive API.
 * 
 * **Usage:**
 * ```svelte
 * <Div align-top-left>...</Div>
 * <Div align-middle>...</Div>      <!-- center both axes -->
 * <Div align-bottom-right>...</Div>
 * ```
 * 
 * **Mapping:**
 * 
 * | Attribute | `text-align` | `vertical-align` |
 * |-----------|--------------|------------------|
 * | `align-top-left` | left | top |
 * | `align-top` | center | top |
 * | `align-top-right` | right | top |
 * | `align-left` / `align-middle-left` | left | middle |
 * | `align-middle` / `align-center` | center | middle |
 * | `align-right` / `align-middle-right` | right | middle |
 * | `align-bottom-left` | left | bottom |
 * | `align-bottom` | center | bottom |
 * | `align-bottom-right` | right | bottom |
 * 
 * **Note:** `align-center` is an alias for `align-middle`. 
 * `align-middle-left` and `align-middle-right` are aliases for `align-left` and `align-right`.
 */
export type AlignmentAttributes = Attributes<
	// Top row
	| 'align-top-left' | 'align-top' | 'align-top-right'
	// Middle row (with aliases for consistency)
	| 'align-left' | 'align-middle-left' | 'align-middle' | 'align-center' | 'align-right' | 'align-middle-right'
	// Bottom row
	| 'align-bottom-left' | 'align-bottom' | 'align-bottom-right'
>

/**
 * ✅ Text Justification Utilities (~100% support)
 * 
 * Controls how text flows and wraps within a text element.
 * Use this on `<Text>` components to control text alignment.
 * 
 * **Usage:**
 * ```svelte
 * <Text justify-left>Left-aligned text</Text>
 * <Text justify-center>Centered text</Text>
 * <Text justify-right>Right-aligned text</Text>
 * <Text justify-full>Full-justified text</Text>
 * ```
 * 
 * **Mapping:**
 * 
 * | Attribute | `text-align` |
 * |-----------|--------------|
 * | `justify-left` | left |
 * | `justify-center` | center |
 * | `justify-right` | right |
 * | `justify-full` | justify |
 * 
 * **Note:** `justify-full` produces full justification (both edges aligned).
 * This is distinct from `align-*` which controls content placement in containers.
 */
export type JustifyAttributes = Attributes<
	| 'justify-left' | 'justify-center' | 'justify-right' | 'justify-full'
>


// ============================================================================
// TYPOGRAPHY ATTRIBUTES
// ============================================================================

/**
 * ✅ Safe Typography Utilities (~95-100% support)
 * 
 * All standard typography properties are well-supported:
 * - Font size, weight, style
 * - Text decoration, transform
 * - Line height and letter spacing
 * 
 * **Note:** Text alignment is handled by `JustifyAttributes` (`justify-*`).
 * Content placement in containers is handled by `AlignmentAttributes` (`align-*`).
 * 
 * Use web-safe font stacks with fallbacks for font-family.
 */
export type TypographyAttributes = Attributes<
	// Font size
	| 'text-xs' | 'text-sm' | 'text-base' | 'text-lg' | 'text-xl' | 'text-2xl' 
	| 'text-3xl' | 'text-4xl' | 'text-5xl' | 'text-6xl' | 'text-7xl' | 'text-8xl' | 'text-9xl'
	| `text-[${string}]`
	// Font weight
	| 'font-thin' | 'font-extralight' | 'font-light' | 'font-normal' | 'font-medium' 
	| 'font-semibold' | 'font-bold' | 'font-extrabold' | 'font-black'
	// Font style
	| 'italic' | 'not-italic'
	// Text decoration
	| 'underline' | 'overline' | 'line-through' | 'no-underline'
	// Text transform
	| 'uppercase' | 'lowercase' | 'capitalize' | 'normal-case'
	// Line height
	| 'leading-none' | 'leading-tight' | 'leading-snug' | 'leading-normal' | 'leading-relaxed' | 'leading-loose'
	| Scales<'leading'> | `leading-[${string}]`
	// Letter spacing
	| 'tracking-tighter' | 'tracking-tight' | 'tracking-normal' | 'tracking-wide' | 'tracking-wider' | 'tracking-widest'
	| `tracking-[${string}]`
	// Word break & whitespace (inconsistent support, use sparingly)
	| 'break-normal' | 'break-words' | 'break-all' | 'break-keep'
	| 'whitespace-normal' | 'whitespace-nowrap' | 'whitespace-pre' | 'whitespace-pre-line' | 'whitespace-pre-wrap'
	// Text overflow
	| 'truncate' | 'text-ellipsis' | 'text-clip'
>


// ============================================================================
// BORDER ATTRIBUTES
// ============================================================================

type BorderWidthScale = '0' | '1' | '2' | '4' | '8'

/**
 * ✅ Safe Border Utilities (~100% support)
 * 
 * Basic border properties (width, style, color) are fully supported,
 * even in Outlook's Word-based renderer.
 * 
 * Border colors support the `/opacity` modifier syntax (see ColorAttributes).
 * Example: `border-[#000000]/20` → renders as blended solid color
 * 
 * Note: Plain `border`, `border-t`, etc. are handled in BorderDualAttributes
 * to support both boolean and value syntax.
 */
export type SafeBorderAttributes = Attributes<
	// Border width (scaled and arbitrary - plain versions are in BorderDualAttributes)
	| `border-${BorderWidthScale}` | `border-[${string}]`
	| `border-t-${BorderWidthScale}` | `border-t-[${string}]`
	| `border-r-${BorderWidthScale}` | `border-r-[${string}]`
	| `border-b-${BorderWidthScale}` | `border-b-[${string}]`
	| `border-l-${BorderWidthScale}` | `border-l-[${string}]`
	| `border-x-${BorderWidthScale}` | `border-x-[${string}]`
	| `border-y-${BorderWidthScale}` | `border-y-[${string}]`
	// Border color (with optional opacity modifier)
	| `border-[#${string}]` | `border-[#${string}]/${string}`
	| 'border-transparent' | 'border-inherit' | 'border-current'
	// Border style
	| 'border-solid' | 'border-dashed' | 'border-dotted' | 'border-double' | 'border-hidden' | 'border-none'
>

/**
 * ⚠️ Border Radius Utilities (~80% support)
 * 
 * **WARNING: Outlook Windows does NOT support border-radius.**
 * 
 * Rounded corners will render as square in:
 * - Outlook 2007-2021 (Windows)
 * - Yahoo Mail
 * - AOL Mail
 * 
 * For rounded buttons in Outlook, use VML (Vector Markup Language) fallbacks.
 * Design should look acceptable with square corners as fallback.
 */
export type BorderRadiusAttributes = Attributes<
	| Scales<'rounded'> | 'rounded-full' | 'rounded-none'
	| 'rounded-sm' | 'rounded-md' | 'rounded-lg' | 'rounded-xl' | 'rounded-2xl' | 'rounded-3xl'
	| `rounded-[${string}]`
>

/**
 * All border attributes (safe + limited)
 */
export type BorderAttributes = SafeBorderAttributes & BorderRadiusAttributes


// ============================================================================
// LAYOUT ATTRIBUTES
// ============================================================================

/**
 * ✅ Safe Layout Utilities
 * 
 * Basic display modes and visibility are well-supported.
 * `display: none` is now supported in Gmail and most modern clients.
 */
export type SafeLayoutAttributes = Attributes<
	// Display (well-supported in email)
	| 'block' | 'inline-block' | 'inline' | 'hidden'
	// Visibility
	| 'visible' | 'invisible' | 'collapse'
>

/**
 * ⚠️ Float/Clear Utilities (~90% support)
 * 
 * Float-based layouts work but tables are strongly preferred for email.
 * Only use floats for simple inline elements, not for major layout structure.
 */
export type FloatAttributes = Attributes<
	| 'float-left' | 'float-right' | 'float-none'
	| 'clear-left' | 'clear-right' | 'clear-both' | 'clear-none'
>

/**
 * All layout attributes
 */
export type LayoutAttributes = SafeLayoutAttributes & FloatAttributes


// ============================================================================
// RESPONSIVE ATTRIBUTES
// ============================================================================

/**
 * ⚠️ Responsive Utilities (~85% support)
 * 
 * **Implementation Note:** These utilities require CSS Media Queries in a `<style>` block.
 * They cannot be implemented via inline styles alone.
 * 
 * **Support:**
 * - ✅ iOS Mail, Apple Mail, Gmail App, Samsung Mail
 * - ✅ Gmail Web, Yahoo, AOL (modern webmail)
 * - ⚠️ Outlook Windows (ignores media queries - defaults to desktop view, doesn't matter as its on a desktop machine anyways)
 * 
 * **Strategy:**
 * - `mobile-only`: `display: none` inline + `@media (max-width:...) { display: block }`
 * - `desktop-only`: `@media (max-width:...) { display: none }`
 * 
 * **Outlook Windows Behavior:**
 * - `mobile-only`: Hidden (respects `display: none`)
 * - `desktop-only`: Visible (ignores media query)
 * 
 * This provides a graceful fallback: Outlook Windows always sees the desktop version.
 */
export type ResponsiveAttributes = Attributes<
	| 'mobile-only' | 'desktop-only'
>


// ============================================================================
// EFFECTS ATTRIBUTES
// ============================================================================

/**
 * ✅ Element Opacity Utilities (emulated via color blending)
 * 
 * CSS `opacity` property has poor email support (~70%), but we emulate it
 * by **compounding** element opacity with all color opacities at render time.
 * 
 * **How it works:**
 * 
 * Element opacity acts as a multiplier on all color opacities within that element.
 * The renderer combines them before blending against the background.
 * 
 * ```svelte
 * <!-- These are equivalent: -->
 * <Div opacity-50 text-inherit bg-[#000000]>...</Div>
 * <Div text-inherit/50 bg-[#000000]/50>...</Div>
 * 
 * <!-- Opacities compound (multiply): -->
 * <Div opacity-50 text-[#000000]/50 bg-[#ff0000]/80>...</Div>
 * <!-- Becomes: text at 25% (50% × 50%), bg at 40% (50% × 80%) -->
 * <Div text-[#000000]/25 bg-[#ff0000]/40>...</Div>
 * ```
 * 
 * **Compounding formula:** `final_opacity = element_opacity × color_opacity`
 * 
 * **Example with values:**
 * ```svelte
 * <Div bg-[#ffffff]>
 *   <Div opacity-75 text-inherit/75 bg-[#000000]/50>
 *     <!-- text: 75% × 75% = 56.25% → blended against white -->
 *     <!-- bg: 75% × 50% = 37.5% → blended against white -->
 *   </Div>
 * </Div>
 * ```
 * 
 * **Benefits:**
 * - ✅ 100% email client support (outputs solid colors)
 * - ✅ Familiar `opacity-*` API from Tailwind
 * - ✅ Combines naturally with per-color opacity modifiers
 * - ✅ Inherited text colors (`text-inherit`) get opacity applied
 * 
 * **Note:** Colors without explicit opacity default to 100%, so `opacity-50`
 * effectively makes all colors 50% transparent.
 */
export type OpacityAttributes = Attributes<
	| 'opacity-0' | 'opacity-5' | 'opacity-10' | 'opacity-15' | 'opacity-20' | 'opacity-25' 
	| 'opacity-30' | 'opacity-35' | 'opacity-40' | 'opacity-45' | 'opacity-50' 
	| 'opacity-55' | 'opacity-60' | 'opacity-65' | 'opacity-70' | 'opacity-75' 
	| 'opacity-80' | 'opacity-85' | 'opacity-90' | 'opacity-95' | 'opacity-100'
	| `opacity-[${string}]`
>

/**
 * ✅ Effects attributes (emulated for email compatibility)
 * 
 * Element opacity is fully supported via color blending emulation.
 * The `opacity-*` utility acts as a multiplier on all color opacities.
 * 
 * **NOT supported in email (no emulation possible):**
 * - `box-shadow` (~63%) - Outlook ignores
 * - `text-shadow` (~50%) - Very limited
 * - `transform` (~30%) - Not supported
 * - `filter` (~25%) - Not supported
 * - `transition` / `animation` (~20%) - Not supported
 */
export type EffectsAttributes = OpacityAttributes


// ============================================================================
// TABLE/GRID LAYOUT ATTRIBUTES
// ============================================================================

/**
 * ✅ Cell Span Attributes
 * 
 * Used on children of `<Table.Row>` or `<Div cols/rows>` to span multiple cells.
 * Works via HTML `colspan` and `rowspan` attributes on `<td>` elements.
 * 
 * **Usage:**
 * ```svelte
 * <Table cols-[40%_20%_20%_20%]>
 *   <Table.Row>
 *     <Div span-2>Spans 2 columns</Div>
 *     <Div span-2>Spans 2 columns</Div>
 *   </Table.Row>
 * </Table>
 * 
 * <Div cols>
 *   <Spacer span-3 />  <!-- Empty spacer spanning 3 columns -->
 *   <Div>Content</Div>
 * </Div>
 * ```
 * 
 * **Note:** `row-span-*` only works in table contexts where multiple rows exist.
 * Email client support for rowspan is good (~95%).
 */
type SpanScale = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'

export type SpanAttributes = Attributes<
	| `span-${SpanScale}` | `span-[${string}]`
	| `row-span-${SpanScale}` | `row-span-[${string}]`
>

/**
 * ✅ Column/Row Template Attributes
 * 
 * Defines widths for children in a grid layout. Widths are underscore-separated.
 * This removes the need to specify `w-[...]` on each child element.
 * 
 * **Usage:**
 * ```svelte
 * <!-- Table with defined column widths -->
 * <Table cols-[40%_20%_20%_20%]>
 *   <Table.Row>
 *     <Text content='Item' />      <!-- 40% -->
 *     <Text content='Qty' />       <!-- 20% -->
 *     <Text content='Price' />     <!-- 20% -->
 *     <Text content='Total' />     <!-- 20% -->
 *   </Table.Row>
 * </Table>
 * 
 * <!-- Div with column template -->
 * <Div cols cols-[1fr_2fr_1fr]>
 *   <Div>Left (1fr)</Div>
 *   <Div>Center (2fr)</Div>
 *   <Div>Right (1fr)</Div>
 * </Div>
 * 
 * <!-- Div with row template -->
 * <Div rows rows-[auto_1fr_auto]>
 *   <Div>Header (auto)</Div>
 *   <Div>Content (1fr)</Div>
 *   <Div>Footer (auto)</Div>
 * </Div>
 * ```
 * 
 * **Supported units:**
 * - Percentages: `40%`, `20%`
 * - Pixels: `100px`, `50px`
 * - Fractional: `1fr`, `2fr` (treated as ratios, converted to percentages)
 * - Auto: `auto`
 */
export type ColumnTemplateAttributes = Attributes<
	| `cols-[${string}]`
	| `rows-[${string}]`
>

/**
 * ✅ Gap Attributes (emulated via spacers)
 * 
 * Adds spacing between child elements in grid layouts (cols/rows).
 * The gap is implemented by inserting spacer elements between children at render time.
 * 
 * **Usage:**
 * ```svelte
 * <!-- Horizontal gap between columns -->
 * <Div cols gap-4>
 *   <Div>Column 1</Div>
 *   <Div>Column 2</Div>
 *   <Div>Column 3</Div>
 * </Div>
 * 
 * <!-- Vertical gap between rows -->
 * <Div rows gap-6>
 *   <Div>Row 1</Div>
 *   <Div>Row 2</Div>
 * </Div>
 * 
 * <!-- Arbitrary gap value -->
 * <Div cols gap-[20px]>
 *   <Div>Left</Div>
 *   <Div>Right</Div>
 * </Div>
 * ```
 * 
 * **Scale:** Uses Tailwind spacing scale (same as padding/margin):
 * - 0 → 0px, 1 → 4px, 2 → 8px, 3 → 12px, 4 → 16px
 * - 5 → 20px, 6 → 24px, 8 → 32px, 10 → 40px, 12 → 48px
 * 
 * **Note:** Gap only applies to grid layouts (cols/rows). It has no effect on normal Divs.
 */
export type GapAttributes = Attributes<
	| 'gap-0' | 'gap-1' | 'gap-2' | 'gap-3' | 'gap-4' 
	| 'gap-5' | 'gap-6' | 'gap-8' | 'gap-10' | 'gap-12'
	| `gap-[${string}]`
>


// ============================================================================
// COMPOSITE ATTRIBUTE TYPES (for components)
// ============================================================================

/**
 * Core style attributes safe for all components.
 * Includes width, height, colors, and responsive utilities.
 */
export type CoreStyleAttributes = 
	& SafeWidthAttributes 
	& SafeHeightAttributes
	& ColorAttributes 
	& ResponsiveAttributes

/**
 * Extended sizing including limited-support min/max utilities.
 * Use with awareness that Outlook ignores min/max constraints.
 */
export type ExtendedSizingAttributes =
	& CoreStyleAttributes
	& LimitedWidthAttributes
	& LimitedHeightAttributes


// ============================================================================
// EMAIL COMPONENT ATTRIBUTES
// ============================================================================

/**
 * Email component specific attributes.
 * 
 * The `<Email>` component supports two separate background colors:
 * - `body-bg-[#hex]` — Full-width body/wrapper background (defaults to white)
 * - `bg-[#hex]` — Content container background (the centered 600px area)
 * 
 * Additionally, the content width can be customized:
 * - `max-w-[value]` — Override the default 600px content width
 * - `max-w-xl`, `max-w-2xl`, etc. — Use preset widths
 * 
 * Responsive breakpoint can be customized:
 * - `mobile-threshold-[480px]` — Default breakpoint for responsive styles
 * - Lower values = tighter (stacks later), higher = looser (stacks earlier)
 * 
 * **Example:**
 * ```svelte
 * <Email body-bg-[#f5f5f5] bg-[#ffffff] max-w-[700px] mobile-threshold-[425px]>
 *   <!-- Light gray body, white content area, 700px wide, stacks at 425px -->
 * </Email>
 * ```
 * 
 * **Note:** `body-bg-*` does NOT support opacity modifiers because it serves
 * as the root background color for all opacity blending calculations.
 */
export type BodyBackgroundAttributes = Attributes<
	| `body-bg-[${string}]`
>

/**
 * Mobile breakpoint attribute for responsive styles.
 * Controls when `responsive` columns stack and when `mobile-only`/`desktop-only` toggle.
 * Default: 480px
 */
export type MobileThresholdAttributes = Attributes<
	| `mobile-threshold-[${string}]`
>

/**
 * Email-specific max-width attributes for content container.
 * Controls the width of the centered content area (default: 600px).
 */
export type EmailMaxWidthAttributes = Attributes<
	| `max-w-[${string}]`
	| 'max-w-xs' | 'max-w-sm' | 'max-w-md' | 'max-w-lg' | 'max-w-xl'
	| 'max-w-2xl' | 'max-w-3xl' | 'max-w-4xl' | 'max-w-5xl' | 'max-w-6xl' | 'max-w-7xl'
>

/**
 * Email root component attributes.
 * 
 * Supports:
 * - `body-bg-[#hex]` — Body/wrapper background color (solid only, no opacity)
 * - `bg-[#hex]` — Content container background (supports opacity modifiers)
 * - `max-w-*` — Content container max width (default: 600px)
 * - `mobile-threshold-[px]` — Responsive breakpoint (default: 480px)
 * - Standard styling attributes (padding, colors, typography, etc.)
 */
export type EmailAttributes =
	& BodyBackgroundAttributes
	& MobileThresholdAttributes
	& EmailMaxWidthAttributes
	& CoreStyleAttributes
	& SpacingAttributes
	& ColorAttributes
	& TypographyAttributes
	& AlignmentAttributes
	& SafeBorderAttributes
	& BorderRadiusAttributes
	& EffectsAttributes
	& EmailValueAttributes  // Value syntax support (body-bg, mobile-threshold)
	& ColorValueAttributes  // Value syntax support (bg, text)
	& RoundedDualAttributes  // rounded properties can be boolean or string

// ============================================================================
// COMPONENT-SPECIFIC ATTRIBUTE TYPES
// ============================================================================

/**
 * Div/Container component attributes.
 * 
 * Includes all styling options:
 * - ✅ Safe: width, height, padding, margins (emulated), borders, colors, alignment
 * - ⚠️ Limited: border-radius, min/max sizing
 * - ✅ Effects: opacity (emulated)
 * 
 * **Style Inheritance:** Typography and color styles on containers are inherited
 * by child elements. This reduces redundancy when styling groups of elements.
 * 
 * ```svelte
 * <!-- Children inherit font-bold and text color -->
 * <Div font-bold text-[#333333]>
 *   <Text content='Bold dark text' />
 *   <Text content='Also bold dark text' />
 *   <Text content='Override to normal' font-normal />
 * </Div>
 * ```
 * 
 * **Grid Layout:** Use `cols` or `rows` to arrange children in a grid layout.
 * Grids render as HTML `<table>` elements for email compatibility.
 * 
 * ```svelte
 * <!-- Horizontal columns -->
 * <Div cols>
 *   <Div w-[50%]>Left column</Div>
 *   <Div w-[50%]>Right column</Div>
 * </Div>
 * 
 * <!-- Responsive columns (stack on mobile) -->
 * <Div cols responsive>
 *   <Div w-[50%]>Column 1</Div>
 *   <Div w-[50%]>Column 2</Div>
 * </Div>
 * ```
 * 
 * **Value syntax:** All bracket attributes support value syntax for Svelte variables:
 * ```svelte
 * <script>
 *   let bgColor = '#f0f0f0'
 *   let padding = '1rem'
 * </script>
 * <Div bg={bgColor} p={padding}>Dynamic styling!</Div>
 * ```
 */
export type DivAttributes = 
	& CoreStyleAttributes 
	& LimitedWidthAttributes
	& LimitedHeightAttributes
	& SpacingAttributes 
	& BorderAttributes 
	& LayoutAttributes 
	& AlignmentAttributes
	& TypographyAttributes
	& JustifyAttributes
	& EffectsAttributes
	& SpanAttributes
	& ColumnTemplateAttributes
	& GapAttributes
	& AllValueAttributes  // Value syntax support
	& ColsRowsAttributes  // cols/rows can be boolean or string
	& BorderDualAttributes  // border properties can be boolean or string
	& RoundedDualAttributes  // rounded properties can be boolean or string
	& Attributes<
		| 'responsive'  // Collapse columns to single-column on mobile (only with cols)
	>

/**
 * Text component attributes.
 * 
 * All typography properties are well-supported in email.
 * Use `justify-*` for text alignment within the text block.
 * Use `align-*` for positioning when used inside Table.Row or Div cols/rows.
 * Use `span-*` to span multiple columns in table layouts.
 * 
 * **Value syntax:** Supports value syntax for Svelte variables:
 * ```svelte
 * <script>
 *   let textColor = '#333333'
 * </script>
 * <Text text={textColor} content='Dynamic color!' />
 * ```
 */
export type TextAttributes = 
	& CoreStyleAttributes 
	& SpacingAttributes 
	& TypographyAttributes
	& JustifyAttributes
	& AlignmentAttributes
	& SpanAttributes
	& AllValueAttributes  // Value syntax support

/**
 * Table component attributes.
 * 
 * Tables render as HTML `<table>` elements with proper data table semantics.
 * Unlike Div with cols/rows (which is for layout), Table is for displaying tabular data.
 * 
 * **Usage:**
 * ```svelte
 * <Table border striped>
 *   <Table.Row header>
 *     <Text content='Name' />
 *     <Text content='Status' />
 *   </Table.Row>
 *   <Table.Row>
 *     <Text content='Deployment' />
 *     <Text content='🟢 Good' />
 *   </Table.Row>
 * </Table>
 * ```
 * 
 * **Markdown tables** are also supported in `content` props:
 * ```svelte
 * <Text content={`
 * | Name | Status |
 * |------|--------|
 * | Deployment | 🟢 Good |
 * `} />
 * ```
 */
export type TableAttributes = 
	& CoreStyleAttributes
	& LimitedWidthAttributes
	& LimitedHeightAttributes
	& SpacingAttributes
	& SafeBorderAttributes
	& BorderRadiusAttributes
	& AlignmentAttributes
	& TypographyAttributes
	& EffectsAttributes
	& ColumnTemplateAttributes
	& GapAttributes
	& AllValueAttributes  // Value syntax support
	& ColsRowsAttributes  // cols can specify column widths
	& BorderDualAttributes  // border properties can be boolean or string (includes 'border' for "show all borders")
	& RoundedDualAttributes  // rounded properties can be boolean or string
	& Attributes<
		// Table-specific display options
		| 'striped'       // Alternating row backgrounds
		| 'border-outer'  // Only outer border on table (no cell borders)
		| 'cell-border'   // Show cell borders only
		| 'compact'       // Reduced cell padding
		// Cell padding overrides
		| 'cell-padding-0' | 'cell-padding-1' | 'cell-padding-2' | 'cell-padding-3' | 'cell-padding-4'
		| 'cell-padding-5' | 'cell-padding-6' | 'cell-padding-8' | 'cell-padding-10' | 'cell-padding-12'
		| `cell-padding-[${string}]`
	>

/**
 * Table.Row component attributes (used inside Table).
 * 
 * Rows can be marked as `header` for the table header row.
 * 
 * **Style Inheritance:** Styling on Table.Row is inherited by child elements.
 * This includes typography (`font-bold`, `text-*`), colors (`text-[#...]`, `bg-[#...]`),
 * and alignment (`align-*`). This reduces redundancy when styling entire rows.
 * 
 * **Usage:**
 * ```svelte
 * <!-- Children inherit font-bold and bg color -->
 * <Table.Row header bg-[#f3f4f6] font-bold>
 *   <Text content='Column 1' />
 *   <Text content='Column 2' />
 * </Table.Row>
 * 
 * <!-- Override inheritance on specific cells -->
 * <Table.Row font-bold>
 *   <Text content='Bold text' />
 *   <Text content='Normal text' font-normal />
 * </Table.Row>
 * ```
 * 
 * **Inherited properties:**
 * - Typography: `font-*`, `text-xs`/`sm`/etc., `italic`, `uppercase`, etc.
 * - Colors: `text-[#...]`, `bg-[#...]` (children can override)
 * - Alignment: `align-*`, `justify-*`
 * - Spacing: `p-*` (applies to cells)
 */
export type TableRowAttributes = 
	& CoreStyleAttributes
	& SpacingAttributes
	& SafeBorderAttributes
	& AlignmentAttributes
	& TypographyAttributes
	& JustifyAttributes
	& EffectsAttributes
	& ColorAttributes
	& AllValueAttributes  // Value syntax support
	& BorderDualAttributes  // border properties can be boolean or string
	& Attributes<
		| 'header'  // Marks this row as a header row (renders as <th> cells)
	>

/**
 * Image component attributes.
 * 
 * Note: `object-fit` utilities (~66% support) are NOT included
 * because email clients don't reliably crop/cover images via CSS.
 * Instead, size images via width/height attributes and let them scale normally.
 * 
 * Best practices:
 * - Always include explicit width and height
 * - Always include alt text
 * - Use absolute HTTPS URLs
 * - Assume images may be blocked by default
 */
export type ImgAttributes = 
	& CoreStyleAttributes 
	& LimitedWidthAttributes
	& LimitedHeightAttributes
	& SpacingAttributes 
	& SafeBorderAttributes 
	& BorderRadiusAttributes
	& SizingValueAttributes  // Value syntax for w, h
	& SpacingValueAttributes  // Value syntax for p, m
	& BorderValueAttributes  // (currently empty, kept for future)
	& BorderDualAttributes  // border properties can be boolean or string
	& RoundedDualAttributes  // rounded properties can be boolean or string

/**
 * Button component attributes.
 * 
 * Note: For rounded buttons in Outlook Windows, VML fallbacks may be needed.
 * The button should be functional and visually acceptable with square corners.
 */
export type ButtonAttributes = 
	& CoreStyleAttributes 
	& SpacingAttributes 
	& SafeBorderAttributes 
	& BorderRadiusAttributes 
	& TypographyAttributes
	& JustifyAttributes
	& AllValueAttributes  // Value syntax support
	& BorderDualAttributes  // border properties can be boolean or string
	& RoundedDualAttributes  // rounded properties can be boolean or string

/**
 * Link component attributes.
 * 
 * Inline anchor element for text links. Unlike Button (styled CTA block),
 * Link is for inline text links within content.
 * 
 * @example
 * ```svelte
 * <Text>
 *   Visit <Link href='https://example.com'>our website</Link> for more.
 * </Text>
 * ```
 */
export type LinkAttributes = 
	& CoreStyleAttributes
	& PaddingAttributes
	& TypographyAttributes
	& EffectsAttributes
	& ColorValueAttributes  // Value syntax for text, bg
	& SpacingValueAttributes  // Value syntax for p
	& EffectValueAttributes  // Value syntax for opacity
