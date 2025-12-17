import { useBrand } from "@/brand/BrandProvider";
import { AuthFooter } from "./AuthFooter";

interface AuthPageProps {
  children: React.ReactNode;
}

export const AuthPage = ({ children }: AuthPageProps) => {
  const brand = useBrand();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-background via-muted/50 to-primary/10">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-secondary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Header with logo - matches in-app header */}
      <header className="relative z-10 flex h-20 items-center bg-[hsl(var(--header))] text-foreground border-[1.5px] border-foreground px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <img 
            src={brand.logoUrl} 
            alt={`${brand.name} Logo`} 
            className="h-14" 
          />
        </div>
      </header>

      {/* Main content - centered card */}
      <main className="relative flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <AuthFooter />
    </div>
  );
};
