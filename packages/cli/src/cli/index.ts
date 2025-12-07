// CLI/Plugin exports
export { discoverEmails, type EmailFile } from './discovery.js'
export { emailListPlugin, VIRTUAL_MODULE_ID, VIRTUAL_BUILD_MODE_ID, type EmailListPluginOptions } from './vite-plugin.js'
export { runBuild, type BuildOptions } from './build.js'
export type { SafeEmail } from './types.js'
