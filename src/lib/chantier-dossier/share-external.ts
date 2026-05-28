/** Texte standard pour partager un document chantier (e-mail, WhatsApp, etc.). */
export function buildChantierShareMessage(opts: {
  fileName: string;
  projectTitle?: string | null;
  downloadUrl: string;
  validityHours?: number;
}): string {
  const hours = opts.validityHours ?? 24;
  const lines = [`Document chantier : ${opts.fileName}`];
  if (opts.projectTitle?.trim()) {
    lines.push(`Chantier : ${opts.projectTitle.trim()}`);
  }
  lines.push(
    "",
    `Lien de téléchargement sécurisé (valide ${hours} h) :`,
    opts.downloadUrl,
    "",
    "— Envoyé depuis BeWork"
  );
  return lines.join("\n");
}

export function buildMailtoHref(subject: string, body: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function buildWhatsAppHref(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function nativeShareButtonLabel(): string {
  if (typeof navigator === "undefined") return "Partager…";
  const ua = navigator.userAgent;
  if (/Macintosh|iPhone|iPad|iPod/.test(ua)) return "AirDrop / Partager";
  if (/Android/.test(ua)) return "Partager…";
  return "Partager…";
}

export function canShareFiles(): boolean {
  if (typeof navigator === "undefined" || !navigator.share) return false;
  try {
    const probe = new File([new Blob(["x"])], "probe.txt", { type: "text/plain" });
    return Boolean(navigator.canShare?.({ files: [probe] }));
  } catch {
    return false;
  }
}

/** Partage natif (AirDrop sur Safari macOS/iOS quand le fichier est supporté). */
export async function shareChantierFileNative(
  fileId: string,
  fileName: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!navigator.share) {
    return {
      ok: false,
      error:
        "Partage système indisponible sur ce navigateur. Téléchargez le fichier puis utilisez AirDrop depuis le Finder ou les Fichiers.",
    };
  }

  try {
    const res = await fetch(`/api/chantier/files/${fileId}/preview?download=original`, {
      credentials: "same-origin",
    });
    if (!res.ok) {
      return { ok: false, error: "Impossible de récupérer le fichier pour le partage." };
    }
    const blob = await res.blob();
    const type = blob.type || "application/octet-stream";
    const file = new File([blob], fileName, { type });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: fileName });
      return { ok: true };
    }

    const linkRes = await fetch(`/api/chantier/files/${fileId}/share-link`, { credentials: "same-origin" });
    const linkData = (await linkRes.json()) as { body?: string; url?: string; error?: string };
    if (!linkRes.ok) {
      return { ok: false, error: linkData.error ?? "Lien de partage indisponible." };
    }
    const text = linkData.body ?? `Document : ${fileName}\n${linkData.url ?? ""}`;
    await navigator.share({
      title: fileName,
      text,
      url: linkData.url,
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return { ok: true };
    }
    return {
      ok: false,
      error: "Partage annulé ou refusé. Sur Mac, privilégiez Safari pour AirDrop.",
    };
  }
}
