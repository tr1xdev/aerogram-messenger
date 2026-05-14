export const useFileDownload = () => {
  const downloadFile = async (url: string, fileName: string): Promise<void> => {
    try {
      const response: Response = await fetch(url);
      const blob: Blob = await response.blob();
      const blobUrl: string = window.URL.createObjectURL(blob);
      const link: HTMLAnchorElement = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  return { downloadFile };
};
