// Marca de xícara, decorativa: escondida de leitores de tela.
export function Anel() {
  return (
    <svg className="anel" viewBox="0 0 300 300" aria-hidden="true" focusable="false">
      <circle
        cx="150"
        cy="150"
        r="128"
        fill="none"
        stroke="#8A4B1F"
        strokeWidth="11"
        strokeLinecap="round"
        strokeDasharray="770 40"
        transform="rotate(100 150 150)"
      />
      <circle
        cx="151"
        cy="151"
        r="128"
        fill="none"
        stroke="#8A4B1F"
        strokeWidth="6"
        strokeDasharray="560 250"
        transform="rotate(140 151 151)"
      />
    </svg>
  );
}
