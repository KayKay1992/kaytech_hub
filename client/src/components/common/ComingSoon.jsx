// Shared placeholder for site sections that belong to modules not built yet
// (Academy, Hub, Space, Site-Wide Admin content). Replace each page's usage
// of this with real content as that module gets built.
export default function ComingSoon({ title, description }) {
  return (
    <section className="section coming-soon">
      <h1>{title}</h1>
      <p>{description || "This section is coming soon — we're still building it out."}</p>
    </section>
  );
}
