export default function Section({ title, subtitle, children }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold tracking-widest uppercase text-muted-foreground">
          {title}
        </h2>

        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1 leading-snug">
            {subtitle}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {children}
      </div>
    </section>
  );
}