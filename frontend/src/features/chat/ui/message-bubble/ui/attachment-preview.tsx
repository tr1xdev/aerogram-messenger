import {
  useState,
  useEffect,
  useMemo,
  useRef,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  Download,
  X,
  Copy,
  ExternalLink,
  Check,
  FileIcon,
  ShieldAlert,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFileDownload } from "../hooks/use-file-download";

interface Attachment {
  readonly url: string;
  readonly fileName: string;
  readonly fileSize: string | number | null;
  readonly contentType: string | null;
}

interface AttachmentPreviewProps {
  file: Attachment;
  children: ReactNode;
  className?: string;
}

const formatBytes = (bytes: string | number | null): string => {
  if (!bytes) return "0 B";
  const k: number = 1024;
  const sizes: string[] = ["B", "KB", "MB", "GB", "TB"];
  const i: number = Math.floor(Math.log(Number(bytes)) / Math.log(k));
  return `${parseFloat((Number(bytes) / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const AttachmentPreview = ({
  file,
  children,
  className = "",
}: AttachmentPreviewProps): ReactElement => {
  const { downloadFile } = useFileDownload();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isTextLoading, setIsTextLoading] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [constraints, setConstraints] = useState({
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  });

  const ZOOM_LEVEL: number = 2.5;

  const fileExtension: string = useMemo((): string => {
    return file.fileName.split(".").pop()?.toLowerCase() ?? "";
  }, [file.fileName]);

  const isImage: boolean = useMemo((): boolean => {
    if (file.contentType?.startsWith("image/")) return true;
    const imageExtensions: string[] = [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "svg",
      "avif",
    ];
    return imageExtensions.includes(fileExtension);
  }, [file.contentType, fileExtension]);

  const isTextFile: boolean = useMemo((): boolean => {
    const textExtensions: string[] = [
      "txt",
      "ts",
      "js",
      "go",
      "cpp",
      "cxx",
      "h",
      "json",
      "md",
      "css",
      "html",
      "py",
      "rs",
    ];
    return (
      textExtensions.includes(fileExtension) ||
      (file.contentType?.startsWith("text/") ?? false)
    );
  }, [fileExtension, file.contentType]);

  const isDangerous: boolean = useMemo((): boolean => {
    const dangerousExtensions: string[] = [
      "exe",
      "msi",
      "bat",
      "sh",
      "cmd",
      "scr",
      "com",
    ];
    return dangerousExtensions.includes(fileExtension);
  }, [fileExtension]);

  useEffect((): void => {
    if (isOpen && isTextFile && !textContent) {
      void fetchTextContent();
    }
  }, [isOpen, isTextFile]);

  const fetchTextContent = async (): Promise<void> => {
    setIsTextLoading(true);
    try {
      const response: Response = await fetch(file.url);
      const text: string = await response.text();
      setTextContent(text);
    } catch (err: unknown) {
      console.error(err);
      setTextContent("Failed to load file content.");
    } finally {
      setIsTextLoading(false);
    }
  };

  const calculateConstraints = (): void => {
    if (!containerRef.current || !imageRef.current) return;
    const container: DOMRect = containerRef.current.getBoundingClientRect();
    const image: DOMRect = imageRef.current.getBoundingClientRect();
    const zoomedWidth: number = image.width * ZOOM_LEVEL;
    const zoomedHeight: number = image.height * ZOOM_LEVEL;
    const xOverlap: number =
      zoomedWidth > container.width ? (zoomedWidth - container.width) / 2 : 0;
    const yOverlap: number =
      zoomedHeight > container.height
        ? (zoomedHeight - container.height) / 2
        : 0;
    setConstraints({
      left: -xOverlap,
      right: xOverlap,
      top: -yOverlap,
      bottom: yOverlap,
    });
  };

  useEffect((): (() => void) => {
    if (isZoomed) window.addEventListener("resize", calculateConstraints);
    return (): void =>
      window.removeEventListener("resize", calculateConstraints);
  }, [isZoomed]);

  const handleClose = (): void => {
    setIsOpen(false);
    setIsZoomed(false);
    setIsImageLoading(true);
    setShowConfirm(false);
    setTextContent(null);
  };

  const toggleZoom = (): void => {
    if (!isZoomed) setTimeout(calculateConstraints, 50);
    setIsZoomed((prev: boolean): boolean => !prev);
  };

  const confirmDownload = async (): Promise<void> => {
    await downloadFile(file.url, file.fileName);
    setShowConfirm(false);
  };

  const handleDownloadClick = (): void => {
    if (isDangerous) setShowConfirm(true);
    else void downloadFile(file.url, file.fileName);
  };

  useEffect((): (() => void) => {
    if (!isOpen) return (): void => {};
    const originalOverflow: string = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return (): void => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const copyToClipboard = async (): Promise<void> => {
    try {
      if (isImage) {
        const response: Response = await fetch(file.url);
        const blob: Blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
        ]);
      } else {
        await navigator.clipboard.writeText(textContent || file.url);
      }
      setIsCopied(true);
      setTimeout((): void => setIsCopied(false), 2000);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  return (
    <>
      <div
        onClick={(): void => setIsOpen(true)}
        className={`contents cursor-pointer ${className}`}
      >
        {children}
      </div>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-black/95 flex flex-col overflow-hidden"
            >
              <div className="absolute inset-0 z-0" onClick={handleClose} />

              <div className="absolute top-6 right-6 z-[101] flex items-center gap-3">
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="p-3 bg-zinc-900/90 text-white rounded-full border border-white/10 hover:bg-zinc-800 backdrop-blur-md transition-colors"
                >
                  {isCopied ? (
                    <Check size={20} className="text-green-400" />
                  ) : (
                    <Copy size={20} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={(): void => {
                    window.open(file.url, "_blank");
                  }}
                  className="p-3 bg-zinc-900/90 text-white rounded-full border border-white/10 hover:bg-zinc-800 backdrop-blur-md transition-colors"
                >
                  <ExternalLink size={20} />
                </button>
                <button
                  type="button"
                  onClick={handleDownloadClick}
                  className="p-3 bg-zinc-900/90 text-white rounded-full border border-white/10 hover:bg-zinc-800 backdrop-blur-md transition-colors"
                >
                  <Download size={20} />
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-3 bg-zinc-900/90 text-white rounded-full border border-white/10 hover:bg-zinc-800 backdrop-blur-md ml-2 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div
                ref={containerRef}
                className="relative flex-1 w-full h-full flex items-center justify-center pointer-events-none"
              >
                {isImage ? (
                  <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
                    {isImageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                    <motion.div
                      drag={isZoomed}
                      dragConstraints={constraints}
                      dragMomentum={false}
                      dragElastic={0}
                      onDragStart={(): void => setIsDragging(true)}
                      onDragEnd={(): void => {
                        setTimeout((): void => setIsDragging(false), 50);
                      }}
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{
                        scale: isZoomed ? ZOOM_LEVEL : 1,
                        opacity: isImageLoading ? 0 : 1,
                        x: isZoomed ? undefined : 0,
                        y: isZoomed ? undefined : 0,
                      }}
                      transition={{
                        type: "spring",
                        mass: 0.5,
                        stiffness: 400,
                        damping: 35,
                      }}
                      style={{ willChange: "transform", touchAction: "none" }}
                      className="pointer-events-auto"
                    >
                      <img
                        ref={imageRef}
                        src={file.url}
                        alt={file.fileName}
                        onPointerUp={(e: React.PointerEvent): void => {
                          if (e.button !== 0 || isDragging) return;
                          toggleZoom();
                        }}
                        onLoad={(): void => {
                          setIsImageLoading(false);
                          calculateConstraints();
                        }}
                        className={`max-w-[95vw] max-h-[85vh] object-contain shadow-2xl rounded-sm select-none ${isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
                        draggable={false}
                      />
                    </motion.div>
                  </div>
                ) : isTextFile ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pointer-events-auto bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl mx-4 overflow-hidden"
                  >
                    <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-white/[0.02]">
                      <FileText size={18} className="text-zinc-400" />
                      <span className="text-zinc-300 text-sm font-medium truncate">
                        {file.fileName}
                      </span>
                    </div>
                    <div className="flex-1 overflow-auto p-6 scrollbar-thin scrollbar-thumb-zinc-700">
                      {isTextLoading ? (
                        <div className="h-full flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
                        </div>
                      ) : (
                        <pre className="text-zinc-300 text-sm font-mono whitespace-pre-wrap break-all leading-relaxed">
                          {textContent}
                        </pre>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="pointer-events-auto bg-zinc-900 border border-white/10 p-10 rounded-2xl flex flex-col items-center gap-6 max-w-sm w-full shadow-2xl mx-4"
                  >
                    <div className="w-20 h-20 bg-zinc-800 rounded-3xl flex items-center justify-center shadow-inner">
                      <FileIcon size={40} className="text-zinc-400" />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-white font-semibold text-lg line-clamp-2 break-all px-2">
                        {file.fileName}
                      </h3>
                      <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm font-medium">
                        <span>{fileExtension.toUpperCase()}</span>
                        <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                        <span>{formatBytes(file.fileSize)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadClick}
                      className="w-full py-4 px-6 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Download size={20} />
                      Download File
                    </button>
                  </motion.div>
                )}

                <AnimatePresence>
                  {showConfirm && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-[110] flex items-center justify-center p-6 pointer-events-auto"
                    >
                      <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                        onClick={(): void => setShowConfirm(false)}
                      />
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative bg-zinc-900 border border-white/10 p-6 rounded-2xl max-w-[340px] w-full shadow-2xl text-center"
                      >
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ShieldAlert className="text-white/60" size={24} />
                        </div>
                        <h4 className="text-white font-bold mb-3 text-lg">
                          Security Warning
                        </h4>
                        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                          This file type may harm your computer. Do you really
                          want to download{" "}
                          <span className="text-zinc-200 break-all font-medium">
                            [{file.fileName}]
                          </span>
                          ?
                        </p>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={(): void => setShowConfirm(false)}
                            className="flex-1 py-2.5 bg-zinc-800 text-white rounded-lg text-sm font-semibold hover:bg-zinc-700 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={confirmDownload}
                            className="flex-1 py-2.5 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors"
                          >
                            Download
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-zinc-500 text-xs font-medium tracking-wide select-none bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/5 z-[101]">
                {file.fileName.toUpperCase()} • {formatBytes(file.fileSize)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
};
