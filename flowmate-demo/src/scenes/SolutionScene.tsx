import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS, FONTS } from "../styles";
import {
  GradientBg,
  FloatingParticles,
  SlideUp,
  ScaleIn,
  GlowPulse,
} from "../components/Animations";

const FEATURES = [
  {
    icon: "🤖",
    title: "AI-Powered Agent",
    desc: "Tell it what you want in plain English",
    color: COLORS.accentPurple,
  },
  {
    icon: "🏦",
    title: "Multi-Vault System",
    desc: "Available, Savings, Emergency & Staking",
    color: COLORS.primary,
  },
  {
    icon: "⚡",
    title: "Autonomous Execution",
    desc: "Set rules once, they run forever on-chain",
    color: COLORS.accentOrange,
  },
  {
    icon: "🔐",
    title: "Walletless Onboarding",
    desc: "Sign up with email. No seed phrases.",
    color: COLORS.accentBlue,
  },
];

export const SolutionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <GradientBg>
      <FloatingParticles count={12} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: "0 100px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Section label */}
        <SlideUp delay={5}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 40,
                height: 2,
                background: COLORS.primary,
                borderRadius: 1,
              }}
            />
            <span
              style={{
                color: COLORS.primary,
                fontSize: 16,
                fontFamily: FONTS.body,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 3,
              }}
            >
              The Solution
            </span>
          </div>
        </SlideUp>

        {/* Heading */}
        <SlideUp delay={12}>
          <h2
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: COLORS.textWhite,
              fontFamily: FONTS.heading,
              margin: 0,
              marginBottom: 16,
              textAlign: "center",
              lineHeight: 1.15,
            }}
          >
            One interface.{" "}
            <span style={{ color: COLORS.primary }}>One conversation.</span>
          </h2>
        </SlideUp>

        <SlideUp delay={20}>
          <p
            style={{
              fontSize: 24,
              color: COLORS.textMuted,
              fontFamily: FONTS.body,
              margin: 0,
              marginBottom: 60,
              textAlign: "center",
            }}
          >
            Full control through transparent boundaries.
          </p>
        </SlideUp>

        {/* Feature grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            width: "100%",
            maxWidth: 1000,
          }}
        >
          {FEATURES.map((feat, i) => {
            const cardDelay = 30 + i * 10;
            const progress = spring({
              frame: frame - cardDelay,
              fps,
              config: { damping: 18, stiffness: 100, mass: 0.5 },
            });
            return (
              <div
                key={i}
                style={{
                  padding: "36px 32px",
                  borderRadius: 20,
                  background: COLORS.bgCard,
                  border: `1px solid ${feat.color}20`,
                  opacity: progress,
                  transform: `translateY(${interpolate(progress, [0, 1], [30, 0])}px)`,
                  display: "flex",
                  gap: 20,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    fontSize: 40,
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: `${feat.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {feat.icon}
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: COLORS.textWhite,
                      fontFamily: FONTS.heading,
                      margin: "0 0 8px 0",
                    }}
                  >
                    {feat.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 18,
                      color: COLORS.textMuted,
                      fontFamily: FONTS.body,
                      margin: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GradientBg>
  );
};
