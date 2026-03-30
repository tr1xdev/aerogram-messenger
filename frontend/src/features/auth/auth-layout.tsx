import { IoPaperPlane } from "react-icons/io5";

type AuthLayoutProps = {
  children: React.ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="container grid h-svh max-w-none items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-2 py-8 sm:w-120 sm:p-8">
        <div className="mb-4 flex items-center justify-center">
          <IoPaperPlane className="w-12 h-12 p-2" />
          <h1 className="text-xl font-medium">Aerogram</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
