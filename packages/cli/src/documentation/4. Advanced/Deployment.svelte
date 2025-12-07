<script lang="ts">
	/**
	 * Building & Deployment
	 * 
	 * Build static preview sites and deploy to hosting providers.
	 */
	import {
		Email,
		Div,
		Text,
		Button,
		Divider,
		Table
	} from 'svelte-emails'
	import { colors, style } from '../theme'
	import { footer } from '../Shared/Footer.svelte'
	import { callout } from '../Shared/Callout.svelte'

	const basicBuildCode = `# Build to default ./build folder
bunx svelte-emails build

# Build with custom output directory
bunx svelte-emails build --out ./preview

# Build from a specific source folder
bunx svelte-emails build --cwd ./emails --out ./dist

# Build with base path for subdirectory hosting
bunx svelte-emails build --base /emails --out ./dist`

	const previewCode = `# Preview the default ./build folder
bunx svelte-emails preview

# Preview a specific directory
bunx svelte-emails preview ./dist

# Preview with custom port and open browser
bunx svelte-emails preview --port 3000 --open

# Full workflow: build and preview
bunx svelte-emails build --out ./dist
bunx svelte-emails preview ./dist`

	const vercelCode = `# Install Vercel CLI
npm install -g vercel

# Build and deploy
bunx svelte-emails build --out ./dist
cd dist && vercel --prod`

	const vercelJsonCode = `{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}`

	const netlifyCode = `# Build the static site
bunx svelte-emails build --out ./dist

# Deploy via Netlify CLI
npm install -g netlify-cli
netlify deploy --prod --dir=dist`

	const netlifyTomlCode = `[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200`

	const netlifyRedirectsCode = `/*  /index.html  200`

	const cloudflareCode = `# Build the static site
bunx svelte-emails build --out ./dist

# Deploy via Wrangler
npm install -g wrangler
wrangler pages deploy dist --project-name=email-previews`

	const cloudflareRedirectsCode = `/* /index.html 200`

	const githubActionsCode = `name: Deploy Email Previews
on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bunx svelte-emails build --out ./dist --base /repo-name
      # Create 404.html for SPA client-side routing
      - run: cp ./dist/index.html ./dist/404.html
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/deploy-pages@v4`

	const nginxCode = `server {
    listen 80;
    server_name emails.example.com;
    root /var/www/email-previews;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}`

	const dockerfileCode = `FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install -g bun
RUN bun install
RUN bunx svelte-emails build --out ./dist

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80`

	const outputStructureCode = `dist/
├── index.html          # SPA entry point
├── _app/               # App assets (JS, CSS)
└── _data/
    ├── email-list.json # All email metadata
    └── emails/         # Pre-rendered content
        ├── my-email.json
        └── newsletter.json`

	const awsDeployCode = `# Build
bunx svelte-emails build --out ./dist

# Sync to S3
aws s3 sync dist s3://your-bucket-name --delete

# Invalidate CloudFront cache (optional)
aws cloudfront create-invalidation \\
  --distribution-id YOUR_DIST_ID \\
  --paths "/*"`

	const gitHubPagesKeyNotes = `• **Base Path:** Replace \`/repo-name\` with your actual repository name for project pages
• **404.html:** The \`cp\` step creates a fallback for SPA client-side routing
• **Permissions:** The \`pages: write\` and \`id-token: write\` permissions are required for the official deploy action`

	const awsRoutingNotes = `1. Go to CloudFront → Distribution → Error Pages
2. Create custom error response for **403** and **404** errors
3. Set **Response page path** to \`/index.html\`
4. Set **HTTP Response Code** to \`200\``

</script>

<Email
	order=3
	category='4. Advanced'
	preview="Build and deploy email preview sites"
	body-bg={colors.background}
	bg={colors.white}
	max-w-[700px]
