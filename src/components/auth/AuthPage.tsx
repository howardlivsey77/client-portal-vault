import { useBrand } from "@/brand/BrandProvider";
import { AuthFooter } from "./AuthFooter";

interface AuthPageProps {
  children: React.ReactNode;
}

export const AuthPage = ({ children }: AuthPageProps) => {
  const brand = useBrand();

  return (
    <div className="min-h-screen flex flex-col bg-muted/50">
      {/* Header with logo */}
      <header className="w-full px-6 py-4">
        <img 
          src={brand.logoUrl} 
          alt={`${brand.name} Logo`} 
          className="h-10 md:h-12" 
        />
      </header>

      {/* Main content - centered card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <AuthFooter />
    </div>
  );
};
