/**
 * Triggers a direct file download to the user's desktop/downloads folder.
 * Uses blob conversion to bypass browser inline tab preview.
 */
export async function downloadFileDirectly(url: string, fileName: string) {
  try {
    // If URL is a data URL (e.g. data:image/png;base64,...)
    if (url.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // Fetch the file content as a blob
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch file for download");
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.style.display = "none";
    a.href = blobUrl;
    a.download = fileName || "download";
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    }, 200);
  } catch (error) {
    console.warn("Direct blob download failed, falling back to direct anchor trigger:", error);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "download";
    a.target = "_self";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