>
	<!-- Header -->
	<Div rows gap-2 p-8 bg={colors.primary}>
		<Text.H1 content="🚀 Building & Deployment" text={colors.white} text-3xl font-bold />
		<Text content="Build static preview sites for your team." text={colors.white} text-opacity-90 text-lg />
	</Div>

	<!-- Overview -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Overview" text={colors.text} />
		<Text.Paragraph content="The `build` command generates a static HTML site with all your email previews pre-rendered. Perfect for sharing with your team, clients, or stakeholders without running a dev server." text={colors.textMuted} />
		<Text.Codeblock content={basicBuildCode} highlight="bash" />
	</Div>

	<Divider border={colors.border} />

	<!-- CLI Options -->
	<Div rows gap-4 p-8>
		<Text.H2 content="CLI Options" text={colors.text} />
		
		<Table cols="25% 75%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Option" font-bold />
				<Text content="Description" font-bold />
			</Table.Row>
			<Table.Row>
				<Text.Code content="--cwd" />
				<Text content="Directory containing `*.email.svelte` files (default: current directory)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="--out" />
				<Text content="Output directory for the build (default: `./build`)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="--base" />
				<Text content="Base path for subdirectory hosting (e.g., `/emails` for `example.com/emails`)" />
			</Table.Row>
		</Table>
	</Div>

	<Divider border={colors.border} />

	<!-- Output Structure -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Output Structure" text={colors.text} />
		<Text.Paragraph content="The build generates a self-contained static site:" text={colors.textMuted} />
		<Text.Codeblock content={outputStructureCode} highlight="plaintext" />
	</Div>

	<Divider border={colors.border} />

	<!-- Preview Locally -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Preview Locally" text={colors.text} />
		<Text.Paragraph content="Before deploying, test your build locally using the `preview` command. This serves your static site on a local server so you can verify everything works correctly." text={colors.textMuted} />
		<Text.Codeblock content={previewCode} highlight="bash" />
		
		<Table cols="25% 75%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Option" font-bold />
				<Text content="Description" font-bold />
			</Table.Row>
			<Table.Row>
				<Text.Code content="[dir]" />
				<Text content="Directory to serve (positional argument, default: `./build`)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="--dir, -d" />
				<Text content="Directory to serve (alternative to positional argument)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="--port, -p" />
				<Text content="Port number (default: `4173`)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="--open, -o" />
				<Text content="Open browser automatically" />
			</Table.Row>
		</Table>
	</Div>

	<Divider border={colors.border} />

	<!-- Vercel -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Deploy to Vercel" text={colors.text} />
		<Text.Paragraph content="Vercel offers the easiest deployment experience with automatic HTTPS and global CDN." text={colors.textMuted} />
		
		<Div rows gap-2>
			<Text.H4 content="Option 1: CLI Deployment" text={colors.text} />
			<Text.Codeblock content={vercelCode} highlight="bash" />
		</Div>
		
		<Div rows gap-2>
			<Text.H4 content="Option 2: Git Integration" text={colors.text} />
			<Text
				content={`
					1. Push your project to GitHub/GitLab/Bitbucket
					2. Import the project in Vercel Dashboard
					3. Set **Build Command**: \`bunx svelte-emails build --out ./dist\`
					4. Set **Output Directory**: \`dist\`
					5. Deploy!
				`}
				text={colors.textMuted}
