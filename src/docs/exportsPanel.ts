import { exportPNG, startVideoCapture, exportPoster } from "./exports";

export function mountExportsPanel(cfg: {
  threeCanvas: HTMLCanvasElement;
  gridCanvas?: HTMLCanvasElement | null;
  eigenCanvas?: HTMLCanvasElement | null;
  versionLabel?: string;
}) {
  const panel = document.createElement("div");
  panel.className = "exports-panel";
  panel.innerHTML = `
    <div class="title">Exports</div>
    <button data-btn="png">Snapshot PNG</button>
    <button data-btn="rec">Record 5s Video</button>
    <button data-btn="poster">Poster (grid • eigen • 4D)</button>
  `;

  let rec: ReturnType<typeof startVideoCapture> | null = null;

  panel.querySelector('[data-btn="png"]')!.addEventListener("click", () => {
    exportPNG(cfg.threeCanvas, "snapshot.png");
  });

  panel.querySelector('[data-btn="rec"]')!.addEventListener("click", async (e) => {
    const btn = e.currentTarget as HTMLButtonElement;
    if (!rec) {
      rec = startVideoCapture(cfg.threeCanvas, { filename: "capture" });
      btn.textContent = "Stop & Save";
      setTimeout(async () => {
        if (rec) {
          await rec.stopAndSave();
          rec = null;
          btn.textContent = "Record 5s Video";
        }
      }, 5000);
    } else {
      await rec.stopAndSave();
      rec = null;
      btn.textContent = "Record 5s Video";
    }
  });

  panel.querySelector('[data-btn="poster"]')!.addEventListener("click", () => {
    exportPoster(
      {
        three: cfg.threeCanvas,
        grid: cfg.gridCanvas ?? undefined,
        eigen: cfg.eigenCanvas ?? undefined,
        footerRight: cfg.versionLabel ?? "",
      },
      "poster.png"
    );
  });

  return { el: panel };
}
