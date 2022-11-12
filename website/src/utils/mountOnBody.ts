
function mount(node: HTMLElement) {
	const host = document.body;
	host.insertBefore(node, null);
	return () => host.contains(node) && host.removeChild(node);
}
export function mountOnBody(node: HTMLElement) {
	let destroy: () => void;
	destroy = mount(node);
	return { destroy: () => destroy?.() };
}
