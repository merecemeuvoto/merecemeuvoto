import Link from "next/link";
import { Marca } from "@/components/Marca";

export default function NaoEncontrada() {
  return (
    <main>
      <Marca />
      <h1>
        Essa página <span>não existe.</span>
      </h1>
      <p>
        Pode ter mudado de lugar ou o endereço veio errado. <Link href="/">Voltar ao início</Link>.
      </p>
    </main>
  );
}
