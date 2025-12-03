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

	// Google brand colors
	const colors = {
		text: '#202124',
		muted: '#5f6368',
		link: '#1a73e8',
		success: '#137333',
		warning: '#ea8600',
		border: '#e0e0e0',
		bg: '#e8f0fe',
		bgLight: '#e6f4ea',
		bgWarning: '#fef7e0',
		white: '#ffffff',
		green: '#34a853',
		yellow: '#fbbc04',
		red: '#ea4335'
	}

	// Spacing scale
	const spacing = {
		section: '1.5rem',
		content: '1rem',
		small: '0.5rem'
	}

	interface Flight {
		departureDate: string
		returnDate: string
		price: number
		savings?: number
		airline: string
		stops: string
		route: string
		duration: string
		isNonstop?: boolean
		isCheapest?: boolean
	}

	interface Props {
		origin?: string
		destination?: string
		tripType?: string
		adults?: number
		class?: string
		priceUpdatedAt?: string
		flights?: Flight[]
		lowPrice?: number
		typicalLow?: number
		typicalHigh?: number
	}

	const {
		origin = 'Nashville',
		destination = 'London',
		tripType = 'Round trip',
		adults = 1,
		class: flightClass = 'Economy',
		priceUpdatedAt = 'November 14, 2024 at 05:10 GMT',
		flights = [
			{
				departureDate: 'Mon, Feb 3',
				returnDate: 'Wed, Feb 12',
				price: 634,
				airline: 'British Airways',
				stops: 'Nonstop',
				route: 'BNA–LHR',
				duration: '8 hr',
				isNonstop: true
			},
			{
				departureDate: 'Thu, Feb 6',
				returnDate: 'Thu, Feb 13',
				price: 522,
				savings: 15,
				airline: 'JetBlue',
				stops: '1 stop',
				route: 'BNA–LHR',
				duration: '18 hr',
				isCheapest: true
			},
			{
				departureDate: 'Mon, Feb 3',
				returnDate: 'Mon, Feb 10',
				price: 537,
				savings: 12,
				airline: 'Spirit, Norse Atlantic Airways',
				stops: '1 stop',
				route: 'BNA–LGW',
				duration: '22 hr'
			},
			{
				departureDate: 'Mon, Feb 17',
				returnDate: 'Wed, Feb 26',
				price: 618,
				airline: 'American, British Airways',
				stops: '1 stop',
				route: 'BNA–LGW',
				duration: '19 hr'
			}
		],
		lowPrice = 522,
		typicalLow = 530,
		typicalHigh = 790
	}: Props = $props()
</script>

<Email
	preview="Great flight prices from {origin} to {destination} starting at ${lowPrice}"
	body-bg={colors.white}
	bg={colors.white}
	max-w-[600px]
