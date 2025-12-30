"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SecondaryButton } from "@/components/SecondaryButton";
import { saveCaptureId } from "@/lib/captureIdStore";

// IMPORTANTE: agora usamos o preview base64 que vem pela URL (não armazenamos grande)
// Vamos receber a imagem da página /camera via querystring? NÃO.
// Então vamos manter o preview local: para isso, vamos ler a última imagem escolhida
// diretamente do input na /camera e passar como sessionStorage (apenas preview JPEG pequeno).
// MAS como você já tem preview na /camera, a forma mais rápida é:
import { loadCapture, clearCapture } from "@/lib/captureStore"; // se você ainda tiver esse arquivo com Blob

export default function ConfirmPage() {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;

    (async () => {
      const payload = await loadCapture();
      if (!payload?.blob) {
        router.replace("/camera");
        return;
      }
      objectUrl = URL.createObjectURL(payload.blob);
      setPreviewUrl(objectUrl);
    })();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [router]);

  async function retake() {
    await clearCapture();
    router.push("/camera");
  }

  async function useThis() {
    setLoading(true);
    try {
      const payload = await loadCapture();
      if (!payload?.blob) {
        router.replace("/camera");
        return;
      }

      const imageBase64 = await blobToDataUrl(payload.blob);

      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Erro ao enviar imagem");
      }

      saveCaptureId(data.captureId);
      router.push("/analyzing");
    } catch (e: any) {
      setLoading(false);
      alert(e?.message || "Falha ao enviar imagem");
    }
  }

  if (!previewUrl) return null;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-bold">A foto ficou boa?</h2>
        <p className="text-slate-700">
          Se o texto estiver borrado ou cortado, é melhor tirar outra foto.
        </p>
      </header>

      <div className="rounded-xl border border-slate-200 p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUrl} alt="Foto do documento" className="w-full rounded-lg" />
      </div>

      <div className="space-y-3">
        <PrimaryButton
          label={loading ? "Enviando…" : "✅ Usar esta foto"}
          onClick={useThis}
          disabled={loading}
        />
        <SecondaryButton label="🔄 Tirar outra foto" onClick={retake} disabled={loading} />
      </div>
    </div>
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("Falha ao ler imagem"));
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(blob);
  });
}
