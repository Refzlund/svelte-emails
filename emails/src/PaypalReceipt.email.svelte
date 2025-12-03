<script lang='ts'>
	import {
		Email,
		Div,
		Text,
		Table,
		Button,
		Img,
		Spacer,
		Link,
		Divider
	} from 'svelte-emails'

	// PayPal brand colors
	const colors = {
		brand: '#003087',
		link: '#0070ba',
		text: '#333333',
		muted: '#666666',
		light: '#999999',
		lighter: '#cccccc',
		border: '#e5e5e5',
		bg: '#f5f5f0',
		white: '#ffffff'
	}

	// Spacing scale
	const spacing = {
		section: '1.5rem',
		content: '1rem',
		small: '0.5rem'
	}

	interface Props {
		recipientName?: string
		recipientEmail?: string
		transactionId?: string
		transactionDate?: string
		merchantName?: string
		merchantEmail?: string
		invoiceId?: string
		itemDescription?: string
		itemPrice?: number
		subtotal?: number
		total?: number
		fundingSource?: string
		fundingSourceLast4?: string
		instructions?: string
	}

	const {
		recipientName = 'Smiles Davis',
		recipientEmail = 'hello@SmilesDavis.yeah',
		transactionId = '650055065056560',
		transactionDate = 'Oct 18, 2022 08:18:38 PDT',
		merchantName = 'eBay Inc Shipping',
		merchantEmail = 'us-ebay-shiplabels65@ebay.com',
		invoiceId = '506505565',
		itemDescription = '1 eBay Bulk shipping label(s)',
		itemPrice = 6.50,
		subtotal = 6.50,
		total = 6.50,
		fundingSource = 'WELLS FARGO BANK',
		fundingSourceLast4 = '6500',
		instructions = "You haven't entered any instructions."
	}: Props = $props()
</script>

<Email
	preview="You sent a payment of ${total.toFixed(2)} USD to {merchantName}"
	body-bg={colors.bg}
	bg={colors.white}
	max-w-[600px]
