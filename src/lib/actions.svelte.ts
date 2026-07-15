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

		function cancelPress() {
			if (press) clearTimeout(press);
			press = null;
		}

		function handlePointerDown(event: Event) {
			if (!(event instanceof PointerEvent)) return;
			if (event.button !== 0) return;
			cancelPress();
			press = setTimeout(() => {
				node.dispatchEvent(new CustomEvent('longpress'));
				press = null;
			}, params.duration);
		}

		const removePointerDown = on(node, 'pointerdown', handlePointerDown);
		const removePointerUp = on(node, 'pointerup', cancelPress);
		const removePointerCancel = on(node, 'pointercancel', cancelPress);
		const removePointerLeave = on(node, 'pointerleave', cancelPress);

		return () => {
			cancelPress();
			removePointerDown();
			removePointerUp();
			removePointerCancel();
			removePointerLeave();
		};
	});
};
