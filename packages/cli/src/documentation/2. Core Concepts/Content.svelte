<script lang="ts">
	/**
	 * Content Formatting
	 * 
	 * Markdown syntax, variables, and lists.
	 */
	import {
		Email,
		Div,
		Text,
		Divider,
		Table
	} from 'svelte-emails'
	import { footer } from '../Shared/Footer.svelte'
	import { callout } from '../Shared/Callout.svelte'
	import Preview from '../Shared/Preview.svelte'

	const colors = {
		primary: '#10b981',
		primaryDark: '#059669',
		text: '#111827',
		textMuted: '#4b5563',
		background: '#f3f4f6',
		white: '#ffffff',
		border: '#d1d5db',
		code: '#1f2937',
		codeBg: '#f9fafb'
	}

	const markdownExample = `<Text content="This has **bold** and *italic* text." />
<Text content="Use \`backticks\` for inline code." />
<Text content="Visit [our website](https://example.com) for more." />`

	const multilineExample = `<Text content="Line one
Line two
Line three" />`

	const linebreakExample = `<Text content="First paragraph text here.

Second paragraph after the blank line." />`

	const variableExample = `<Text content="Hello [[first_name]]!" />
<Text content="Your order #[[order_id]] has shipped." />`

	const placeholderExample = `// Server-side rendering
import { render } from 'svelte-emails'
import MyEmail from './MyEmail.email.svelte'

const result = await render(MyEmail, {
  placeholders: {
    first_name: 'Alice',
    order_id: '12345',
    user_id: '789'
  }
})`

	const listExample = `<Text content="
- First item with **bold** text
- Second item with a [link](https://example.com)
- Third item
" />`

	const orderedListExample = `<Text content="
1. Step one
2. Step two
3. Step three
" />`

	const nestedListExample = `<Text content="
- Main item
  - Nested item A
  - Nested item B
    - Deeply nested
- Another main item
" />`

	const checkboxExample = `<Text content="
- [ ] Unchecked task
- [x] Completed task
- [ ] Another pending task
" />`

	const nestedCheckboxExample = `<Text content="
- Project tasks
  - [x] Research complete
  - [ ] Implementation pending
  - [ ] Testing needed
- Documentation
  - [x] API docs written
" />`

	const codeblockExample = `<Text.Codeblock
  content={\`const greeting = 'Hello!'
console.log(greeting)\`}
  highlight="typescript"
/>`

</script>

<Email
	order=3
	category='2. Core Concepts'
	preview="Content formatting with markdown, variables, and lists"
	body-bg={colors.background}
	bg={colors.white}
	max-w-[700px]
>
	<!-- Header -->
	<Div rows gap-2 p-8 bg={colors.primary}>
		<Text.H1 content="📝 Content Formatting" text={colors.white} text-3xl font-bold />
		<Text content="Markdown syntax, variable interpolation, and lists." text={colors.white} text-opacity-90 text-lg />
	</Div>

	<!-- Overview -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Overview" text={colors.text} />
		<Text.Paragraph content="The `content` attribute supports **inline markdown formatting** and **variable interpolation**. This keeps your email content clean and readable." text={colors.textMuted} />
		
		{@render callout('important', `All text content must use the \`content\` attribute. Never write \`<Text>Hello</Text>\` — always use \`<Text content="Hello" />\`.`)}
	</Div>

	<Divider border={colors.border} />

	<!-- Inline Markdown -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Inline Markdown" text={colors.text} />
		<Text.Paragraph content="Format text with familiar markdown syntax:" text={colors.textMuted} />
		
		<Table cols="40% 60%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Syntax" font-bold />
				<Text content="Result" font-bold />
			</Table.Row>
			<Table.Row>
				<Text.Code content="**bold**" />
				<Text content="**bold**" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="*italic*" />
				<Text content="*italic*" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="`code`" />
				<Text content="`code`" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="[text](url)" />
				<Text content="[text](https://example.com)" />
			</Table.Row>
		</Table>
		
		<Text.Codeblock content={markdownExample} highlight="svelte" />
		
		<Preview>
			<Div rows gap-2>
				<Text content="This has **bold** and *italic* text." />
				<Text content="Use `backticks` for inline code." />
				<Text content="Visit [our website](https://example.com) for more." />
			</Div>
		</Preview>
	</Div>

	<Divider border={colors.border} />

	<!-- Multiline Content -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Multiline Content" text={colors.text} />
		<Text.Paragraph content="Content strings can span multiple lines. Line breaks are preserved:" text={colors.textMuted} />
		
		<Text.Codeblock content={multilineExample} highlight="svelte" />
		
		<Preview>
			<Text content="Line one
