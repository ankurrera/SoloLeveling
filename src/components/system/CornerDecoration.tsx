interface CornerDecorationProps {
  className?: string;
}

const CornerDecoration = ({ className = "" }: CornerDecorationProps) => {
  return (
    <div className={`absolute pointer-events-none ${className}`}>
      {/* Top Left */}
      <svg 
        className="absolute top-0 left-0 w-24 h-24 text-primary opacity-40"
        viewBox="0 0 100 100"
      >
        <path
          d="M0 50 L0 10 Q0 0 10 0 L50 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <path
          d="M0 40 L0 15 Q0 5 10 5 L40 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          opacity="0.5"
        />
        <circle cx="0" cy="50" r="2" fill="currentColor" />
        <circle cx="50" cy="0" r="2" fill="currentColor" />
        
        {/* Decorative elements */}
        <path
          d="M5 25 L15 25 L20 20 L25 25"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          opacity="0.6"
        />
        <path
          d="M25 5 L25 15 L20 20 L25 25"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          opacity="0.6"
        />
      </svg>

      {/* Top Right */}
      <svg 
        className="absolute top-0 right-0 w-24 h-24 text-primary opacity-40"
        viewBox="0 0 100 100"
      >
        <path
          d="M50 0 L90 0 Q100 0 100 10 L100 50"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <path
          d="M60 5 L85 5 Q95 5 95 15 L95 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          opacity="0.5"
        />
        <circle cx="50" cy="0" r="2" fill="currentColor" />
        <circle cx="100" cy="50" r="2" fill="currentColor" />
        
        <path
          d="M75 5 L75 15 L80 20 L75 25"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          opacity="0.6"
        />
      </svg>

      {/* Bottom Left */}
      <svg 
        className="absolute bottom-0 left-0 w-24 h-24 text-primary opacity-40"
        viewBox="0 0 100 100"
      >
        <path
          d="M0 50 L0 90 Q0 100 10 100 L50 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <path
          d="M5 60 L5 85 Q5 95 15 95 L40 95"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          opacity="0.5"
        />
        <circle cx="0" cy="50" r="2" fill="currentColor" />
        <circle cx="50" cy="100" r="2" fill="currentColor" />
      </svg>

      {/* Bottom Right */}
      <svg 
        className="absolute bottom-0 right-0 w-24 h-24 text-primary opacity-40"
        viewBox="0 0 100 100"
      >
        <path
          d="M100 50 L100 90 Q100 100 90 100 L50 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <path
          d="M95 60 L95 85 Q95 95 85 95 L60 95"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          opacity="0.5"
        />
        <circle cx="100" cy="50" r="2" fill="currentColor" />
        <circle cx="50" cy="100" r="2" fill="currentColor" />
      </svg>
    </div>
  );
};

export default CornerDecoration;
