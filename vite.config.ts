import adapter from '@sveltejs/adapter-node';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			adapter: adapter(),
			csp: {
				directives: {
					'base-uri': ['self'],
					'default-src': ['self'],
					'frame-ancestors': ['none'],
					'img-src': ['self', 'data:', 'blob:'],
					'object-src': ['none'],
					'script-src': ['self'],
					'style-src': ['self', 'unsafe-inline']
				}
			}
		})
	]
});
