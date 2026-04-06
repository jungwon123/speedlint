export function Button({ children }: { children: React.ReactNode }) {
	return (
		<button type="button" style={{ padding: 8, color: "blue" }}>
			{children}
		</button>
	);
}
