import { useBrand } from "@/brand/BrandProvider";
import { AuthFooter } from "./AuthFooter";

interface AuthPageProps {
  children: React.ReactNode;
}

export const AuthPage = ({ children }: AuthPageProps) => {
  const brand = useBrand();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-muted/30">
      {/* Decorative organic background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large organic shape - top right */}
        <div 
          className="absolute -top-40 -right-64 w-[900px] h-[900px] bg-muted animate-float-slow"
          style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }}
        />
        {/* Large organic shape - bottom left */}
        <div 
          className="absolute -bottom-64 -left-48 w-[800px] h-[800px] bg-primary/5 animate-float-slower"
          style={{ borderRadius: '40% 60% 70% 30% / 40% 70% 30% 60%' }}
        />
        {/* Subtle accent shape - center right */}
        <div 
          className="absolute top-1/3 -right-32 w-[500px] h-[500px] bg-primary/3 animate-breathe"
          style={{ borderRadius: '50% 50% 40% 60% / 60% 40% 60% 40%' }}
        />
      </div>

      {/* Header with logo - matches in-app header */}
      <header className="relative z-10 flex h-20 items-center bg-[hsl(var(--header))] text-foreground border-[1.5px] border-foreground px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <img 
            src={brand.logoUrl} 
            alt={`${brand.name} Logo`} 
            className="h-18" 
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
