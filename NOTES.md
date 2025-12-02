# Refactoring Notes — svelte-emails Rendering System

This document catalogs patterns, redundancies, and refactoring opportunities in the rendering subsystem.

**Goal:** Minimize repetitive code, increase flexibility, improve development velocity, and reduce bug surface area.

---

## Table of Contents

1. [Completed Refactors](#completed-refactors)
2. [Deferred Items](#deferred-items)
3. [Future Considerations](#future-considerations)

---

<a id="completed-refactors"></a>
## Completed Refactors

### 1. toInlineCSS Inheritance (html-helpers.ts) ✅ COMPLETED

**Impact:** ~30 lines saved, improved maintainability

**Changes made:**
- Added `INHERITABLE_PROPERTIES` constant array at module level
- Replaced 14 repetitive if-statements with a for-loop
- TypeScript still validates properties via `InheritedStyles` type

```ts
const INHERITABLE_PROPERTIES = [
  'color', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
  'textDecoration', 'textTransform', 'textAlign', 'lineHeight',
  'letterSpacing', 'whiteSpace', 'wordBreak', 'verticalAlign', 'visibility'
] as const

// In toInlineCSS:
if (inherited) {
  for (const prop of INHERITABLE_PROPERTIES) {
    if (!finalCss[prop] && inherited[prop]) {
      finalCss[prop] = inherited[prop]
    }
  }
}
```

---

### 2. Regex Extraction (parse-attrs.ts) ✅ COMPLETED

**Impact:** Better code organization, patterns documented in one place

**Changes made:**
- Extracted ~50 regex patterns to module-level constants
- Grouped patterns by parser function (padding, margin, width, color, typography, border, opacity, grid)
- All parser functions updated to use constants instead of inline patterns
- No behavioral changes

**Pattern groups:**
- Unit conversion: `REM_VALUE_RE`
- Padding: `PADDING_ARBITRARY_RE`, `PADDING_SCALE_RE`, `PADDING_X_RE`, `PADDING_Y_RE`, `PADDING_SIDE_RE`
- Margin: `MARGIN_ARBITRARY_RE`, `MARGIN_SCALE_RE`, `MARGIN_X_RE`, `MARGIN_Y_RE`, `MARGIN_SIDE_RE`
- Width/Height: `WIDTH_ARBITRARY_RE`, `WIDTH_SCALE_RE`, `HEIGHT_ARBITRARY_RE`, `HEIGHT_SCALE_RE`
- Min/Max: `MIN_WIDTH_*`, `MAX_WIDTH_*`, `MIN_HEIGHT_*`
- Color: `TEXT_COLOR_RE`, `BG_COLOR_RE`
- Typography: `TEXT_SIZE_*`, `FONT_WEIGHT_RE`, `LINE_HEIGHT_*`, `LETTER_SPACING_*`, `WHITESPACE_RE`
- Border: `BORDER_WIDTH_*`, `BORDER_SIDE_RE`, `BORDER_AXIS_RE`, `BORDER_COLOR_RE`, `BORDER_STYLE_RE`, `ROUNDED_*`
- Opacity: `TEXT_OPACITY_RE`, `BG_OPACITY_RE`, `BORDER_OPACITY_RE`, `OPACITY_RE`
- Grid/Cell: `COLS_TEMPLATE_RE`, `ROWS_TEMPLATE_RE`, `CELL_PADDING_*`, `GAP_*`, `SPAN_*`, `ROW_SPAN_*`, `WIDTH_FRACTION_RE`

---

<a id="deferred-items"></a>
## Deferred Items

### Spacing Parser Factory (parse-attrs.ts) ⚠️ DEFERRED

**Reason:** Complexity outweighs benefits

After detailed examination, each parser has enough unique behavior that a factory pattern would require many configuration options:

| Parser | Special Values | Sides | Scale | Arbitrary | Store Location |
|--------|----------------|-------|-------|-----------|----------------|
| padding | none | t/r/b/l/x/y | yes | yes | css.padding* |
| margin | auto | t/r/b/l/x/y | yes | yes | margin.* (special) |
| width | full/screen/auto | no | yes | yes | css.width |
| height | full/screen/auto | no | yes | yes | css.height |
| min-w | full | no | yes | yes | css.minWidth |
| max-w | none/full | no | yes | yes | css.maxWidth |
| min-h | full/screen | no | yes | yes | css.minHeight |

**Problems with factory approach:**
1. Margin stores to `result.margin.*` not `result.css.*`
2. Side variants (x/y/t/r/b/l) only apply to padding/margin
3. Special values vary per property
4. MIN/MAX have different scale lookup behavior

**Conclusion:** Current explicit parsers are more readable and maintainable than a complex factory. The regex extraction provides most of the benefit without the abstraction cost.

---

<a id="future-considerations"></a>
## Future Considerations

### Module-Level State in Escape System (content.ts)

**Risk:** Low (currently synchronous)  
**Action:** Document only, no code change needed

The escape system uses `ESCAPE_MAP` and `escapeCounter` as module-level state. This is safe because:
- Rendering is currently synchronous
- Each `parseMarkdown` call resets the counter

If async SSR is ever needed, consider passing escape state through parameters.

### HTML/Text Renderer Parallelism

**Risk:** Low  
**Action:** Document only

Two parallel dispatch systems in renderer.ts must stay in sync. A registry pattern could help but adds complexity. Current explicit switch statements are clear and TypeScript exhaustiveness checking helps.

---

## Changelog

- **2024-12-02**: Initial analysis
- **2024-12-02**: Implemented buildStyleFromConfig, renderLinkLikeToText, cell helpers, renderAnchorLikeNode, applyWrappers
- **2024-12-02**: Detailed analysis of remaining opportunities; deferred spacing parser factory
- **2024-12-02**: Implemented toInlineCSS inheritance refactor (html-helpers.ts)
- **2024-12-02**: Implemented regex extraction (~50 patterns) to module-level constants (parse-attrs.ts)
