import aspectRatio from '@tailwindcss/aspect-ratio';
import containerQueries from '@tailwindcss/container-queries';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';
import { PluginCreator } from 'tailwindcss/types/config';

const appPlugin: PluginCreator = ({ addComponents }) =>
	addComponents({
		'.fat-shadow': {
			boxShadow: '2px 2px rgb(0 0 0 / 30%)'
		}
	});

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	corePlugins: {
		aspectRatio: false // https://github.com/tailwindlabs/tailwindcss-aspect-ratio?tab=readme-ov-file#installation
	},

	theme: {
		extend: {
			gridTemplateColumns: {
				imageGrid: 'repeat(auto-fill, minmax(max(50px, var(--image-size)), 1fr))'
			}
		}
	},

	plugins: [typography, forms, aspectRatio, containerQueries, appPlugin]
} as Config;
