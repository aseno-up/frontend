import {
  siWhatsapp,
  siGooglecalendar,
  siGooglemeet,
  siInstagram,
  siPix,
  siElevenlabs,
  siGooglegemini,
  siClaude,
  siOpenrouter,
  siBrevo,
  siGoogle,
  siAnthropic,
} from 'simple-icons'

interface IntegrationLogosProps {
  label?: string
}

// Each entry is either:
//   - 'si': simple-icons brand mark (CC0 community lib)
//   - 'file': SVG file in /public/logos/. Ships with letter-mark placeholders;
//     drop the official brand-kit SVG with the same filename to swap.
//   - 'mark': inline letter-mark fallback (no asset, no library)
type SiBrand = { path: string; hex: string }
type Item =
  | { kind: 'si'; name: string; icon: SiBrand; bg?: string }
  | { kind: 'file'; name: string; src: string }
  | { kind: 'mark'; name: string; color: string; letter: string }

const ITEMS: Item[] = [
  { kind: 'si', name: 'WhatsApp',                icon: siWhatsapp,        bg: '#25D366' },
  { kind: 'si', name: 'Google Calendar',         icon: siGooglecalendar },
  { kind: 'si', name: 'Google Meet',             icon: siGooglemeet },
  { kind: 'si', name: 'Instagram (Agendamento)', icon: siInstagram },
  { kind: 'si', name: 'PIX',                     icon: siPix },
  { kind: 'file', name: 'Mercado Pago',          src: '/logos/mercado-pago.jpeg' },
  { kind: 'file', name: 'Asaas',                 src: '/logos/asaas.png' },
  { kind: 'file', name: 'Evolution API',         src: '/logos/evolution.png' },
  { kind: 'file', name: 'Gupshup',               src: '/logos/gupshup.png' },
  { kind: 'si', name: 'ElevenLabs',              icon: siElevenlabs,      bg: '#000000' },
  { kind: 'file', name: 'ChatGPT',               src: '/logos/chatgpt.png' },
  { kind: 'si', name: 'Gemini',                  icon: siGooglegemini },
  { kind: 'si', name: 'Claude',                  icon: siClaude },
  { kind: 'si', name: 'Anthropic',               icon: siAnthropic },
  { kind: 'si', name: 'OpenRouter',              icon: siOpenrouter },
  { kind: 'si', name: 'Brevo',                   icon: siBrevo },
  { kind: 'si', name: 'Google Login',            icon: siGoogle,          bg: '#ffffff' },
]

function SiLogo({ icon, bg }: { icon: SiBrand; bg?: string }) {
  // simple-icons paths render at viewBox 0 0 24 24. We wrap in a rounded
  // square chip so multicolor PNG-style logos (e.g., Calendar) and monochrome
  // silhouette ones share the same visual weight in the row.
  const useChip = !!bg
  const fillColor = bg && bg !== '#ffffff' ? '#ffffff' : `#${icon.hex}`
  const border = bg === '#ffffff' ? '#dadce0' : 'transparent'
  return (
    <svg width="32" height="32" viewBox="0 0 36 36" aria-hidden="true">
      {useChip && (
        <rect width="36" height="36" rx="9" fill={bg} stroke={border} strokeWidth={bg === '#ffffff' ? 1 : 0} />
      )}
      <g transform={useChip ? 'translate(6 6) scale(1)' : 'translate(6 6) scale(1)'}>
        <path d={icon.path} fill={useChip ? fillColor : `#${icon.hex}`} />
      </g>
    </svg>
  )
}

function LetterMark({ color, letter }: { color: string; letter: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 36 36" aria-hidden="true">
      <rect width="36" height="36" rx="9" fill={color} />
      <text
        x="18"
        y="24"
        textAnchor="middle"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="800"
        fontSize="18"
        fill="#ffffff"
        letterSpacing="-0.5"
      >
        {letter}
      </text>
    </svg>
  )
}

export function IntegrationLogos({
  label = 'Conectado às ferramentas que sua clínica já usa',
}: IntegrationLogosProps) {
  const Row = () => (
    <>
      {ITEMS.map((item) => (
        <div className="ic-item" key={item.name}>
          {item.kind === 'si' && <SiLogo icon={item.icon} bg={item.bg} />}
          {item.kind === 'file' && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.src} alt={item.name} className="ic-item-img" />
          )}
          {item.kind === 'mark' && <LetterMark color={item.color} letter={item.letter} />}
          <span>{item.name}</span>
        </div>
      ))}
    </>
  )

  return (
    <section className="ic-band" aria-label="Integrações">
      <p className="ic-eyebrow">{label}</p>
      <div className="ic-marquee">
        <div className="ic-track">
          <Row />
          <Row />
        </div>
      </div>
    </section>
  )
}
