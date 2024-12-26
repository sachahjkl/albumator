import type { Action } from 'svelte/action';
import { on } from 'svelte/events';

export const clickOutside: Action<
	Element,
	undefined,
	{
		onoutclick: (e: CustomEvent) => void;
	}
> = (node) => {
	$effect(() => {
		const handleClick = (event: Event) => {
			if (!node.contains(<Node>event.target)) {
				node.dispatchEvent(new CustomEvent('outclick'));
			}
		};

		return on(document, 'click', handleClick);
	});
};

export const longPress: Action<
	Element,
	{ duration: number },
	{
		onlongpress: (e: CustomEvent) => void;
	}
> = (node, params = { duration: 500 }) => {
	$effect(() => {
		let press: ReturnType<typeof setTimeout> | null = null;

		function handleMousePress() {
			if (press) clearTimeout(press);
			press = setTimeout(() => {
				node.dispatchEvent(new CustomEvent('longpress'));
			}, params.duration);
		}

		function pointerUpHandler() {
			if (press) clearTimeout(press);
		}

		$effect(() => {
			const removeMouseDownListener = on(node, 'mousedown', handleMousePress);
			const removeMouseUpListener = on(node, 'mouseup', pointerUpHandler);

			return () => {
				if (press) clearTimeout(press);
				removeMouseDownListener();
				removeMouseUpListener();
			};
		});
	});
};
