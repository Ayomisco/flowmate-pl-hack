import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { COLORS } from "../styles";

// ─── Fade In ───
export const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}> = ({ children, delay = 0, duration = 20 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <div style={{ opacity }}>{children}</div>;
};

// ─── Slide Up ───
export const SlideUp: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
}> = ({ children, delay = 0, duration = 25, distance = 60 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 100, mass: 0.5 },
  });
  const translateY = interpolate(progress, [0, 1], [distance, 0]);
  const opacity = interpolate(frame - delay, [0, duration * 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ transform: `translateY(${translateY}px)`, opacity }}>
      {children}
    </div>
  );
};

// ─── Scale In ───
export const ScaleIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
}> = ({ children, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 120, mass: 0.4 },
  });
  const scale = interpolate(progress, [0, 1], [0.6, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  return (
    <div style={{ transform: `scale(${scale})`, opacity }}>
      {children}
    </div>
  );
};

// ─── Typewriter Effect ───
export const Typewriter: React.FC<{
  text: string;
  delay?: number;
  speed?: number;
  style?: React.CSSProperties;
}> = ({ text, delay = 0, speed = 2, style = {} }) => {
  const frame = useCurrentFrame();
  const adjustedFrame = Math.max(0, frame - delay);
  const charsToShow = Math.min(
    Math.floor(adjustedFrame / speed),
    text.length
  );
  const displayText = text.slice(0, charsToShow);
  const showCursor = adjustedFrame % 16 < 10 && charsToShow < text.length;

  return (
    <span style={style}>
      {displayText}
      {showCursor && (
        <span style={{ color: COLORS.primary, fontWeight: "bold" }}>|</span>
      )}
    </span>
  );
};

// ─── Glow Pulse ───
export const GlowPulse: React.FC<{
  children: React.ReactNode;
  color?: string;
  delay?: number;
}> = ({ children, color = COLORS.primary, delay = 0 }) => {
  const frame = useCurrentFrame();
  const adjustedFrame = Math.max(0, frame - delay);
  const pulse = Math.sin(adjustedFrame * 0.08) * 0.4 + 0.6;
  return (
    <div
      style={{
        filter: `drop-shadow(0 0 ${20 * pulse}px ${color}40)`,
      }}
    >
      {children}
    </div>
  );
};

// ─── Gradient Background ───
export const GradientBg: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style = {} }) => {
  const frame = useCurrentFrame();
  const angle = interpolate(frame, [0, 2250], [135, 225]);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: `linear-gradient(${angle}deg, ${COLORS.bgGradientStart} 0%, ${COLORS.bgGradientEnd} 50%, #0D1520 100%)`,
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ─── Floating Particles ───
export const FloatingParticles: React.FC<{ count?: number }> = ({
  count = 15,
}) => {
  const frame = useCurrentFrame();
  const particles = Array.from({ length: count }, (_, i) => {
    const seed = i * 137.508; // golden angle
    const x = ((seed * 7.3) % 100);
    const y = ((seed * 13.7 + frame * (0.15 + (i % 5) * 0.05)) % 120) - 10;
    const size = 2 + (i % 4) * 1.5;
    const opacity = 0.1 + (i % 3) * 0.08;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: `${x}%`,
          top: `${y}%`,
          width: size,
          height: size,
          borderRadius: "50%",
          background: i % 3 === 0 ? COLORS.primary : COLORS.accentBlue,
          opacity,
        }}
      />
    );
  });
  return <>{particles}</>;
};

// ─── Progress Bar ───
export const ProgressBar: React.FC<{
  progress: number;
  width?: number;
  height?: number;
  color?: string;
}> = ({ progress, width = 400, height = 8, color = COLORS.primary }) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: height / 2,
        background: `${COLORS.bgCard}`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.min(progress * 100, 100)}%`,
          height: "100%",
          borderRadius: height / 2,
          background: `linear-gradient(90deg, ${color}, ${color}CC)`,
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
};
