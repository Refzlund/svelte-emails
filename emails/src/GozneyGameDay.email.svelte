<script lang='ts'>
	import {
		Email,
		Div,
		Text,
		Button,
		Img,
		Spacer,
		Link,
		Divider,
		Unsubscribe,
		Br
	} from 'svelte-emails'

	// Gozney brand colors
	const colors = {
		brand: '#1a1a1a',
		text: '#333333',
		muted: '#666666',
		light: '#999999',
		lighter: '#cccccc',
		border: '#e5e5e5',
		bg: '#f5f5f5',
		white: '#ffffff',
		link: '#1a73e8'
	}

	// Spacing scale
	const spacing = {
		section: '1.5rem',
		content: '1rem',
		small: '0.5rem'
	}

	interface Recipe {
		name: string
		description: string
		imageUrl: string
		url: string
	}

	interface Props {
		heroTitle?: string
		heroDescription?: string
		heroImageUrl?: string
		burgers?: Recipe[]
		pizzas?: Recipe[]
		shareItems?: Recipe[]
		wings?: Recipe[]
		productTitle?: string
		productDescription?: string
		productImageUrl?: string
		productUrl?: string
		features?: string[]
	}

	const {
		heroTitle = 'Ready for Game Day?',
		heroDescription = "It isn't just about the match, it's about what's on the table.\n\nFire up your Gozney and go big. From flame-seared burgers stacked high, to sizzling wings, perfect pizzas, and shareable plates—this is how you turn Game Day into a feast.\n\nFrom kick-off to the last bite, your Gozney brings the heat and the flavor. All you need to do is gather the crew and enjoy.",
		heroImageUrl = 'https://fpoimg.com/600x300',
		burgers = [
			{
				name: 'Smash Burgers',
				description: 'Flame seared, stacked high, and made for sharing.',
				imageUrl: 'https://fpoimg.com/280x180',
				url: 'https://example.com/recipe/smash-burgers'
			},
			{
				name: 'Steakhouse Burger',
				description: 'In the words of Marc Schechter, "I f***ing love burgers".',
				imageUrl: 'https://fpoimg.com/280x180',
				url: 'https://example.com/recipe/steakhouse-burger'
			}
		],
		pizzas = [
			{
				name: 'Cheesy Pizza Bites',
				description: 'Spicy, garlicky and oozing with mozzarella - these are perfect for game day.',
				imageUrl: 'https://fpoimg.com/280x180',
				url: 'https://example.com/recipe/cheesy-pizza-bites'
			},
			{
				name: 'Pizza Caprese',
				description: 'Keep it classic. This Caprese Pizza is simple. Delicious. Game Day ready.',
				imageUrl: 'https://fpoimg.com/280x180',
				url: 'https://example.com/recipe/pizza-caprese'
			}
		],
		shareItems = [
			{
				name: 'Game Day Nachos',
				description: 'NY Strip Steak cooked on Gozney Dome and served over Argentinian style nachos.',
				imageUrl: 'https://fpoimg.com/280x180',
				url: 'https://example.com/recipe/game-day-nachos'
			},
			{
				name: 'Chicken Tacos',
				description: "Thomas Straker is back and he's got a Chicken Taco recipe you need to try out in your Gozney outdoor oven.",
				imageUrl: 'https://fpoimg.com/280x180',
				url: 'https://example.com/recipe/chicken-tacos'
			}
		],
		wings = [
			{
				name: 'Salt & Pepper Wings',
				description: "Think you've tried good chicken wings? Wait until you try these insane Salt & Pepper wings with a maple glaze by Thomas Straker.",
				imageUrl: 'https://fpoimg.com/280x180',
				url: 'https://example.com/recipe/salt-pepper-wings'
			},
			{
				name: 'Korean Chicken Wings',
				description: "If you're looking for a lot of flavour and a real crowd pleaser, then look no further than Chef Philli's Korean Chicken Wings.",
				imageUrl: 'https://fpoimg.com/280x180',
				url: 'https://example.com/recipe/korean-chicken-wings'
			}
		],
		productTitle = "Restaurant-quality pizza has never been this easy",
		productDescription = "Everyone loves pizza. Not everyone is a pro pizza maker—yet. That's where the Gozney Pizza Dough Mix comes in.\n\nCrafted from premium ingredients and tested in the Gozney kitchen, it's designed to give you that perfect, restaurant-quality crust right at home. All it takes is water, mix, and a little time. In just 2 hours, you'll be pulling crispy, thin-crust pizza from your oven that your crew will love.\n\nWhether you're keeping it classic with cheese & pepperoni or experimenting with bold toppings, this mix makes it easy to nail the perfect base every time.",
		productImageUrl = 'https://fpoimg.com/600x400',
		productUrl = 'https://example.com/shop/pizza-dough-mix',
		features = ['Free Shipping', 'Payment Financing Available', '% Year Extended Warranty', 'World-Class Customer Service']
	}: Props = $props()
