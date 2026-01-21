const SystemHeader = () => {
  return (
    <header className="relative py-8 px-6">
      {/* Corner Decorations */}
      <div className="absolute top-4 left-4 w-16 h-16">
        <svg viewBox="0 0 64 64" className="w-full h-full text-primary opacity-60">
          <path
            d="M0 32 L0 0 L32 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          <path
            d="M8 24 L8 8 L24 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.5"
          />
          <circle cx="4" cy="4" r="2" fill="currentColor" opacity="0.8" />
        </svg>
      </div>
      
      <div className="absolute top-4 right-4 w-16 h-16">
        <svg viewBox="0 0 64 64" className="w-full h-full text-primary opacity-60">
          <path
            d="M64 32 L64 0 L32 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          <path
            d="M56 24 L56 8 L40 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.5"
          />
          <circle cx="60" cy="4" r="2" fill="currentColor" opacity="0.8" />
        </svg>
      </div>

      {/* Navigation Label */}
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <span className="text-primary text-sm font-gothic tracking-wider">⚔ LVES</span>
      </div>

      {/* Main Title */}
      <div className="text-center pt-8">
        <h1 className="font-gothic text-4xl md:text-5xl lg:text-6xl font-bold tracking-wider text-glow">
          <span className="block text-primary">SYSTEM</span>
          <span className="block text-foreground mt-1">STATUS</span>
        </h1>
        <p className="mt-4 text-sm uppercase tracking-[0.3em] text-muted-foreground font-system">
          Personal Training Interface
        </p>
        
        {/* Decorative Line */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary" />
          <div className="w-2 h-2 rotate-45 border border-primary" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary" />
        </div>
      </div>
    </header>
  );
};

export default SystemHeader;
