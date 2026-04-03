export function Card({ title, image }: { title: string; image: string }) {
  return (
    <div style={{ border: "1px solid #ccc", padding: 16 }}>
      <img src={image} alt={title} />
      <h3>{title}</h3>
    </div>
  );
}
