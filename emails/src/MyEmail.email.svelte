<script lang='ts'>
	import {
		Email,
		Div,
		Text,
		Img,
		Button,
		Spacer,
		Link,
		Table,
		Br
	} from 'svelte-emails'

	interface Props {
		orderNumber?: string
		itemName?: string
		itemSize?: string
		itemColor?: string
		itemQuantity?: number
		itemPrice?: number
		shippingName?: string
		shippingAddress?: string[]
		billedTo?: string
		dateOrdered?: string
	}

	const {
		orderNumber = 'ORD-7829451',
		itemName = 'Bamboo Lounge Tee',
		itemSize = 'L',
		itemColor = 'Ocean Mist',
		itemQuantity = 2,
		itemPrice = 34.00,
		shippingName = 'Jordan Mitchell',
		shippingAddress = ['742 Maple Avenue', 'Portland, OR 97205', 'US'],
		billedTo = 'Credit Card\n**** **** **** 4821',
		dateOrdered = 'Nov 15, 2025'
	}: Props = $props()

	const itemTotal = itemQuantity * itemPrice
	const shippingCost = 0
	const tax = 0
	const total = itemTotal + shippingCost + tax
</script>

<Email
	preview='Thanks for your order! Order #{orderNumber}'
	body-bg-[#f5f5f5]
	bg-[#ffffff]
>
	<!-- Header with Logo -->
	<Div p-4 align-middle>
		<Text.H2 content="**CozyThreads**" text-[#1a1a1a] />
	</Div>

	<!-- Hero Section - Purple Background -->
	<Div bg-[#6b2cf5] p-8 w-full>
		<Div align-middle py-12>
			<Text.H1 content="Hi [[first_name]]!" text-[#ffffff] text-[48px] break-words />
		</Div>
		<Div justify-left pb-4>
			<Text content="🎉" text-[24px] />
		</Div>
	</Div>

	<!-- Thank You Message -->
	<Div px-6 py-4>
		<Text.Paragraph
			content="Thanks for your order! We'll let you know as soon as your order ships. In the meantime, reach out to our friendly support team with any questions along the way. We're here to help!"
			text-[#333333]
			leading-relaxed
		/>
	</Div>

	<!-- Order Number Header -->
	<Div bg-[#2d2d2d] py-3 px-4 mx-6>
		<Text.H3
			content="**ORDER NUMBER:** {orderNumber}"
			text-[#ffffff]
			text-[12px]
			align-middle
			tracking-wide
		/>
	</Div>

	<!-- Order Details Table -->
	<Div p-6>
		<!-- Desktop: Full table layout -->
		<Div desktop-only>
			<Table cols-[50%_20%_15%_15%] cell-padding-0>
				<!-- Table Header -->
				<Table.Row header pb-2>
					<Text content="Item" text-[#666666] text-[12px] />
					<Text content="Quantity" text-[#666666] text-[12px] align-middle />
					<Text content="Price" text-[#666666] text-[12px] align-middle />
					<Text content="Total" text-[#666666] text-[12px] align-right />
				</Table.Row>

				<!-- Item Row -->
				<Table.Row border-y border-opacity-25 py-2>
					<Div cols>
						<Div w-[50px] bg-[#f5f5f5] align-middle-left>
							<Img src="https://fpoimg.com/50x50" alt={itemName} w-[50px] h-[50px] />
						</Div>
						<Spacer w-3 />
						<Div w-fit align-middle-left>
							<Text content="**{itemName}**" text-[#6b2cf5] text-[14px] />
							<Br />
							<Text.Small content="Size: {itemSize}, Color: {itemColor}" text-[#999999] />
						</Div>
					</Div>
					<Text content={String(itemQuantity)} text-[#333333] align-middle />
					<Text content="${itemPrice.toFixed(2)}" text-[#333333] align-middle />
					<Text content="${itemTotal.toFixed(2)}" text-[#333333] align-right />
				</Table.Row>

				<!-- Totals: Item Total -->
				<Table.Row py-0.5 pt-3>
					<Spacer />
					<Text.Small span-2 content="Item Total:" text-[#666666] align-right />
					<Text.Small content="${itemTotal.toFixed(2)}" text-[#333333] align-right />
				</Table.Row>

				<!-- Totals: Shipping -->
				<Table.Row py-0.5>
					<Spacer />
					<Text.Small span-2 content="Standard Shipping:" text-[#666666] align-right />
					<Text.Small content="FREE" text-[#333333] align-right />
				</Table.Row>

				<!-- Totals: Tax -->
				<Table.Row py-0.5>
					<Spacer span-2 />
					<Text.Small span-2 content="Tax: $0.00" text-[#999999] align-right />
				</Table.Row>

				<!-- Totals: Grand Total -->
				<Table.Row py-0.5>
					<Spacer />
					<Text span-2 content="**TOTAL:**" text-[#333333] text-[12px] font-bold align-right />
					<Text content="**${total.toFixed(2)} USD**" text-[#333333] text-[12px] font-bold align-right />
				</Table.Row>
			</Table>
		</Div>

		<!-- Mobile: Stacked card layout -->
		<Div mobile-only>
			<!-- Item Card -->
			<Div rows border-b border-opacity-25 pb-4>
				<Div cols gap-3>
					<Div w-[50px] bg-[#f5f5f5] align-middle-left>
						<Img src="https://fpoimg.com/50x50" alt={itemName} w-[50px] h-[50px] />
					</Div>
					<Div rows>
						<Text content="**{itemName}**" text-[#6b2cf5] text-[14px] />
						<Text.Small content="Size: {itemSize}, Color: {itemColor}" text-[#999999] />
					</Div>
				</Div>
				<Spacer h-2 />
				<Div cols>
					<Text.Small content="Qty: {itemQuantity} × ${itemPrice.toFixed(2)}" text-[#666666] />
					<Text content="**${itemTotal.toFixed(2)}**" text-[#333333] align-right />
				</Div>
			</Div>

			<!-- Totals -->
			<Div rows pt-3 gap-1>
				<Div cols>
					<Text.Small content="Item Total:" text-[#666666] />
					<Text.Small content="${itemTotal.toFixed(2)}" text-[#333333] align-right />
				</Div>
				<Div cols>
					<Text.Small content="Standard Shipping:" text-[#666666] />
					<Text.Small content="FREE" text-[#333333] align-right />
				</Div>
				<Div cols>
					<Text.Small content="Tax:" text-[#999999] />
					<Text.Small content="$0.00" text-[#999999] align-right />
				</Div>
				<Spacer h-1 />
				<Div cols>
					<Text content="**TOTAL:**" text-[#333333] text-[12px] font-bold />
					<Text content="**${total.toFixed(2)} USD**" text-[#333333] text-[12px] font-bold align-right />
				</Div>
			</Div>
		</Div>
	</Div>

	<!-- Billing and Shipping Info Header -->
	<Div bg-[#2d2d2d] py-3 px-4 mx-6>
		<Text.H3
			content="**BILLING AND SHIPPING INFO**"
			text-[#ffffff]
			text-[12px]
			align-middle
			tracking-wide
		/>
	</Div>

	<!-- Billing and Shipping Details -->
	<Div p-6>
		<!-- Desktop: Three-column table -->
		<Div desktop-only>
			<Table cols-[33%_33%_34%] cell-padding-0>
				<Table.Row header border-b border-opacity-25 pb-2>
					<Text.Small content="**Shipping To**" text-[#333333] />
					<Text.Small content="**Billed To**" text-[#333333] />
					<Text.Small content="**Date Ordered**" text-[#333333] />
				</Table.Row>
				<Table.Row align-top-left pt-2>
					<Div>
						<Text.Small content={shippingName} text-[#666666] />
						{#each shippingAddress as line}
							<Br />
							<Text.Small content={line} text-[#666666] />
						{/each}
					</Div>
					<Text.Small content={billedTo} text-[#666666] />
					<Text.Small content={dateOrdered} text-[#666666] />
				</Table.Row>
			</Table>
		</Div>

		<!-- Mobile: Stacked layout -->
		<Div mobile-only rows gap-4>
			<Div rows>
				<Text.Small content="**Shipping To**" text-[#333333] />
				<Text.Small content={shippingName} text-[#666666] />
				{#each shippingAddress as line}
					<Text.Small content={line} text-[#666666] />
				{/each}
			</Div>
			<Div rows>
				<Text.Small content="**Billed To**" text-[#333333] />
				<Text.Small content={billedTo} text-[#666666] />
			</Div>
			<Div rows>
				<Text.Small content="**Date Ordered**" text-[#333333] />
				<Text.Small content={dateOrdered} text-[#666666] />
			</Div>
		</Div>
	</Div>

	<Spacer h-6 />

	<!-- Visit Account Page Button -->
	<Div align-middle>
		<Button
			href="https://example.com/account"
			content="View Your Order"
			bg-[#1a1a1a]
			text-[#ffffff]
			px-12
			py-4
			font-bold
		/>
	</Div>

	<Spacer h-6 />

	<!-- Color blocks demo -->
	<Div cols responsive>
		<Div align-middle h-48 bg-[#33bf24]><Text content="A" /></Div>
		<Div align-middle h-48 bg-[#247cbf]><Text content="B" /></Div>
	</Div>
	<Div cols responsive>
		<Div align-middle h-48 bg-[#6924bf]><Text content="C" /></Div>
		<Div align-middle h-48 bg-[#bf2469]><Text content="D" /></Div>
	</Div>

	<!-- Community Section -->
	<Div bg-[#2dd4bf] p-10 align-middle>
		<Text.H2 content="*Join Our Community*" text-[#6b2cf5] text-[36px] />
		<Spacer h-6 />
		<Button
			href="https://example.com/social"
			content="Follow Us"
			bg-[#ffcc00]
			text-[#6b2cf5]
			px-10
			py-4
			font-bold
		/>
	</Div>

	<Div p-8 align-middle>
		<Text.H3 content="**Love it or your money back.**" text-[#6b2cf5] text-[28px] leading-snug />
		<Spacer h-6 />
		<Text.Paragraph content="**1.** Try your new gear." text-[#333333] />
		<Text.Paragraph content="**2.** Wear it for 30 days." text-[#333333] />
		<Text.Paragraph content="**3.** Not satisfied? We'll make it right." text-[#333333] />
	</Div>

	<!-- Support Section -->
	<Div bg-[#2dd4bf] p-8 align-middle>
		<Text content="💬" text-[32px] />
		<Spacer h-4 />
		<Text.H3 content="**Need Assistance?**" text-[#6b2cf5] text-[24px] />
		<Spacer h-4 />
		<Text.Paragraph
			content="If you have questions, concerns, or just want to chat, our support team is always around. Visit our Help Center and we'll take care of you."
			text-[#333333]
			leading-relaxed
		/>
		<Spacer h-4 />
		<Text.Paragraph content="Cheers,\nThe CozyThreads Team" text-[#333333] />
	</Div>

	<!-- Footer Stats Section -->
	<Div bg-[#6b2cf5] p-6>
		<Div cols responsive>
			<Div rows align-middle>
				<Text content="👥" text-[24px] />
				<Text content="**500K+**" text-[#ffffff] text-sm font-bold />
				<Text.Small content="Happy Customers" text-[#ccccff] />
			</Div>
			<Div rows align-middle>
				<Text content="📱" text-[24px] />
				<Text content="**Follow Us**" text-[#ffffff] text-sm font-bold />
				<Text.Small content="@cozythreads" text-[#ccccff] />
			</Div>
			<Div rows align-middle>
				<Text content="❓" text-[24px] />
				<Text content="**Questions?**" text-[#ffffff] text-sm font-bold />
				<Text.Small content="Contact Support" text-[#ccccff] />
			</Div>
		</Div>
	</Div>

	<!-- Copyright Footer -->
	<Div p-6 align-middle rows gap-1>
		<Text.Small content="© 2025 CozyThreads Inc. All Rights Reserved." text-[#999999] />
		<Text.Small content="123 Commerce Street, Portland, OR 97201, USA" text-[#999999] />
	</Div>
</Email>
