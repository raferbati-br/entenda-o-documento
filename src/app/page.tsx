import Link from "next/link";
import { PrimaryButton } from "@/components/PrimaryButton";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold leading-tight">
          Entenda o papel que chegou na sua casa
        </h1>
        <p className="text-lg text-slate-700">
          Tire uma foto do documento e eu explico em português simples.
        </p>
      </header>

      <Link href="/camera" className="block">
        <PrimaryButton label="Tirar foto do documento" />
      </Link>

      <p className="text-sm text-slate-600">
        <strong>Aviso importante:</strong> esta ferramenta ajuda a entender
        documentos. Ela não substitui advogado, médico ou servidor público.
      </p>
    </div>
  );
}