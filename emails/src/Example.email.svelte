<script lang='ts'>

	import { Email, Div, Text } from 'svelte-emails'
	
</script>

<Email preview="Welcome!" body-bg-[#ebebeb] bg-[#ffffff]>
  <Div p-6 bg-[#ffffff]>
    <Text.H1 content="Hello World" />
    <Text content="This is my first email." />
  </Div>
</Email>