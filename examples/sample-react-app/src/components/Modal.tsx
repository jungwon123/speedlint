export function Modal({ isOpen }: { isOpen: boolean }) {
	if (!isOpen) return null;
	return <div style={{ position: "fixed", top: 0, left: 0 }}>Modal content</div>;
}
