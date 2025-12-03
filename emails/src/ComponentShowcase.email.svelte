<script lang='ts'>
	/**
	 * Component Showcase Email
	 * 
	 * This email demonstrates ALL components and style attributes from svelte-emails
	 * for comprehensive testing and developer reference.
	 * 
	 * Coverage includes:
	 * - All components: Email, Div, Text (all variants), Table, Button, Link, Img, Spacer, Divider, Br, Unsubscribe
	 * - All style categories: spacing, sizing, colors, typography, borders, alignment, effects, responsive
	 * - Special features: variable interpolation, markdown content, opacity emulation, margin emulation
	 */
	import {
		Email,
		Div,
		Text,
		Table,
		Button,
		Link,
		Img,
		Spacer,
		Divider,
		Br,
		Unsubscribe
	} from 'svelte-emails'

	// Showcase color palette - demonstrating best practice of using variables
	const colors = {
		// Neutral scale
		white: '#ffffff',
		black: '#000000',
		text: '#1a1a1a',
		textMuted: '#333333',
		gray: {
			50: '#f9fafb',
			100: '#f3f4f6',
			200: '#e5e7eb',
			300: '#d1d5db',
			400: '#9ca3af',
			500: '#6b7280',
			600: '#4b5563',
			700: '#374151',
			800: '#1f2937',
			900: '#111827'
		},
		// Brand colors
		primary: '#2563eb',
		success: '#16a34a',
		warning: '#f59e0b',
		danger: '#dc2626',
		purple: '#7c3aed',
		cyan: '#0891b2',
		teal: '#0d9488',
		orange: '#ea580c',
		pink: '#be185d',
		// Pastel backgrounds
		pastel: {
			red: '#fee2e2',
			orange: '#fed7aa',
			yellow: '#fef3c7',
			green: '#d1fae5',
			blue: '#dbeafe',
			purple: '#e9d5ff',
			pink: '#fce7f3',
			cyan: '#ccfbf1',
			indigo: '#c7d2fe'
		}
	}

	// Spacing variables
	const spacing = {
		section: '1.5rem',
		content: '1rem',
		small: '0.5rem'
	}

	interface Props {
		userName?: string
		userEmail?: string
	}

	const {
		userName = 'Test User',
		userEmail = 'test@example.com'
	}: Props = $props()
</script>

<Email
	preview="Component Showcase - Testing all svelte-emails features"
	body-bg={colors.gray[100]}
	bg={colors.white}
	max-w-[650px]
>
	<!-- ================================================================== -->
	<!-- SECTION 1: TEXT COMPONENTS & MARKDOWN SYNTAX -->
	<!-- ================================================================== -->
	<Div bg={colors.text} p-4>
		<Text.H2 content="1. Text Components & Markdown" text={colors.white} />
	</Div>

	<Div p-6>
		<!-- All Text variants -->
		<Text.H1 content="Heading 1 (H1)" text={colors.text} />
		<Text.H2 content="Heading 2 (H2)" text={colors.textMuted} />
		<Text.H3 content="Heading 3 (H3)" text={colors.gray[400]} />
		<Text.H4 content="Heading 4 (H4)" text={colors.gray[500]} />
		<Text.H5 content="Heading 5 (H5)" text={colors.gray[500]} />
		<Text.H6 content="Heading 6 (H6)" text={colors.gray[600]} />

		<Spacer h-4 />

		<Text.Paragraph
			content="This is a **Paragraph** component with multi-line support and *proper line break handling*."
			text={colors.textMuted}
			leading-relaxed
		/>

		<Text content="Regular Text component" text={colors.textMuted} />
		<Br />
		<Text.Small content="Small text variant" text={colors.gray[500]} />

		<Spacer h-6 />

		<!-- Markdown formatting showcase -->
		<Text.H4 content="**Markdown Formatting:**" text={colors.text} />
		<Text.Paragraph
			content="**Bold text** and *italic text* and ~~strikethrough~~ and __underlined__"
			text={colors.textMuted}
		/>
		<Text.Paragraph
			content="Links: [Click here](https://example.com) and inline `code`"
			text={colors.textMuted}
		/>
		<Text.Paragraph
			content="^Superscript^ and subscript (H_2_O format)"
			text={colors.textMuted}
		/>
		<Text.Paragraph
			content="--Small text via markdown-- and (#ff0000)colored text(/)"
			text={colors.textMuted}
		/>
		<Text.Paragraph
			content="[#ffff00]Highlighted text with background[/]"
			text={colors.textMuted}
		/>

		<Spacer h-4 />

		<!-- Variable interpolation -->
		<Text.H4 content="**Variable Interpolation:**" text={colors.text} />
		<Text.Paragraph
			content="Hello [[first_name]], your email is [[email]]."
			text={colors.textMuted}
		/>

		<Spacer h-4 />

		<!-- Lists -->
		<Text.H4 content="**List Formats:**" text={colors.text} />
		<Text.Paragraph
			content="- Bullet item 1
