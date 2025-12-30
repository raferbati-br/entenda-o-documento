"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PrimaryButton } from "@/components/PrimaryButton";
import { loadResult, clearResult, AnalysisResult } from "@/lib/resultStore";
import { clearCaptureId } from "@/lib/captureIdStore";

type Card = {
  id: string;
  title: string;
  text: string;
};

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    const res = loadResult();
    if (!res) {
      router.replace("/");
      return;
    }
    setResult(res);
  }, [router]);

  function newDoc() {
    clearResult();
    clearCaptureId();
    router.push("/camera");
  }

  const cardMap = useMemo(() => {
    if (!result?.cards) return {};
    return Object.fromEntries(
      (result.cards as Card[]).map((c) => [c.id, c])
    );
  }, [result]);

  if (!result) return null;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-bold">Explicação do documento</h2>
        <p className="text-slate-700">Em português simples.</p>
        <p className="text-xs text-slate-500">
          Confiança estimada: {(result.confidence * 100).toFixed(0)}%
        </p>
      </header>

      {renderCard(cardMap["whatIs"])}
      {renderCard(cardMap["whatSays"])}
      {renderCard(cardMap["dates"])}
      {renderCard(cardMap["terms"])}
      {renderCard(cardMap["whatUsuallyHappens"])}

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="font-semibold">⚠️ Aviso importante</p>
        <p className="mt-1 text-slate-800">{result.notice}</p>
      </div>

      <p className="text-sm text-slate-600">
        <strong>Aviso importante:</strong> esta ferramenta ajuda a entender documentos.
        Ela não substitui advogado, médico ou servidor público.
      </p>

      <div className="space-y-3">
        <PrimaryButton label="📸 Analisar outro documento" onClick={newDoc} />
        <Link
          className="block text-center text-sm text-emerald-700 underline"
          href="/"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}

function renderCard(card?: { title: string; text: string }) {
  if (!card || !card.text) return null;

  return (
    <section className="rounded-xl border border-slate-200 p-4">
      <h3 className="text-lg font-semibold">{card.title}</h3>
      <p className="mt-2 text-slate-800 whitespace-pre-wrap">{card.text}</p>
    </section>
  );
}