/>
		</Div>
		
		<Div rows gap-2>
			<Text.H4 content="SPA Routing (vercel.json)" text={colors.text} />
			<Text.Codeblock content={vercelJsonCode} highlight="json" />
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Netlify -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Deploy to Netlify" text={colors.text} />
		<Text.Paragraph content="Netlify provides simple static hosting with automatic deploys from Git." text={colors.textMuted} />
		
		<Div rows gap-2>
			<Text.H4 content="CLI Deployment" text={colors.text} />
			<Text.Codeblock content={netlifyCode} highlight="bash" />
		</Div>
		
		<Div rows gap-2>
			<Text.H4 content="SPA Routing" text={colors.text} />
			<Text.Paragraph content="Option 1: Create a `_redirects` file in your `static/` folder:" text={colors.textMuted} />
			<Text.Codeblock content={netlifyRedirectsCode} highlight="plaintext" />
		</Div>
		
		<Div rows gap-2>
			<Text.Paragraph content="Option 2: Use `netlify.toml` in project root:" text={colors.textMuted} />
			<Text.Codeblock content={netlifyTomlCode} highlight="toml" />
		</Div>
		
		<Text.Small content="**Tip:** You can also drag-and-drop the `dist` folder directly to [Netlify Drop](https://app.netlify.com/drop)." text={colors.textMuted} />
	</Div>

	<Divider border={colors.border} />

	<!-- Cloudflare Pages -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Deploy to Cloudflare Pages" text={colors.text} />
		<Text.Paragraph content="Cloudflare Pages offers fast edge deployment with generous free tier." text={colors.textMuted} />
		
		<Div rows gap-2>
			<Text.H4 content="CLI Deployment" text={colors.text} />
			<Text.Codeblock content={cloudflareCode} highlight="bash" />
		</Div>
		
		<Div rows gap-2>
			<Text.H4 content="SPA Routing (_redirects)" text={colors.text} />
			<Text.Paragraph content="Create a `_redirects` file in your `static/` or `public/` folder (it will be copied to the build output):" text={colors.textMuted} />
			<Text.Codeblock content={cloudflareRedirectsCode} highlight="plaintext" />
			<Text.Small content="This rewrite (status 200) serves `index.html` for all routes while keeping the URL unchanged in the browser." text={colors.textMuted} />
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- GitHub Pages -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Deploy to GitHub Pages" text={colors.text} />
		<Text.Paragraph content="Free hosting for public repositories with GitHub Actions automation." text={colors.textMuted} />

		{@render callout('important', 'Before deploying, enable GitHub Pages in your repository settings (`Settings → Pages → Source → GitHub Actions`).')}
		
		<Div rows gap-2>
			<Text.H4 content="GitHub Actions Workflow" text={colors.text} />
			<Text.Paragraph content="Create `.github/workflows/deploy.yml`:" text={colors.textMuted} />
			<Text.Codeblock content={githubActionsCode} highlight="yaml" />
		</Div>
		
		<Div rows gap-2>
			<Text.H4 content="Key Configuration Notes" text={colors.text} />
			<Text content={gitHubPagesKeyNotes} text={colors.textMuted} />
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- AWS/S3 -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Deploy to AWS S3 + CloudFront" text={colors.text} />
		<Text.Paragraph content="For enterprise deployments with full control over infrastructure." text={colors.textMuted} />
		
		<Text.Codeblock content={awsDeployCode} highlight="bash" />
		
		<Div rows gap-2>
			<Text.H4 content="SPA Routing with CloudFront" text={colors.text} />
			<Text.Paragraph content="Configure a custom error response in CloudFront to handle SPA routing:" text={colors.textMuted} />
			<Text content={awsRoutingNotes} text={colors.textMuted} />
			<Text.Small content="This tells CloudFront to serve `index.html` for missing routes, allowing the SPA router to handle navigation." text={colors.textMuted} />
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Self-Hosted -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Self-Hosted (nginx/Docker)" text={colors.text} />
		<Text.Paragraph content="For internal deployments behind a firewall or VPN." text={colors.textMuted} />
		
		<Div rows gap-2>
			<Text.H4 content="nginx Configuration" text={colors.text} />
			<Text.Codeblock content={nginxCode} highlight="nginx" />
		</Div>
		
		<Div rows gap-2>
			<Text.H4 content="Dockerfile" text={colors.text} />
			<Text.Codeblock content={dockerfileCode} highlight="dockerfile" />
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Limitations -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Static Build Limitations" text={colors.text} />
		
		<Table cols="30% 70%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Limitation" font-bold />
				<Text content="Details" font-bold />
			</Table.Row>
			<Table.Row>
				<Text content="No Live Reload" />
				<Text content="Changes require a rebuild. Use `bunx svelte-emails` for development." />
			</Table.Row>
			<Table.Row>
				<Text content="Image CORS" />
				<Text content="External images aren't proxied. They must allow cross-origin requests or may show broken." />
			</Table.Row>
			<Table.Row>
				<Text content="Frozen Content" />
				<Text content="Email list and rendered HTML are captured at build time." />
			</Table.Row>
			<Table.Row>
				<Text content="SPA Routing" />
				<Text content="Requires server configuration to redirect all routes to `index.html`." />
			</Table.Row>
		</Table>
	</Div>

	<!-- Footer -->
	{@render footer()}
</Email>