>
	<!-- Top greeting bar -->
	<Div bg={colors.bg} p-4>
		<Text content="Hello, {recipientName}" text={colors.text} text-sm />
	</Div>

	<!-- Main content -->
	<Div p-6>
		<!-- PayPal logo -->
		<Div pb-4>
			<Img
				src="https://fpoimg.com/100x40"
				alt="PayPal"
				width={100}
				height={40}
			/>
		</Div>

		<!-- Main heading -->
		<Text.H1
			content="You sent a payment of ${total.toFixed(2)} USD to {merchantName} ({merchantEmail})"
			text={colors.brand}
			text-[28px]
			font-normal
			leading-tight
		/>

		<Spacer h-4 />

		<Text.Paragraph
			content="It may take a few moments for this transaction to appear in your account."
			text={colors.text}
			text-sm
			leading-relaxed
		/>

		<Spacer h-6 />

		<!-- Transaction Info Box -->
		<Div bg={colors.bg} p-6 rounded-lg>
			<Div cols="50% 50%">
				<!-- Left column -->
				<Div>
					<Div rows>
						<Text.Small content="**Transaction ID**" text={colors.text} />
						<Link href="https://example.com/transaction/{transactionId}">
							<Text content={transactionId} text={colors.link} text-sm />
						</Link>
					</Div>

					<Spacer h-4 />

					<Text.Small content="**Merchant**" text={colors.text} />
					<Div rows>
						<Text content={merchantName} text={colors.text} text-sm />
						<Text content={merchantEmail} text={colors.text} text-sm />
					</Div>

					<Spacer h-4 />

					<Div rows>
						<Text.Small content="**Invoice ID**" text={colors.text} />
						<Text content={invoiceId} text={colors.text} text-sm />
					</Div>
				</Div>

				<!-- Right column -->
				<Div>
					<Div rows>
						<Text.Small content="**Transaction date**" text={colors.text} />
						<Text content={transactionDate} text={colors.text} text-sm />
					</Div>

					<Spacer h-4 />

					<Div rows>
						<Text.Small content="**Instructions to merchant**" text={colors.text} />
						<Text content={instructions} text={colors.text} text-sm />
					</Div>
				</Div>
			</Div>
		</Div>

		<Spacer h-6 />

		<!-- Purchase Details Table -->
		<Table cols="60% 15% 25%" cell-padding-0>
			<Table.Row header border-b pb-2>
				<Text.Small content="**Description**" text={colors.text} />
				<Text.Small content="**Unit price**" text={colors.text} align-middle />
				<Text.Small content="**Amount**" text={colors.text} align-right />
			</Table.Row>

			<Table.Row border-b py-3>
				<Text content={itemDescription} text={colors.text} text-sm />
				<Text content="${itemPrice.toFixed(2)} USD" text={colors.text} text-sm align-middle />
				<Text content="${itemPrice.toFixed(2)} USD" text={colors.text} text-sm align-right />
			</Table.Row>

			<Table.Row py-2>
				<Spacer />
				<Text.Small content="**Subtotal**" text={colors.text} align-right />
				<Text.Small content="${subtotal.toFixed(2)} USD" text={colors.text} align-right />
			</Table.Row>

			<Table.Row py-1>
				<Spacer />
				<Text.Small content="**Total**" text={colors.text} align-right />
				<Text.Small content="${total.toFixed(2)} USD" text={colors.text} align-right />
			</Table.Row>

			<Table.Row py-1>
				<Spacer />
				<Text.Small content="**Payment**" text={colors.text} align-right />
				<Text.Small content="${total.toFixed(2)} USD" text={colors.text} align-right />
			</Table.Row>
		</Table>

		<Spacer h-4 />

		<!-- Payment recipient info -->
		<Div align-middle>
			<Text.Small
				content="Payment sent to {merchantEmail}"
				text={colors.muted}
			/>
			<Text.Small
				content="Payment sent from {recipientEmail}"
				text={colors.muted}
			/>
		</Div>

		<Spacer h-6 />

		<!-- Funding Sources -->
		<Text.H3
			content="**Funding Sources Used (Total)**"
			text={colors.text}
			text-sm
			align-middle
		/>

		<Divider border={colors.border} />

		<Div cols="70% 30%" py-2>
			<Text content="{fundingSource} x-{fundingSourceLast4}" text={colors.text} text-sm />
			<Text content="${total.toFixed(2)} USD" text={colors.text} text-sm align-right />
		</Div>

		<Divider border={colors.border} />

		<Spacer h-6 />

		<!-- Issues Section -->
		<Text.H3 content="**Issues with this transaction?**" text={colors.text} text-base />
		<Text.Paragraph
			content="You have 180 days from the date of the transaction to open a dispute in the Resolution Center."
			text={colors.text}
			text-sm
			leading-relaxed
		/>

		<Spacer h-8 />

		<!-- PayPal Logo Footer -->
		<Div align-middle>
			<Img
				src="https://fpoimg.com/120x50"
				alt="PayPal"
				width={120}
				height={50}
			/>
		</Div>

		<Divider border={colors.border} />

		<Spacer h-4 />

		<!-- Footer Links -->
		<Div cols gap-4 align-middle>
			<Link href="https://example.com/help">
				<Text content="Help & Contact" text={colors.link} text-xs />
			</Link>
			<Text content="|" text={colors.lighter} text-xs />
			<Link href="https://example.com/security">
				<Text content="Security" text={colors.link} text-xs />
			</Link>
			<Text content="|" text={colors.lighter} text-xs />
			<Link href="https://example.com/apps">
				<Text content="Apps" text={colors.link} text-xs />
			</Link>
		</Div>

		<Spacer h-4 />

		<!-- Social Icons -->
		<Div cols gap-4 align-middle>
			<Link href="https://twitter.com">
				<Img src="https://fpoimg.com/24x24" alt="Twitter" width={24} height={24} />
			</Link>
			<Link href="https://instagram.com">
				<Img src="https://fpoimg.com/24x24" alt="Instagram" width={24} height={24} />
			</Link>
			<Link href="https://facebook.com">
				<Img src="https://fpoimg.com/24x24" alt="Facebook" width={24} height={24} />
			</Link>
			<Link href="https://linkedin.com">
				<Img src="https://fpoimg.com/24x24" alt="LinkedIn" width={24} height={24} />
			</Link>
		</Div>

		<Spacer h-6 />

		<!-- Security Notice -->
		<Div bg={colors.bg} p-4 rounded>
			<Text.Small
				content="PayPal is committed to preventing fraudulent emails. Emails from PayPal will always contain your full name. [Learn to identify phishing](https://example.com/phishing)"
				text={colors.muted}
			/>
		</Div>

		<Spacer h-4 />

		<!-- Footer Text -->
		<Div align-middle>
			<Text.Small
				content="Please don't reply to this email. To get in touch with us, click [Help & Contact](https://example.com/help)."
				text={colors.muted}
			/>
			<Spacer h-2 />
			<Text.Small content="PayPal Customer Service can be reached at 888-221-1161." text={colors.muted} />
			<Spacer h-2 />
			<Text.Small
				content="Not sure why you received this email? [Learn more](https://example.com/learn)"
				text={colors.muted}
			/>
			<Spacer h-2 />
			<Text.Small
				content="Copyright © 1999-2022 PayPal, Inc. All rights reserved. PayPal is located at 2211 N. First St., San Jose, CA 95131."
				text={colors.light}
			/>
			<Spacer h-2 />
			<Text.Small content="PayPal RT000016:en_US(en-US):1.3.0:896db8d6b5223" text={colors.lighter} text-xs />
		</Div>
	</Div>
</Email>
