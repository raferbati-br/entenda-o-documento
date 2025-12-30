import { NextResponse } from "next/server";

console.log("[upload] endpoint chamado");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { imageBase64 } = body;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { ok: false, error: "Imagem não enviada" },
        { status: 400 }
      );
    }

    // Validação simples de base64
    if (!imageBase64.startsWith("data:image/")) {
      return NextResponse.json(
        { ok: false, error: "Formato de imagem inválido" },
        { status: 415 }
      );
    }

    // Estimativa de tamanho (bytes)
    const sizeInBytes =
      (imageBase64.length * 3) / 4 -
      (imageBase64.endsWith("==") ? 2 : imageBase64.endsWith("=") ? 1 : 0);
    
     console.log("[upload] size(bytes)=", Math.round(sizeInBytes));

    const MAX_SIZE = 4 * 1024 * 1024; // 4 MB

    if (sizeInBytes > MAX_SIZE) {
      return NextResponse.json(
        { ok: false, error: "Imagem muito grande (máx. 4MB)" },
        { status: 413 }
      );
    }

    // MVP: não salvar imagem, não processar
    // Aqui entra a IA no PASSO 4

    return NextResponse.json({
      ok: true,
      message: "Imagem recebida com sucesso",
      sizeInBytes: Math.round(sizeInBytes),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Erro ao processar a imagem" },
      { status: 500 }
    );
  }
}