- Bullet item 2
- Bullet item 3"
			text={colors.textMuted}
		/>

		<Text.Paragraph
			content="1. Numbered item
2. Second item
3. Third item"
			text={colors.textMuted}
		/>
	</Div>

	<!-- ================================================================== -->
	<!-- SECTION 2: SPACING & SIZING -->
	<!-- ================================================================== -->
	<Div bg={colors.primary} p-4>
		<Text.H2 content="2. Spacing & Sizing" text={colors.white} />
	</Div>

	<Div p-6>
		<Text.H4 content="**Padding Scale:**" text={colors.text} />
		<Div cols gap-2 responsive>
			<Div p-1 bg={colors.pastel.indigo}><Text.Small content="p-1" /></Div>
			<Div p-2 bg={colors.pastel.blue}><Text.Small content="p-2" /></Div>
			<Div p-3 bg={colors.primary}><Text.Small content="p-3" text={colors.white} /></Div>
			<Div p-4 bg={colors.purple}><Text.Small content="p-4" text={colors.white} /></Div>
		</Div>

		<Spacer h-4 />

		<Text.H4 content="**Directional Padding:**" text={colors.text} />
		<Div bg={colors.pastel.yellow} pt-6 pb-2 px-4>
			<Text.Small content="pt-6 pb-2 px-4" />
		</Div>

		<Spacer h-4 />

		<Text.H4 content="**Margin Emulation:**" text={colors.text} />
		<Div bg={colors.pastel.green} p-2>
			<Div bg={colors.success} p-3 m-4>
				<Text.Small content="Element with m-4 (emulated via wrapper)" text={colors.white} />
			</Div>
		</Div>

		<Spacer h-4 />

		<Text.H4 content="**Width & Height:**" text={colors.text} />
		<Div cols gap-2>
			<Div w-[100px] h-[50px] bg={colors.pastel.red} align-middle>
				<Text.Small content="100×50" />
			</Div>
			<Div w-[150px] h-[50px] bg={colors.pastel.orange} align-middle>
				<Text.Small content="150×50" />
			</Div>
			<Div w-full h-[30px] bg={colors.pastel.yellow} align-middle>
				<Text.Small content="w-full" />
			</Div>
		</Div>

		<Spacer h-4 />

		<Text.H4 content="**Spacer Component:**" text={colors.text} />
		<Div bg={colors.gray[100]}>
			<Text.Small content="Above spacer" />
			<Spacer h-8 />
			<Text.Small content="Below h-8 spacer" />
		</Div>

		<Spacer h-2 />

		<Div cols bg={colors.gray[100]}>
			<Text.Small content="Left" />
			<Spacer w-12 />
			<Text.Small content="Right (w-12 spacer between)" />
		</Div>
	</Div>

	<!-- ================================================================== -->
	<!-- SECTION 3: COLORS & OPACITY -->
	<!-- ================================================================== -->
	<Div bg={colors.purple} p-4>
		<Text.H2 content="3. Colors & Opacity Emulation" text={colors.white} />
	</Div>

	<Div p-6>
		<Text.H4 content="**Background Colors:**" text={colors.text} />
		<Div cols gap-2 responsive>
			<Div p-3 bg={colors.danger} align-middle><Text.Small content="#ef4444" text={colors.white} /></Div>
			<Div p-3 bg={colors.orange} align-middle><Text.Small content="#f97316" text={colors.white} /></Div>
			<Div p-3 bg={colors.warning} align-middle><Text.Small content="#eab308" /></Div>
			<Div p-3 bg={colors.success} align-middle><Text.Small content="#22c55e" text={colors.white} /></Div>
			<Div p-3 bg={colors.primary} align-middle><Text.Small content="#3b82f6" text={colors.white} /></Div>
		</Div>

		<Spacer h-4 />

		<Text.H4 content="**Opacity Emulation (blended colors):**" text={colors.text} />
		<Div bg={colors.white} p-4>
			<Div cols gap-2>
				<Div p-3 bg={colors.black} align-middle>
					<Text.Small content="100%" text={colors.white} />
				</Div>
				<Div p-3 bg-opacity-75 bg={colors.black} align-middle>
					<Text.Small content="75%" text={colors.white} />
				</Div>
				<Div p-3 bg-opacity-50 bg={colors.black} align-middle>
					<Text.Small content="50%" text={colors.white} />
				</Div>
				<Div p-3 bg-opacity-25 bg={colors.black} align-middle>
					<Text.Small content="25%" />
				</Div>
			</Div>
		</Div>

		<Spacer h-4 />

		<Text.H4 content="**Text Opacity:**" text={colors.text} />
		<Text content="100% opacity text" text={colors.black} />
		<Br />
		<Text content="75% opacity text" text={colors.black} text-opacity-75 />
		<Br />
		<Text content="50% opacity text" text={colors.black} text-opacity-50 />
		<Br />
		<Text content="25% opacity text" text={colors.black} text-opacity-25 />

		<Spacer h-4 />

		<Text.H4 content="**Element Opacity (compounds with colors):**" text={colors.text} />
		<Div opacity-50 p-4 bg={colors.primary}>
			<Text content="Entire div at 50% opacity" text={colors.white} />
		</Div>
	</Div>

	<!-- ================================================================== -->
	<!-- SECTION 4: TYPOGRAPHY -->
	<!-- ================================================================== -->
	<Div bg={colors.success} p-4>
		<Text.H2 content="4. Typography" text={colors.white} />
	</Div>

	<Div p-6>
		<Text.H4 content="**Font Sizes:**" text={colors.text} />
		<Text content="text-xs (extra small)" text-xs text={colors.textMuted} />
		<Br />
		<Text content="text-sm (small)" text-sm text={colors.textMuted} />
		<Br />
		<Text content="text-base (base)" text-base text={colors.textMuted} />
		<Br />
		<Text content="text-lg (large)" text-lg text={colors.textMuted} />
		<Br />
		<Text content="text-xl (extra large)" text-xl text={colors.textMuted} />
		<Br />
		<Text content="text-2xl" text-2xl text={colors.textMuted} />

		<Spacer h-4 />

		<Text.H4 content="**Font Weights:**" text={colors.text} />
		<Text content="font-light" font-light text={colors.textMuted} />
		<Br />
		<Text content="font-normal" font-normal text={colors.textMuted} />
		<Br />
		<Text content="font-medium" font-medium text={colors.textMuted} />
		<Br />
		<Text content="font-semibold" font-semibold text={colors.textMuted} />
		<Br />
		<Text content="font-bold" font-bold text={colors.textMuted} />
		<Br />
		<Text content="font-extrabold" font-extrabold text={colors.textMuted} />

		<Spacer h-4 />

		<Text.H4 content="**Font Styles & Decorations:**" text={colors.text} />
		<Text content="Italic text" italic text={colors.textMuted} />
		<Br />
		<Text content="Underlined text" underline text={colors.textMuted} />
		<Br />
		<Text content="Line-through text" line-through text={colors.textMuted} />
		<Br />
		<Text content="UPPERCASE" uppercase text={colors.textMuted} />
		<Br />
		<Text content="capitalize each word" capitalize text={colors.textMuted} />

		<Spacer h-4 />

		<Text.H4 content="**Line Height:**" text={colors.text} />
		<Div bg={colors.gray[100]} p-3>
			<Text.Paragraph content="leading-tight: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor." leading-tight text={colors.textMuted} />
		</Div>
		<Spacer h-2 />
		<Div bg={colors.gray[100]} p-3>
			<Text.Paragraph content="leading-relaxed: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor." leading-relaxed text={colors.textMuted} />
		</Div>
		<Spacer h-2 />
		<Div bg={colors.gray[100]} p-3>
			<Text.Paragraph content="leading-loose: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor." leading-loose text={colors.textMuted} />
		</Div>

		<Spacer h-4 />

		<Text.H4 content="**Letter Spacing:**" text={colors.text} />
		<Text content="tracking-tight" tracking-tight text={colors.textMuted} />
		<Br />
		<Text content="tracking-normal" tracking-normal text={colors.textMuted} />
		<Br />
		<Text content="tracking-wide" tracking-wide text={colors.textMuted} />
		<Br />
		<Text content="tracking-widest" tracking-widest text={colors.textMuted} />
	</Div>

	<!-- ================================================================== -->
	<!-- SECTION 5: ALIGNMENT -->
	<!-- ================================================================== -->
	<Div bg={colors.danger} p-4>
		<Text.H2 content="5. Alignment" text={colors.white} />
	</Div>

	<Div p-6>
		<Text.H4 content="**Content Alignment (align-*):**" text={colors.text} />

		<!-- 3x3 grid showing all alignments -->
		<Div cols gap-2>
			<Div h-[60px] bg={colors.pastel.red} align-top-left p-2>
				<Text.Small content="top-left" />
			</Div>
			<Div h-[60px] bg={colors.pastel.yellow} align-top p-2>
				<Text.Small content="top" />
			</Div>
			<Div h-[60px] bg={colors.pastel.green} align-top-right p-2>
				<Text.Small content="top-right" />
			</Div>
		</Div>
		<Div cols gap-2>
			<Div h-[60px] bg={colors.pastel.blue} align-left p-2>
				<Text.Small content="left" />
			</Div>
			<Div h-[60px] bg={colors.pastel.purple} align-middle p-2>
				<Text.Small content="middle" />
			</Div>
			<Div h-[60px] bg={colors.pastel.pink} align-right p-2>
				<Text.Small content="right" />
			</Div>
		</Div>
		<Div cols gap-2>
			<Div h-[60px] bg={colors.pastel.cyan} align-bottom-left p-2>
				<Text.Small content="bottom-left" />
			</Div>
			<Div h-[60px] bg={colors.pastel.yellow} align-bottom p-2>
				<Text.Small content="bottom" />
			</Div>
			<Div h-[60px] bg={colors.pastel.purple} align-bottom-right p-2>
				<Text.Small content="bottom-right" />
			</Div>
		</Div>

		<Spacer h-4 />

		<Text.H4 content="**Text Justification (justify-*):**" text={colors.text} />
		<Div bg={colors.gray[100]} p-3>
			<Text.Paragraph content="justify-left: Lorem ipsum dolor sit amet." justify-left text={colors.textMuted} />
		</Div>
		<Spacer h-2 />
		<Div bg={colors.gray[100]} p-3>
			<Text.Paragraph content="justify-center: Lorem ipsum dolor sit amet." justify-center text={colors.textMuted} />
		</Div>
		<Spacer h-2 />
		<Div bg={colors.gray[100]} p-3>
			<Text.Paragraph content="justify-right: Lorem ipsum dolor sit amet." justify-right text={colors.textMuted} />
		</Div>
	</Div>

	<!-- ================================================================== -->
	<!-- SECTION 6: BORDERS -->
	<!-- ================================================================== -->
	<Div bg={colors.orange} p-4>
		<Text.H2 content="6. Borders" text={colors.white} />
	</Div>

	<Div p-6>
		<Text.H4 content="**Border Widths:**" text={colors.text} />
		<Div cols gap-4 responsive>
			<Div border border-1 p-3 align-middle>
				<Text.Small content="border (1px)" />
			</Div>
			<Div border-2 border={colors.textMuted} p-3 align-middle>
				<Text.Small content="border-2" />
			</Div>
			<Div border-4 border={colors.textMuted} p-3 align-middle>
				<Text.Small content="border-4" />
			</Div>
		</Div>

		<Spacer h-4 />

		<Text.H4 content="**Directional Borders:**" text={colors.text} />
		<Div cols gap-4 responsive>
			<Div border-t-2 border={colors.danger} p-3>
				<Text.Small content="border-t" />
			</Div>
			<Div border-r-2 border={colors.success} p-3>
				<Text.Small content="border-r" />
			</Div>
			<Div border-b-2 border={colors.primary} p-3>
				<Text.Small content="border-b" />
			</Div>
			<Div border-l-2 border={colors.purple} p-3>
				<Text.Small content="border-l" />
			</Div>
		</Div>

		<Spacer h-4 />

		<Text.H4 content="**Border Styles:**" text={colors.text} />
		<Div cols gap-4 responsive>
			<Div border-2 border-solid border={colors.textMuted} p-3 align-middle>
				<Text.Small content="solid" />
			</Div>
			<Div border-2 border-dashed border={colors.textMuted} p-3 align-middle>
				<Text.Small content="dashed" />
			</Div>
			<Div border-2 border-dotted border={colors.textMuted} p-3 align-middle>
				<Text.Small content="dotted" />
			</Div>
		</Div>

		<Spacer h-4 />

		<Text.H4 content="**Border Radius (⚠️ Outlook ignores):**" text={colors.text} />
		<Div cols gap-4 responsive>
			<Div bg={colors.pastel.blue} p-4 rounded-sm align-middle>
				<Text.Small content="rounded-sm" />
			</Div>
			<Div bg={colors.pastel.blue} p-4 rounded-md align-middle>
				<Text.Small content="rounded-md" />
			</Div>
			<Div bg={colors.pastel.blue} p-4 rounded-lg align-middle>
				<Text.Small content="rounded-lg" />
			</Div>
			<Div bg={colors.pastel.blue} p-4 rounded-xl align-middle>
				<Text.Small content="rounded-xl" />
			</Div>
			<Div bg={colors.pastel.blue} p-4 w-[60px] h-[60px] rounded-full align-middle>
				<Text.Small content="full" />
			</Div>
		</Div>

		<Spacer h-4 />

		<Text.H4 content="**Border Opacity:**" text={colors.text} />
		<Div cols gap-4>
			<Div border-2 border={colors.black} p-3 align-middle>
				<Text.Small content="100%" />
			</Div>
			<Div border-2 border={colors.black} border-opacity-50 p-3 align-middle>
				<Text.Small content="50%" />
			</Div>
			<Div border-2 border={colors.black} border-opacity-25 p-3 align-middle>
				<Text.Small content="25%" />
			</Div>
		</Div>
	</Div>

	<!-- ================================================================== -->
	<!-- SECTION 7: GRID LAYOUTS (Div cols/rows) -->
	<!-- ================================================================== -->
	<Div bg={colors.cyan} p-4>
		<Text.H2 content="7. Grid Layouts (Div cols/rows)" text={colors.white} />
	</Div>

	<Div p-6>
		<Text.H4 content="**Basic Columns:**" text={colors.text} />
		<Div cols>
			<Div bg={colors.pastel.yellow} p-3 align-middle><Text.Small content="Col 1" /></Div>
			<Div bg={colors.pastel.green} p-3 align-middle><Text.Small content="Col 2" /></Div>
			<Div bg={colors.pastel.blue} p-3 align-middle><Text.Small content="Col 3" /></Div>
		</Div>

		<Spacer h-4 />

		<Text.H4 content="**Column Template (cols=...):**" text={colors.text} />
		<Div cols="20% 50% 30%">
			<Div bg={colors.pastel.yellow} p-3 align-middle><Text.Small content="20%" /></Div>
			<Div bg={colors.pastel.green} p-3 align-middle><Text.Small content="50%" /></Div>
			<Div bg={colors.pastel.blue} p-3 align-middle><Text.Small content="30%" /></Div>
		</Div>

		<Spacer h-4 />

		<Text.H4 content="**Gap Spacing:**" text={colors.text} />
		<Div cols gap-4>
			<Div bg={colors.pastel.red} p-3 align-middle><Text.Small content="gap-4" /></Div>
			<Div bg={colors.pastel.red} p-3 align-middle><Text.Small content="between" /></Div>
			<Div bg={colors.pastel.red} p-3 align-middle><Text.Small content="columns" /></Div>
		</Div>

		<Spacer h-4 />

		<Text.H4 content="**Column Spanning (span-*):**" text={colors.text} />
		<Div cols="25% 25% 25% 25%">
			<Div bg={colors.pastel.indigo} p-3 span-2 align-middle><Text.Small content="span-2" /></Div>
			<Div bg={colors.pastel.purple} p-3 span-2 align-middle><Text.Small content="span-2" /></Div>
		</Div>
		<Div cols="25% 25% 25% 25%">
			<Div bg={colors.pastel.pink} p-3 align-middle><Text.Small content="1" /></Div>
			<Div bg={colors.pink} p-3 span-3 align-middle><Text.Small content="span-3" text={colors.white} /></Div>
		</Div>

		<Spacer h-4 />

		<Text.H4 content="**Responsive Columns (stack on mobile):**" text={colors.text} />
		<Div cols responsive gap-4>
			<Div bg={colors.pastel.green} p-4 align-middle>
				<Text.Paragraph content="This column will stack on mobile devices" />
			</Div>
			<Div bg={colors.pastel.cyan} p-4 align-middle>
				<Text.Paragraph content="Second column also stacks" />
			</Div>
		</Div>

		<Spacer h-4 />

		<Text.H4 content="**Rows Layout:**" text={colors.text} />
		<Div rows gap-2>
			<Div bg={colors.pastel.yellow} p-3><Text.Small content="Row 1" /></Div>
			<Div bg={colors.pastel.green} p-3><Text.Small content="Row 2" /></Div>
			<Div bg={colors.pastel.blue} p-3><Text.Small content="Row 3" /></Div>
		</Div>
	</Div>

	<!-- ================================================================== -->
	<!-- SECTION 8: TABLE COMPONENT -->
	<!-- ================================================================== -->
	<Div bg={colors.purple} p-4>
		<Text.H2 content="8. Table Component" text={colors.white} />
	</Div>

	<Div p-6>
		<Text.H4 content="**Basic Table with Header:**" text={colors.text} />
		<Table cols="40% 30% 30%" border>
			<Table.Row header bg={colors.gray[100]} font-bold>
				<Text content="Product" />
				<Text content="Quantity" align-middle />
				<Text content="Price" align-right />
			</Table.Row>
			<Table.Row>
				<Text content="Widget A" />
				<Text content="5" align-middle />
				<Text content="$25.00" align-right />
			</Table.Row>
			<Table.Row>
				<Text content="Widget B" />
				<Text content="3" align-middle />
				<Text content="$15.00" align-right />
			</Table.Row>
			<Table.Row bg={colors.gray[50]}>
				<Text content="**Total**" font-bold />
				<Spacer />
				<Text content="**$40.00**" font-bold align-right />
			</Table.Row>
		</Table>

		<Spacer h-6 />

		<Text.H4 content="**Striped Table:**" text={colors.text} />
		<Table cols="50% 50%" striped border-outer>
			<Table.Row header bg={colors.primary} text={colors.white}>
				<Text content="Feature" />
				<Text content="Status" />
			</Table.Row>
			<Table.Row>
				<Text content="Email Delivery" />
				<Text content="✅ Active" />
			</Table.Row>
			<Table.Row>
				<Text content="Analytics" />
				<Text content="✅ Active" />
			</Table.Row>
			<Table.Row>
				<Text content="A/B Testing" />
				<Text content="⚠️ Beta" />
			</Table.Row>
		</Table>

		<Spacer h-6 />

		<Text.H4 content="**Compact Table with Cell Border:**" text={colors.text} />
		<Table cols="33% 33% 34%" cell-border compact>
			<Table.Row header>
				<Text.Small content="**A**" />
				<Text.Small content="**B**" />
				<Text.Small content="**C**" />
			</Table.Row>
			<Table.Row>
				<Text.Small content="1" />
				<Text.Small content="2" />
				<Text.Small content="3" />
			</Table.Row>
			<Table.Row>
				<Text.Small content="4" />
				<Text.Small content="5" />
				<Text.Small content="6" />
			</Table.Row>
		</Table>

		<Spacer h-6 />

		<Text.H4 content="**Table Row Style Inheritance:**" text={colors.text} />
		<Table cols="50% 50%" border>
			<Table.Row bg={colors.pastel.yellow} font-bold text={colors.warning}>
				<Text content="Bold amber row" />
				<Text content="Inherited style" />
			</Table.Row>
			<Table.Row bg={colors.pastel.green} italic text={colors.success}>
				<Text content="Italic green row" />
				<Text content="Also inherited" font-normal />
			</Table.Row>
		</Table>

		<Spacer h-6 />

		<Text.H4 content="**Markdown Table (in content):**" text={colors.text} />
		<Text.Paragraph content={`
| Name | Email | Role |
|------|-------|------|
| Alice | alice@example.com | Admin |
| Bob | bob@example.com | User |
| Charlie | charlie@example.com | User |
`} text={colors.textMuted} />
	</Div>

	<!-- ================================================================== -->
	<!-- SECTION 9: BUTTONS & LINKS -->
	<!-- ================================================================== -->
	<Div bg={colors.pink} p-4>
		<Text.H2 content="9. Buttons & Links" text={colors.white} />
	</Div>

	<Div p-6>
		<Text.H4 content="**Button Styles:**" text={colors.text} />
		<Div rows gap-3>
			<Button
				href="https://example.com"
				content="Primary Button"
				bg={colors.primary}
				text={colors.white}
				px-6
				py-3
				font-semibold
				rounded-md
			/>
			<Button
				href="https://example.com"
				content="Secondary Button"
				bg={colors.white}
				text={colors.textMuted}
				border={colors.gray[300]}
				px-6
				py-3
				rounded-md
			/>
			<Button
				href="https://example.com"
				content="Success Button"
				bg={colors.success}
				text={colors.white}
				px-6
				py-3
				font-bold
				rounded-lg
			/>
			<Button
				href="https://example.com"
				content="Warning Button"
				bg={colors.warning}
				text={colors.text}
				px-6
				py-3
				font-medium
			/>
			<Button
				href="https://example.com"
				content="Danger Button"
				bg={colors.danger}
				text={colors.white}
				px-8
				py-4
				font-bold
				rounded-full
			/>
		</Div>

		<Spacer h-6 />

		<Text.H4 content="**Button Sizes:**" text={colors.text} />
		<Div cols gap-4 align-middle>
			<Button
				href="https://example.com"
				content="Small"
				bg={colors.purple}
				text={colors.white}
				px-3
				py-1
				text-xs
			/>
			<Button
				href="https://example.com"
				content="Medium"
				bg={colors.purple}
				text={colors.white}
				px-4
				py-2
				text-sm
			/>
			<Button
				href="https://example.com"
				content="Large"
				bg={colors.purple}
				text={colors.white}
				px-6
				py-3
				text-base
			/>
		</Div>

		<Spacer h-6 />

		<Text.H4 content="**Inline Links:**" text={colors.text} />
		<Text.Paragraph
			content="This paragraph contains an inline link:"
			text={colors.textMuted}
		/>
		<Link href="https://example.com">
			<Text content="Click here to visit Example.com" text={colors.primary} underline />
		</Link>

		<Spacer h-4 />

		<Text.Paragraph
			content="Links can also have [markdown syntax](https://example.com) in text content."
			text={colors.textMuted}
		/>
	</Div>

	<!-- ================================================================== -->
	<!-- SECTION 10: IMAGES -->
	<!-- ================================================================== -->
	<Div bg={colors.teal} p-4>
		<Text.H2 content="10. Images" text={colors.white} />
	</Div>

	<Div p-6>
		<Text.H4 content="**Basic Image:**" text={colors.text} />
		<Img
			src="https://fpoimg.com/400x200"
			alt="Sample image 400x200"
			width={400}
			height={200}
		/>

		<Spacer h-4 />

		<Text.H4 content="**Image with Border Radius:**" text={colors.text} />
		<Div cols gap-4>
			<Img
				src="https://fpoimg.com/120x120"
				alt="Square image"
				width={120}
				height={120}
				rounded-md
			/>
			<Img
				src="https://fpoimg.com/120x120"
				alt="Circular image"
				width={120}
				height={120}
				rounded-full
			/>
		</Div>

		<Spacer h-4 />

		<Text.H4 content="**Clickable Image (with href):**" text={colors.text} />
		<Img
			src="https://fpoimg.com/300x150"
			alt="Click to visit example.com"
			width={300}
			height={150}
			href="https://example.com"
			border={colors.gray[200]}
		/>

		<Spacer h-4 />

		<Text.H4 content="**Image Grid:**" text={colors.text} />
		<Div cols gap-2 responsive>
			<Img src="https://fpoimg.com/180x120" alt="Image 1" width={180} height={120} />
			<Img src="https://fpoimg.com/180x120" alt="Image 2" width={180} height={120} />
			<Img src="https://fpoimg.com/180x120" alt="Image 3" width={180} height={120} />
		</Div>
	</Div>

	<!-- ================================================================== -->
	<!-- SECTION 11: DIVIDERS -->
	<!-- ================================================================== -->
	<Div bg={colors.gray[500]} p-4>
		<Text.H2 content="11. Dividers" text={colors.white} />
	</Div>

	<Div p-6>
		<Text.H4 content="**Default Divider:**" text={colors.text} />
		<Divider />

		<Spacer h-4 />

		<Text.H4 content="**Styled Dividers:**" text={colors.text} />
		<Divider border={colors.danger} border-2 />
		<Spacer h-2 />
		<Divider border={colors.success} border-dashed />
		<Spacer h-2 />
		<Divider border={colors.primary} border-dotted border-4 />
	</Div>

	<!-- ================================================================== -->
	<!-- SECTION 12: RESPONSIVE -->
	<!-- ================================================================== -->
	<Div bg={colors.purple} p-4>
		<Text.H2 content="12. Responsive Utilities" text={colors.white} />
	</Div>

	<Div p-6>
		<Text.H4 content="**Mobile Only (hidden on desktop):**" text={colors.text} />
		<Div mobile-only bg={colors.pastel.yellow} p-4>
			<Text content="📱 This content only shows on mobile" text="#92400e" />
		</Div>

		<Spacer h-4 />

		<Text.H4 content="**Desktop Only (hidden on mobile):**" text={colors.text} />
		<Div desktop-only bg={colors.pastel.blue} p-4>
			<Text content="🖥️ This content only shows on desktop" text={colors.primary} />
		</Div>

		<Spacer h-4 />

		<Text.H4 content="**Responsive Columns (resize to test):**" text={colors.text} />
		<Div cols responsive gap-4>
			<Div bg={colors.pastel.green} p-4>
				<Text.Paragraph content="Column A - will stack on mobile" text={colors.success} />
			</Div>
			<Div bg={colors.pastel.cyan} p-4>
				<Text.Paragraph content="Column B - will stack on mobile" text={colors.cyan} />
			</Div>
		</Div>
	</Div>

	<!-- ================================================================== -->
	<!-- SECTION 13: SPECIAL COMPONENTS -->
	<!-- ================================================================== -->
	<Div bg={colors.gray[800]} p-4>
		<Text.H2 content="13. Special Components" text={colors.white} />
	</Div>

	<Div p-6>
		<Text.H4 content="**Br (Line Break):**" text={colors.text} />
		<Text content="Line 1" text={colors.textMuted} />
		<Br />
		<Text content="Line 2 (after Br component)" text={colors.textMuted} />
		<Br />
		<Text content="Line 3" text={colors.textMuted} />

		<Spacer h-6 />

		<Text.H4 content="**Unsubscribe Component:**" text={colors.text} />
		<Unsubscribe
			href="https://example.com/unsubscribe"
			email="unsubscribe@example.com"
			content="Click here to unsubscribe"
			text={colors.gray[500]}
			text-xs
		/>

		<Spacer h-4 />

		<Text.Small content="(Sets List-Unsubscribe header automatically)" text={colors.gray[400]} />
	</Div>

	<!-- ================================================================== -->
	<!-- SECTION 14: VALUE SYNTAX -->
	<!-- ================================================================== -->
	<Div bg={colors.orange} p-4>
		<Text.H2 content="14. Value Syntax (Svelte Variables)" text={colors.white} />
	</Div>

	<Div p-6>
		<Text.H4 content="**Value Syntax Examples:**" text={colors.text} />
		<Text.Paragraph
			content="All bracket attributes support value syntax for dynamic styling:"
			text={colors.textMuted}
		/>

		<Spacer h-4 />

		<!-- Demonstrating value syntax -->
		<Div bg={colors.pastel.yellow} p="16px" w="300px">
			<Text content='bg={colors.pastel.yellow} p="16px" w="300px"' text="#92400e" text-sm />
		</Div>

		<Spacer h-4 />

		<!-- Value syntax for cols uses cols="..." without the boolean cols attr -->
		<Div cols="40% 30% 30%">
			<Div bg={colors.pastel.blue} p="8px" align-middle>
				<Text.Small content='cols="40% 30% 30%"' />
			</Div>
			<Div bg={colors.pastel.green} p="8px" align-middle>
				<Text.Small content="30%" />
			</Div>
			<Div bg={colors.pastel.pink} p="8px" align-middle>
				<Text.Small content="30%" />
			</Div>
		</Div>
	</Div>

	<!-- ================================================================== -->
	<!-- FOOTER -->
	<!-- ================================================================== -->
	<Div bg={colors.gray[100]} p-6 align-middle>
		<Text.H3 content="🎉 Component Showcase Complete!" text={colors.text} />
		<Spacer h-2 />
		<Text.Paragraph
			content="This email demonstrates all svelte-emails components and style attributes for comprehensive testing."
			text={colors.gray[600]}
			align-middle
		/>

		<Spacer h-4 />

		<Text.Small content="© 2025 svelte-emails • [Documentation](https://github.com/Refzlund/svelte-emails)" text={colors.gray[400]} />

		<Spacer h-4 />

		<Unsubscribe
			href="https://example.com/unsubscribe"
			content="Unsubscribe from test emails"
			text={colors.gray[500]}
			text-xs
		/>
	</Div>
</Email>