</script>

<Email
	category='Test'
	preview="Ready for Game Day? Fire up your Gozney 🔥"
	body-bg={colors.bg}
	bg={colors.white}
	max-w-[600px]
>
	<!-- Header with Logo -->
	<Div bg={colors.brand} p-4 align-middle>
		<Img
			src="https://fpoimg.com/120x30"
			alt="GOZNEY"
			width={120}
			height={30}
		/>
	</Div>

	<!-- Hero Image -->
	<Img
		src={heroImageUrl}
		alt="Game Day spread"
		width={600}
		height={300}
	/>

	<!-- Hero Content -->
	<Div p-6>
		<Text.H1
			content={heroTitle}
			text={colors.brand}
			text-[32px]
			font-bold
		/>

		<Spacer h-4 />

		<Text.Paragraph
			content={heroDescription}
			text={colors.text}
			leading-relaxed
		/>
	</Div>

	<!-- Burgers Section -->
	<Div p-6>
		<Text.Small content="**BURGERS**" text={colors.muted} tracking-widest />

		<Spacer h-4 />

		<Div cols responsive gap-4>
			{#each burgers as burger}
				<Div>
					<Img
						src={burger.imageUrl}
						alt={burger.name}
						width={280}
						height={180}
					/>
					<Spacer h-3 />
					<Text.H3 content="**{burger.name}**" text={colors.brand} text-lg />
					<Spacer h-1 />
					<Text.Small content={burger.description} text={colors.muted} leading-relaxed />
					<Spacer h-3 />
					<Button
						href={burger.url}
						content="View Recipe"
						bg={colors.white}
						text={colors.brand}
						border={colors.brand}
						px-4
						py-2
						text-sm
					/>
				</Div>
			{/each}
		</Div>
	</Div>

	<!-- Pizzas Section -->
	<Div p-6>
		<Text.Small content="**PIZZAS**" text={colors.muted} tracking-widest />

		<Spacer h-4 />

		<Div cols responsive gap-4>
			{#each pizzas as pizza}
				<Div>
					<Img
						src={pizza.imageUrl}
						alt={pizza.name}
						width={280}
						height={180}
					/>
					<Spacer h-3 />
					<Text.H3 content="**{pizza.name}**" text={colors.brand} text-lg />
					<Spacer h-1 />
					<Text.Small content={pizza.description} text={colors.muted} leading-relaxed />
					<Spacer h-3 />
					<Button
						href={pizza.url}
						content="View Recipe"
						bg={colors.white}
						text={colors.brand}
						border={colors.brand}
						px-4
						py-2
						text-sm
					/>
				</Div>
			{/each}
		</Div>
	</Div>

	<!-- Share Items Section -->
	<Div p-6>
		<Text.Small content="**TO SHARE**" text={colors.muted} tracking-widest />

		<Spacer h-4 />

		<Div cols responsive gap-4>
			{#each shareItems as item}
				<Div>
					<Img
						src={item.imageUrl}
						alt={item.name}
						width={280}
						height={180}
					/>
					<Spacer h-3 />
					<Text.H3 content="**{item.name}**" text={colors.brand} text-lg />
					<Spacer h-1 />
					<Text.Small content={item.description} text={colors.muted} leading-relaxed />
					<Spacer h-3 />
					<Button
						href={item.url}
						content="View Recipe"
						bg={colors.white}
						text={colors.brand}
						border={colors.brand}
						px-4
						py-2
						text-sm
					/>
				</Div>
			{/each}
		</Div>
	</Div>

	<!-- Wings Section -->
	<Div p-6>
		<Text.Small content="**WINGS**" text={colors.muted} tracking-widest />

		<Spacer h-4 />

		<Div cols responsive gap-4>
			{#each wings as wing}
				<Div>
					<Img
						src={wing.imageUrl}
						alt={wing.name}
						width={280}
						height={180}
					/>
					<Spacer h-3 />
					<Text.H3 content="**{wing.name}**" text={colors.brand} text-lg />
					<Spacer h-1 />
					<Text.Small content={wing.description} text={colors.muted} leading-relaxed />
					<Spacer h-3 />
					<Button
						href={wing.url}
						content="View Recipe"
						bg={colors.white}
						text={colors.brand}
						border={colors.brand}
						px-4
						py-2
						text-sm
					/>
				</Div>
			{/each}
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Product Feature Section -->
	<Div p-6>
		<Img
			src={productImageUrl}
			alt="Gozney Pizza Dough Mix"
			width={600}
			height={400}
		/>

		<Spacer h-4 />

		<Text.Small content="**GOZNEY CLASSIC PIZZA DOUGH MIX**" text={colors.muted} tracking-widest />

		<Spacer h-2 />

		<Text.H2
			content={productTitle}
			text={colors.brand}
			text-[24px]
			font-bold
		/>

		<Spacer h-4 />

		<Text.Paragraph
			content={productDescription}
			text={colors.text}
			leading-relaxed
		/>

		<Spacer h-6 />

		<Button
			href={productUrl}
			content="Shop Classic Pizza Dough"
			bg={colors.brand}
			text={colors.white}
			px-6
			py-3
			font-semibold
		/>
	</Div>

	<!-- Features Grid -->
	<Div p-6 border-t border={colors.border}>
		<Div cols responsive>
			{#each features as feature}
				<Div align-middle p-3>
					<Div border={colors.brand} w-[40px] h-[40px] align-middle>
						<Text content="[+]" text={colors.brand} text-sm />
					</Div>
					<Spacer h-2 />
					<Text.Small content={feature} text={colors.muted} align-middle />
				</Div>
			{/each}
		</Div>
	</Div>

	<!-- Social Links -->
	<Div bg={colors.brand} p-4 align-middle>
		<Div cols gap-4 align-middle>
			<Link href="https://facebook.com/gozney">
				<Img src="https://fpoimg.com/24x24" alt="Facebook" width={24} height={24} />
			</Link>
			<Link href="https://pinterest.com/gozney">
				<Img src="https://fpoimg.com/24x24" alt="Pinterest" width={24} height={24} />
			</Link>
			<Link href="https://youtube.com/gozney">
				<Img src="https://fpoimg.com/24x24" alt="YouTube" width={24} height={24} />
			</Link>
			<Link href="https://instagram.com/gozney">
				<Img src="https://fpoimg.com/24x24" alt="Instagram" width={24} height={24} />
			</Link>
			<Link href="https://tiktok.com/@gozney">
				<Img src="https://fpoimg.com/24x24" alt="TikTok" width={24} height={24} />
			</Link>
		</Div>
	</Div>

	<!-- Footer -->
	<Div p-6 align-middle>
		<Text.Small
			content="Gozney Inc. 1242 E Wilmington Ave, Salt Lake City, UT 84106"
			text={colors.light}
		/>

		<Spacer h-2 />

		<Text.Small content="No longer want to receive these emails?" text={colors.light} />
		<Unsubscribe
			href="https://gozney.com/unsubscribe"
			content="Unsubscribe"
			text={colors.link}
			text-xs
		/>

		<Spacer h-4 />

		<Div cols gap-2 align-middle>
			<Link href="https://gozney.com/shop">
				<Text.Small content="Shop" text={colors.muted} />
			</Link>
			<Text.Small content="|" text={colors.lighter} />
			<Link href="https://gozney.com/visit">
				<Text.Small content="Visit" text={colors.muted} />
			</Link>
			<Text.Small content="|" text={colors.lighter} />
			<Link href="https://gozney.com/stores">
				<Text.Small content="Shop Local" text={colors.muted} />
			</Link>
			<Text.Small content="|" text={colors.lighter} />
			<Link href="https://gozney.com/contact">
				<Text.Small content="Contact us" text={colors.muted} />
			</Link>
			<Text.Small content="|" text={colors.lighter} />
			<Link href="https://gozney.com/terms">
				<Text.Small content="Terms" text={colors.muted} />
			</Link>
		</Div>
	</Div>
</Email>
