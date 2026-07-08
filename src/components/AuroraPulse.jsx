import './AuroraPulse.css'

/**
 * AuroraPulse — the shared visual language for Aurora's AI ("superbrain").
 *
 * A slow-drifting aurora-gradient orb used to mark AI-authored / AI-thinking
 * moments (Daily Brief generating, person detection, Desmond listening, …).
 * Purely decorative, so it's `aria-hidden`.
 *
 * Props:
 *   size     number|string  diameter in px (number) or any CSS length. Default 48.
 *   active   boolean        when true, the aurora drifts + breathes; when false
 *                           it sits as a still gradient. Default true.
 *   variant  'orb'|'ribbon' 'orb' is a circle, 'ribbon' is a rounded bar. Default 'orb'.
 *   className string        extra classes to compose with.
 *
 * Motion respects prefers-reduced-motion (handled in CSS).
 */
export default function AuroraPulse({
  size = 48,
  active = true,
  variant = 'orb',
  className = '',
}) {
  const dim = typeof size === 'number' ? `${size}px` : size
  const classes = [
    'aurora-pulse',
    `aurora-pulse--${variant}`,
    active ? 'is-active' : 'is-idle',
    className,
  ].filter(Boolean).join(' ')

  return <span className={classes} style={{ '--ap-size': dim }} aria-hidden="true" />
}
