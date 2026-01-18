import { useEffect, useRef } from "react";

interface RadarChartProps {
  data: {
    label: string;
    value: number;
  }[];
}

const RadarChart = ({ data }: RadarChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;
    const numAxes = data.length;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw web circles
    const levels = 5;
    for (let i = levels; i >= 1; i--) {
      const levelRadius = (radius / levels) * i;
      ctx.beginPath();
      ctx.strokeStyle = `rgba(139, 92, 246, ${0.1 + (i / levels) * 0.2})`;
      ctx.lineWidth = 1;

      for (let j = 0; j <= numAxes; j++) {
        const angle = (Math.PI * 2 * j) / numAxes - Math.PI / 2;
        const x = centerX + Math.cos(angle) * levelRadius;
        const y = centerY + Math.sin(angle) * levelRadius;
        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Draw axes
    for (let i = 0; i < numAxes; i++) {
      const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "rgba(139, 92, 246, 0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw labels
      const labelRadius = radius + 20;
      const labelX = centerX + Math.cos(angle) * labelRadius;
      const labelY = centerY + Math.sin(angle) * labelRadius;
      ctx.font = "11px Rajdhani";
      ctx.fillStyle = "rgba(139, 92, 246, 0.7)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(data[i].label.toUpperCase(), labelX, labelY);
    }

    // Draw data polygon
    ctx.beginPath();
    for (let i = 0; i <= numAxes; i++) {
      const index = i % numAxes;
      const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
      const value = data[index].value / 100;
      const x = centerX + Math.cos(angle) * radius * value;
      const y = centerY + Math.sin(angle) * radius * value;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();

    // Fill with gradient
    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius
    );
    gradient.addColorStop(0, "rgba(217, 70, 239, 0.4)");
    gradient.addColorStop(1, "rgba(139, 92, 246, 0.1)");
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = "rgba(217, 70, 239, 0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw data points
    for (let i = 0; i < numAxes; i++) {
      const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
      const value = data[i].value / 100;
      const x = centerX + Math.cos(angle) * radius * value;
      const y = centerY + Math.sin(angle) * radius * value;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#d946ef";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [data]);

  return (
    <div className="system-panel p-4 hover-glow animate-fade-in-up animation-delay-100">
      <div className="text-center mb-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">1</span>
        <h3 className="text-sm font-gothic text-primary">Coins</h3>
      </div>
      
      <div className="relative flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={280}
          height={280}
          className="w-full max-w-[280px]"
        />
        
        {/* Center decoration */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-3 h-3 rounded-full bg-primary/30 animate-pulse-glow" />
        </div>
      </div>

      {/* Creativity Sample */}
      <div className="mt-4 text-center border-t border-border/30 pt-3">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">Creativity Sample</div>
        <div className="text-xl font-bold text-foreground mt-1">
          450<span className="text-muted-foreground">/600</span>
        </div>
      </div>
    </div>
  );
};

export default RadarChart;
