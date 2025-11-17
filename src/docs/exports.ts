export type PosterParts = {
  three: HTMLCanvasElement;
  grid?: HTMLCanvasElement | null;
  eigen?: HTMLCanvasElement | null;
  title?: string;
  subtitle?: string;
  footerRight?: string;
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportPNG(source: HTMLCanvasElement, filename = "snapshot.png") {
  const dataURL = source.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataURL;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function startVideoCapture(
  source: HTMLCanvasElement,
  {
    fps = 60,
    mimeCandidates = ["video/mp4;codecs=h264", "video/webm;codecs=vp9", "video/webm"] as string[],
    bitsPerSecond = 6_000_000,
    filename = "capture",
  } = {}
) {
  const stream = source.captureStream(fps);
  const mime = mimeCandidates.find(MediaRecorder.isTypeSupported) ?? "";
  const recorder = new MediaRecorder(stream, { mimeType: mime || undefined, bitsPerSecond });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size) chunks.push(e.data);
  };

  let stopped = false;
  const stop = () =>
    new Promise<Blob>((resolve) => {
      if (stopped) return resolve(new Blob());
      recorder.onstop = () => {
        stopped = true;
        resolve(new Blob(chunks, { type: recorder.mimeType || mime || "video/webm" }));
      };
      recorder.stop();
    });
  recorder.start();

  return {
    async stopAndSave() {
      const blob = await stop();
      const ext = (recorder.mimeType || mime).includes("mp4") ? "mp4" : "webm";
      downloadBlob(blob, `${filename}.${ext}`);
      return blob;
    },
    stop,
    get recording() {
      return recorder.state === "recording";
    },
  };
}

export async function exportPoster(parts: PosterParts, outName = "poster.png") {
  const W = 1920;
  const H = 1080;
  const pad = 36;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#0b1220";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#e6edf7";
  ctx.font = "600 32px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillText(parts.title ?? "Move Group Explorer", pad, 60);
  ctx.font = "400 18px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillStyle = "rgba(230,237,247,0.8)";
  ctx.fillText(parts.subtitle ?? "Permutation grid • Eigen-ring • 4D tesseract", pad, 90);

  if (parts.footerRight) {
    ctx.textAlign = "right";
    ctx.fillText(parts.footerRight, W - pad, H - pad * 0.5);
    ctx.textAlign = "left";
  }

  const leftW = Math.floor((W - pad * 3) * 0.45);
  const rightW = W - pad * 3 - leftW;
  const leftH = H - pad * 4 - 60;
  const rightH = leftH;

  const drawFitted = (src: HTMLCanvasElement, x: number, y: number, w: number, h: number) => {
    const ar = src.width / src.height;
    let dw = w;
    let dh = w / ar;
    if (dh > h) {
      dh = h;
      dw = h * ar;
    }
    const ox = x + (w - dw) * 0.5;
    const oy = y + (h - dh) * 0.5;
    ctx.drawImage(src, ox, oy, dw, dh);
  };

  const leftX = pad;
  const leftY = pad * 1.8 + 60;
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.strokeRect(leftX, leftY, leftW, leftH);
  if (parts.grid) drawFitted(parts.grid, leftX, leftY, leftW, leftH);

  const rightX = leftX + leftW + pad;
  const rightY = leftY;
  const slotH = Math.floor((rightH - pad) / 2);

  ctx.strokeRect(rightX, rightY, rightW, slotH);
  if (parts.eigen) drawFitted(parts.eigen, rightX, rightY, rightW, slotH);

  ctx.strokeRect(rightX, rightY + slotH + pad, rightW, slotH);
  drawFitted(parts.three, rightX, rightY + slotH + pad, rightW, slotH);

  exportPNG(canvas, outName);
}