Line two
Line three" />
		</Preview>
		
		<Text.H3 content="Paragraph Breaks" text={colors.text} />
		<Text.Paragraph content="Use a blank line to create paragraph spacing:" text={colors.textMuted} />
		
		<Text.Codeblock content={linebreakExample} highlight="svelte" />
		
		<Preview>
			<Text content="First paragraph text here.

Second paragraph after the blank line." />
		</Preview>
	</Div>

	<Divider border={colors.border} />

	<!-- Placeholder Interpolation -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Placeholder Interpolation" text={colors.text} />
		<Text.Paragraph content={`Use \`[[variable_name]]\` syntax for dynamic values that are replaced at render time:`} text={colors.textMuted} />
		
		<Text.Codeblock content={variableExample} highlight="svelte" />
		
		<Preview>
			<Text content="Hello [[first_name]]!" />
			<Text content="Your order #[[order_id]] has shipped." />
		</Preview>
		
		<Text.H3 content="Providing Values" text={colors.text} />
		<Text.Paragraph content="Pass placeholder values via the `placeholders` option when rendering:" text={colors.textMuted} />
		
		<Text.Codeblock content={placeholderExample} highlight="typescript" />
		
		{@render callout('note', 'Variables are HTML-escaped automatically. Missing variables remain as `[[var]]` in output.')}
	</Div>

	<Divider border={colors.border} />

	<!-- Lists -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Lists" text={colors.text} />
		<Text.Paragraph content="Lists are created using markdown syntax within the `content` attribute. **Note:** A list requires at least 2 consecutive items to be recognized." text={colors.textMuted} />
		
		<Text.H3 content="Unordered Lists" text={colors.text} />
		<Text.Paragraph content="Create bullet lists using `-` or `*` at the start of each line:" text={colors.textMuted} />
		
		<Text.Codeblock content={listExample} highlight="svelte" />
		
		<Preview>
			<Text 
				content="
					- First item with **bold** text
					- Second item with a [link](https://example.com)
					- Third item
				"
			/>
		</Preview>
		
		<Text.H3 content="Ordered Lists" text={colors.text} />
		<Text.Paragraph content="Use `1.`, `a.`, `A.`, `i.`, or `I.` for numbered lists:" text={colors.textMuted} />
		
		<Text.Codeblock content={orderedListExample} highlight="svelte" />
		
		<Preview>
			<Text content={`
				1. Step one
				2. Step two
				3. Step three
			`} />
		</Preview>
		
		<Text.Small content="List styles: `1.` = numbers, `a.` = lowercase letters, `A.` = uppercase letters, `i.` = lowercase roman, `I.` = uppercase roman" text={colors.textMuted} />
		
		<Text.H3 content="Nested Lists" text={colors.text} />
		<Text.Paragraph content="Indent sublists with 2 spaces or a tab. Bullet styles automatically change by depth: ● → ○ → ■" text={colors.textMuted} />
		
		<Text.Codeblock content={nestedListExample} highlight="svelte" />
		
		<Preview>
			<Text content="
- Main item
  - Nested item A
  - Nested item B
    - Deeply nested
- Another main item
" />
		</Preview>
		
		<Text.Paragraph content="Ordered lists also progress automatically by depth: 1, 2, 3 → a, b, c → i, ii, iii" text={colors.textMuted} />
	</Div>

	<Divider border={colors.border} />

	<!-- Checkboxes -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Checkboxes" text={colors.text} />
		<Text.Paragraph content="Create task lists with checkbox syntax. Use `- [ ]` for unchecked and `- [x]` (or `- [X]`) for checked items:" text={colors.textMuted} />
		
		<Text.Codeblock content={checkboxExample} highlight="svelte" />
		
		<Preview>
			<Text content="
- [ ] Unchecked task
- [x] Completed task
- [ ] Another pending task
" />
		</Preview>
		
		<Text.H3 content="Nested Checkboxes" text={colors.text} />
		<Text.Paragraph content="Checkboxes can be nested within regular list items:" text={colors.textMuted} />
		
		<Text.Codeblock content={nestedCheckboxExample} highlight="svelte" />
		
		<Preview>
			<Text content="
- Project tasks
  - [x] Research complete
  - [ ] Implementation pending
  - [ ] Testing needed
- Documentation
  - [x] API docs written
" />
		</Preview>
		
		{@render callout('note', 'Checkboxes render as styled inline boxes for maximum email client compatibility. Checked items display a green checkmark.')}
	</Div>

	<Divider border={colors.border} />

	<!-- Inline Code -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Inline Code" text={colors.text} />
		<Text.Paragraph content="There are two ways to display inline code:" text={colors.textMuted} />
		
		<Text.H3 content="Markdown Backticks" text={colors.text} />
		<Text.Paragraph content="Use backticks in your content string for simple inline code:" text={colors.textMuted} />
		
		<Text.Codeblock content={`<Text content="Use the \`console.log()\` function." />`} highlight="svelte" />
		
		<Preview>
			<Text content="Use the `console.log()` function." />
		</Preview>
		
		<Text.H3 content="Text.Code Component" text={colors.text} mt-8 />
		<Text.Paragraph content="Use `<Text.Code />` for standalone code snippets or when you need more control:" text={colors.textMuted} />
		
		<Text.Codeblock content={`<Text.Code content="npm install svelte-emails" />`} highlight="svelte" />
		
		<Preview>
			<Text.Code content="npm install svelte-emails" />
		</Preview>
	</Div>

	<Divider border={colors.border} />

	<!-- Code Blocks -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Code Blocks" text={colors.text} />
		<Text.Paragraph content="Use `<Text.Codeblock />` to display multi-line code with syntax highlighting:" text={colors.textMuted} />
		
		<Text.Codeblock content={codeblockExample} highlight="svelte" />
		
		<Preview>
			<Text.Codeblock
				content={`const greeting = 'Hello!'
console.log(greeting)`}
				highlight="typescript"
			/>
		</Preview>
		
		{@render callout('note', 'Syntax highlighting requires [shiki](https://github.com/shikijs/shiki). Install with `bun add -D shiki`.')}
		
		<Text.Small content="Supported languages: `javascript`, `typescript`, `svelte`, `html`, `css`, `json`, `bash`, and more." text={colors.textMuted} />
	</Div>

	<Divider border={colors.border} />

	<!-- Escaping -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Escaping Special Characters" text={colors.text} />
		<Text.Paragraph content="To display literal markdown characters, use backslash escapes:" text={colors.textMuted} />
		
		<Table cols="40% 60%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Input" font-bold />
				<Text content="Output" font-bold />
			</Table.Row>
			<Table.Row>
				<Text.Code content="\*not italic*" />
				<Text content="\*not italic*" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="\`not code`" />
				<Text content="\`not code`" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="\[not a link](url)" />
				<Text content="\[not a link](url)" />
			</Table.Row>
		</Table>
	</Div>

	<Divider border={colors.border} />

	<!-- Quick Reference -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Quick Reference" text={colors.text} />
		
		<Table cols="35% 65%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Feature" font-bold />
				<Text content="Syntax" font-bold />
			</Table.Row>
			<Table.Row>
				<Text content="Bold" />
				<Text.Code content="**text**" />
			</Table.Row>
			<Table.Row>
				<Text content="Italic" />
				<Text.Code content="*text*" />
			</Table.Row>
			<Table.Row>
				<Text content="Inline code" />
				<Text.Code content="`code`" />
			</Table.Row>
			<Table.Row>
				<Text content="Link" />
				<Text.Code content="[text](url)" />
			</Table.Row>
			<Table.Row>
				<Text content="Placeholder" />
				<Text.Code content="[[variable]]" />
			</Table.Row>
			<Table.Row>
				<Text content="Unordered list" />
				<Text.Code content="- item" />
			</Table.Row>
			<Table.Row>
				<Text content="Ordered list" />
				<Text.Code content="1. item" />
			</Table.Row>
			<Table.Row>
				<Text content="Checkbox (unchecked)" />
				<Text.Code content="- [ ] task" />
			</Table.Row>
			<Table.Row>
				<Text content="Checkbox (checked)" />
				<Text.Code content="- [x] task" />
			</Table.Row>
			<Table.Row>
				<Text content="Nested list" />
				<Text content="Indent with 2 spaces or tab" />
			</Table.Row>
			<Table.Row>
				<Text content="Line break" />
				<Text content="Newline in string" />
			</Table.Row>
			<Table.Row>
				<Text content="Paragraph break" />
				<Text content="Blank line in string" />
			</Table.Row>
		</Table>
	</Div>

	{@render footer()}
</Email>
