export const AuthFooter = () => {
  return (
    <footer className="w-full py-6 px-6">
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <a 
          href="/cookie-policy" 
          className="hover:text-foreground transition-colors"
        >
          Cookie policy
        </a>
        <a 
          href="/privacy-policy" 
          className="hover:text-foreground transition-colors"
        >
          Privacy policy
        </a>
        <a 
          href="/terms" 
          className="hover:text-foreground transition-colors"
        >
          Terms of service
        </a>
      </div>
    </footer>
  );
};