>
	<!-- Google Flights Header -->
	<Div p-4 align-middle border-b border={colors.border}>
		<Img
			src="https://fpoimg.com/180x40"
			alt="Google Flights"
			width={180}
			height={40}
		/>
	</Div>

	<!-- Main Content -->
	<Div p-6 border={colors.border} m-4 rounded-lg>
		<!-- Greeting -->
		<Text.H2 content="Hello," text={colors.text} text-[24px] font-normal />

		<Spacer h-4 />

		<Text.Paragraph
			content="We've found some great prices for 1-week trips in February, from {origin} to {destination}."
			text={colors.muted}
			text-base
			leading-relaxed
		/>

		<Spacer h-6 />

		<!-- Trip Details Header -->
		<Text.H3 content="1-week trips in February" text={colors.text} text-[20px] font-medium />
		<Text.Small content="6–9 days · {tripType} · {adults} adult · {flightClass}" text={colors.muted} />

		<Spacer h-6 />

		<!-- Flight Listings -->
		{#each flights as flight, index}
			{#if flight.isNonstop}
				<!-- Nonstop Badge -->
				<Div cols gap-2 align-left>
					<Div
						bg={colors.bg}
						px-2
						py-1
						rounded-full
					>
						<Text.Small content="◉" text={colors.link} />
					</Div>
					<Text content="**Nonstop**" text={colors.text} text-sm font-medium />
				</Div>
				<Spacer h-2 />
			{/if}

			{#if flight.isCheapest}
				<!-- Cheapest Badge -->
				<Div cols gap-2 align-left>
					<Div
						bg={colors.bgWarning}
						px-2
						py-1
						rounded-full
					>
						<Text.Small content="◉" text={colors.warning} />
					</Div>
					<Text content="**Cheapest**" text={colors.text} text-sm font-medium />
				</Div>
				<Spacer h-2 />
			{/if}

			<Div cols="70% 30%" py-3 border-b border={colors.border}>
				<Div>
					<Text content="**{flight.departureDate} – {flight.returnDate}**" text={colors.text} text-base />

					<Spacer h-1 />

					<Div cols gap-2>
						{#if flight.savings}
							<Div bg={colors.bgLight} px-2 py-0.5 rounded>
								<Text.Small content="**SAVE {flight.savings}%**" text={colors.success} />
							</Div>
						{/if}
						<Text content="From ${flight.price}" text={colors.success} text-sm font-medium />
					</Div>

					<Spacer h-2 />

					<Text.Small
						content="{flight.airline} · {flight.stops} · {flight.route} · {flight.duration}"
						text={colors.muted}
					/>
				</Div>

				<Div align-middle-right>
					<Button
						href="https://flights.google.com"
						content="View"
						bg={colors.white}
						text={colors.link}
						border
						border-[#dadce0]
						px-4
						py-2
						rounded
						font-medium
					/>
				</Div>
			</Div>
		{/each}

		<Spacer h-8 />

		<!-- Price Insight Section -->
		<Text.H3 content="Prices are currently (#137333)low(/) for February" text={colors.text} text-[18px] />

		<Spacer h-4 />

		<!-- Price Range Visualization -->
		<Div bg={colors.bg} p-3 rounded-lg w-fit>
			<Text.Small content="**${lowPrice} is low**" text={colors.link} />
		</Div>

		<Spacer h-2 />

		<!-- Price Bar (simplified visual) -->
		<Div cols="30% 40% 30%" h-2>
			<Div bg={colors.green} h-2 rounded-l />
			<Div bg={colors.yellow} h-2 />
			<Div bg={colors.red} h-2 rounded-r />
		</Div>

		<Spacer h-1 />

		<Div cols="50% 50%">
			<Text.Small content="${typicalLow}" text={colors.muted} />
			<Text.Small content="${typicalHigh}" text={colors.muted} align-right />
		</Div>

		<Spacer h-4 />

		<Text.Paragraph
			content="Prices are cheaper than usual. The least expensive flights for similar trips to London usually cost between ${typicalLow}–{typicalHigh}. Anything less is considered a deal."
			text={colors.muted}
			text-sm
			leading-relaxed
		/>

		<Spacer h-6 />

		<!-- View More Link -->
		<Div align-middle>
			<Link href="https://flights.google.com">
				<Text content="View more flights" text={colors.link} font-medium />
			</Link>
		</Div>

		<Divider border={colors.border} />

		<Spacer h-4 />

		<!-- Feedback Section -->
		<Div cols="70% 30%" align-middle>
			<Text content="Did you find this email useful?" text={colors.muted} text-sm />
			<Div cols gap-4>
				<Link href="https://flights.google.com/feedback/yes">
					<Text content="👍" text-[24px] />
				</Link>
				<Link href="https://flights.google.com/feedback/no">
					<Text content="👎" text-[24px] />
				</Link>
			</Div>
		</Div>

		<Divider border={colors.border} />

		<Spacer h-4 />

		<!-- Disclaimer -->
		<Text.Small
			content="All savings and insights are based on fares observed in the last 12 months for trips in the same season, of similar length, with the same origin and destination, number of stops, class and airline."
			text={colors.muted}
			leading-relaxed
		/>
	</Div>

	<!-- Footer Section -->
	<Div p-6 align-middle>
		<Text.Small
			content="Prices updated {priceUpdatedAt}"
			text={colors.muted}
		/>

		<Spacer h-4 />

		<Text.Small
			content="You received this email because you signed up to receive travel tips and price updates from Google Flights."
			text={colors.muted}
			align-middle
		/>

		<Spacer h-4 />

		<Link href="https://flights.google.com/settings">
			<Text.Small content="Manage price tracking" text={colors.link} />
		</Link>

		<Br />

		<Unsubscribe
			href="https://flights.google.com/unsubscribe"
			content="Unsubscribe"
			text={colors.link}
			text-xs
		/>

		<Divider border={colors.border} />

		<Spacer h-4 />

		<!-- Google Footer -->
		<Img
			src="https://fpoimg.com/80x28"
			alt="Google"
			width={80}
			height={28}
		/>

		<Spacer h-2 />

		<Text.Small content="Google LLC" text={colors.muted} />
		<Text.Small content="1600 Amphitheatre Parkway," text={colors.muted} />
		<Text.Small content="Mountain View, CA 94043" text={colors.muted} />
	</Div>
</Email>
