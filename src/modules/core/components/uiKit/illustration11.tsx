"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";

const PIN_DATA = [
  {
    id: 1,
    img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    x: "25%",
    y: "25%",
  },
  {
    id: 2,
    img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    x: "49%",
    y: "38%",
  },
  {
    id: 3,
    img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    x: "75%",
    y: "33%",
  },
  {
    id: 4,
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    x: "42%",
    y: "62%",
  },
  {
    id: 5,
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    x: "72%",
    y: "55%",
  },
];

const MapMarker = ({
  img,
  x,
  y,
  delay,
}: {
  img: string;
  x: string;
  y: string;
  delay: number;
}) => (
  <motion.div
    initial={{ scale: 0, opacity: 0, y: 20 }}
    animate={{ scale: 1, opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 180, damping: 15, delay }}
    className="absolute z-10 flex -translate-x-1/2 -translate-y-full flex-col items-center"
    style={{
      left: x,
      top: y,
      filter: "drop-shadow(0px 15px 20px rgba(0, 0, 0, 0.12))",
    }}
  >
    <div className="relative z-10 h-[60px] w-[60px] rounded-full bg-white p-[4px]">
      <img
        src={img}
        className="h-full w-full rounded-full object-cover"
        alt="User"
      />
    </div>
    <div className="relative z-0 -mt-2.5 h-4 w-4 rotate-45 rounded-sm bg-white" />
  </motion.div>
);

const DotMap = () => (
  <div className="absolute inset-0 flex h-full w-full items-center justify-center">
    <svg viewBox="0 0 1000 700" className="h-full w-full">
      <defs>
        <pattern
          id="dotPattern"
          x="0"
          y="0"
          width="12"
          height="12"
          patternUnits="userSpaceOnUse"
        >
          <rect x="4" y="4" width="3.5" height="3.5" fill="#cbd5e1" rx="0.5" />
        </pattern>

        <filter id="roughEdge" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.04"
            numOctaves="3"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="80"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation="6" result="blurred" />
        </filter>

        <mask id="northAmericaMask">
          <g filter="url(#roughEdge)">
            <path
              d="M 600 50 L 750 30 L 850 150 L 750 250 L 650 200 Z"
              fill="white"
            />
            <path d="M 880 120 L 980 150 L 950 280 L 850 200 Z" fill="white" />
            <path
              d="
                M 80 200
                L 150 120 L 250 100 L 400 120 L 500 100
                L 550 150 L 600 220 L 650 300 L 600 400
                L 550 450 L 480 420 L 450 500 L 400 550
                L 350 500 L 320 580 L 350 650 L 280 600
                L 220 500 L 180 400 L 150 350 L 100 300
                Z"
              fill="white"
            />
            <path d="M 480 500 L 550 520 L 600 580 L 500 550 Z" fill="white" />
            <circle cx="580" cy="450" r="30" fill="white" />
            <circle cx="630" cy="500" r="25" fill="white" />
            <circle cx="200" cy="160" r="35" fill="white" />
          </g>
        </mask>
      </defs>

      <rect
        width="100%"
        height="100%"
        fill="url(#dotPattern)"
        mask="url(#northAmericaMask)"
      />
    </svg>
  </div>
);

export default function App() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex aspect-4/3 w-full max-w-6xl items-center justify-center">
      <DotMap />

      <div className="pointer-events-none absolute inset-0">
        {visible &&
          PIN_DATA.map((pin, i) => (
            <div className="pointer-events-auto" key={pin.id}>
              <MapMarker {...pin} delay={0.3 + i * 0.15} />
            </div>
          ))}
      </div>
    </div>
  );
}
