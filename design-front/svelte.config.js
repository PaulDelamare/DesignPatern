import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const projectRoot = fileURLToPath(new URL('./', import.meta.url));
const resolveSuperforms = (subpath = '') =>
	resolve(projectRoot, 'node_modules/sveltekit-superforms/dist', subpath);

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		alias: {
			'sveltekit-superforms': resolveSuperforms()
		}
	}
};

export default config;
