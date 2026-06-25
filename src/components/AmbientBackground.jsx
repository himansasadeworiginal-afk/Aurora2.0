// Ambient page backdrop: floating particles + drifting glow orbs.
// Purely decorative; pulled out of App.jsx so the shell stays readable.
export default function AmbientBackground() {
  return (
    <>
      <div className="particle-layer" aria-hidden="true">
        {Array.from({ length: 15 }).map((_, i) => (
          <div className="p" key={i} />
        ))}
      </div>
      <div className="glow-orb glow-orb-1" aria-hidden="true" />
      <div className="glow-orb glow-orb-2" aria-hidden="true" />
      <div className="glow-orb glow-orb-3" aria-hidden="true" />
    </>
  )
}
