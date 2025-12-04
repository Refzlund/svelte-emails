<script lang="ts">
	import { page } from '$app/state'
	import { EmailViewer } from '$lib/components'
	import type { PageData } from './$types'

	interface Props {
		data: PageData
	}

	const { data }: Props = $props()

	// Get file ID from shallow routing state or fall back to data/params
	const currentFileId = $derived(
		(page.state as any)?.emailId ?? data.emailId ?? page.params.file
	)
</script>

<EmailViewer mode="documentation" itemId={currentFileId} />
