"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SecondaryButton } from "@/components/SecondaryButton";
import { saveCapture } from "@/lib/captureStore";

export default function CameraPage() {
  const router = useRouter();

  const cameraRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function openCamera() {
    cameraRef.current?.click();
  }

  function openFiles() {
    fileRef.current?.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Permite escolher o mesmo arquivo novamente (especialmente no iOS)
    e.currentTarget.value = "";

    // Salva imediatamente o blob para a tela /confirm
    await saveCapture({
      blob: file,
      createdAt: new Date().toISOString(),
    });

    // A confirmação passa a existir apenas em /confirm
    router.push("/confirm");
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-bold">Enviar documento</h2>
        <p className="text-slate-700">
          Tire uma foto do documento ou escolha uma imagem já salva no seu celular.
        </p>

        <ul className="list-disc pl-6 text-slate-700">
          <li>Fotografe o documento inteiro</li>
          <li>Evite sombras e reflexos</li>
          <li>Use um local bem iluminado</li>
        </ul>
      </header>

      {/* INPUTS ESCONDIDOS */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileChange}
      />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      <div className="space-y-3">
        <PrimaryButton label="📸 Tirar foto" onClick={openCamera} />
        <SecondaryButton label="📎 Escolher arquivo" onClick={openFiles} />
      </div>

      <p className="text-sm text-slate-600">
        Dica: se o texto estiver pequeno, aproxime mais a câmera ou escolha uma
        imagem com melhor qualidade.
      </p>
    </div>
  );
}