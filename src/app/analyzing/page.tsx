"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadCaptureId } from "@/lib/captureIdStore";
import { saveResult } from "@/lib/resultStore";

export default function AnalyzingPage() {
  const router = useRouter();
  const ran = useRef(false); // ✅ evita execução dupla em dev (Strict Mode)
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function analyze() {
      const captureId = loadCaptureId();
      if (!captureId) {
        router.replace("/");
        return;
      }

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ captureId }),
        });

        const data = await res.json();

        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || "Erro desconhecido");
        }

        saveResult(data.result);
        router.replace("/result");
      } catch (e: any) {
        setError(e?.message || "Erro ao analisar documento");
      }
    }

    analyze();
  }, [router]);

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Não foi possível analisar</h2>
        <p className="text-slate-700 whitespace-pre-wrap">{error}</p>
        <p className="text-sm text-slate-600">
          Tente novamente. Se o erro continuar, envie uma foto mais próxima e com boa iluminação.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Analisando…</h2>
      <p className="text-slate-700">
        Estou lendo o documento e preparando a explicação.
      </p>
      <div className="rounded-xl border border-slate-200 p-4 text-slate-700">
        ⏳ Isso pode levar alguns segundos.
      </div>
    </div>
  );
}
