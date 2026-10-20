import Link from "next/link";

// Assinatura textual provisória: ¿ e ? em café.
export function Marca() {
  return (
    <p className="marca">
      <Link href="/">
        <b>¿</b>Merece Meu Voto<b>?</b>
      </Link>
    </p>
  );
}
