import { PluginOptions } from '@sveltejs/vite-plugin-svelte';
import aspectRatio from '@tailwindcss/aspect-ratio';
import containerQueries from '@tailwindcss/container-queries';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';
import { PluginCreator, PluginsConfig } from 'tailwindcss/types/config';

const appPlugin: PluginCreator = ({ addComponents, theme }) =>
	addComponents({
		'.fat-shadow': {
			boxShadow: '2px 2px rgb(0 0 0 / 30%)'
		}
	});

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {}
	},

	plugins: [typography, forms, aspectRatio, containerQueries, appPlugin]
} as Config;
