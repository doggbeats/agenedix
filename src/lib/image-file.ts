const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_DATA_URL_LENGTH = 2_000_000;
const DEFAULT_MAX_SIDE = 512;
const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES.has(file.type)) {
    return "Escolha um arquivo PNG, JPG ou WebP.";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "A imagem deve ter no máximo 5 MB.";
  }
  return null;
}

async function loadSource(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file, { imageOrientation: "from-image" });
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem."));
    };
    image.src = url;
  });
}

/**
 * Lê o arquivo escolhido, redimensiona e devolve um data URL leve (WebP, com
 * PNG como fallback) para ser salvo junto ao estabelecimento.
 */
export async function prepareImageDataUrl(
  file: File,
  maxSide = DEFAULT_MAX_SIDE,
): Promise<string> {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const source = await loadSource(file);
  try {
    const sourceWidth = source.width;
    const sourceHeight = source.height;
    if (!sourceWidth || !sourceHeight) throw new Error("Imagem inválida.");

    const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível processar a imagem.");

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(source, 0, 0, width, height);

    let dataUrl = canvas.toDataURL("image/webp", 0.9);
    if (!dataUrl.startsWith("data:image/webp")) {
      dataUrl = canvas.toDataURL("image/png");
    }
    if (dataUrl.length > MAX_DATA_URL_LENGTH) {
      throw new Error("A imagem ficou muito grande. Tente um arquivo menor.");
    }
    return dataUrl;
  } finally {
    if ("close" in source) source.close();
  }
}
