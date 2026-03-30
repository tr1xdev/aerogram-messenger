import { IoPaperPlane } from "react-icons/io5";

interface AuthMobileShellProps {
  title: string;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function AuthMobileShell({
  title,
  description,
  footer,
  children,
}: AuthMobileShellProps) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <div className="flex flex-col items-center px-6 pt-20 pb-8">
        <div className="mb-5 flex items-center gap-2">
          <IoPaperPlane className="h-8 w-8 text-primary" />
          <span className="text-lg font-semibold tracking-tight">Aerogram</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-center">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground text-center leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <div className="flex-1 px-6 pb-4">{children}</div>

      {footer && (
        <div className="px-6 pb-10 pt-2 text-center text-xs text-muted-foreground">
          {footer}
        </div>
      )}
    </div>
  );
}
