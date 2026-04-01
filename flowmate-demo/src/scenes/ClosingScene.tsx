import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS, FONTS } from "../styles";
import {
  GradientBg,
  FloatingParticles,
  SlideUp,
  GlowPulse,
} from "../components/Animations";

export const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo
  const logoProgress = spring({
    frame: frame - 10,
    fps,
    config: { damping: 12, stiffness: 80, mass: 0.6 },
  });

  return (
    <GradientBg>
      <FloatingParticles count={20} />

      {/* Grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(${COLORS.primary}08 1px, transparent 1px),
            linear-gradient(90deg, ${COLORS.primary}08 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          opacity: 0.3,
        }}
      />

      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.primary}12 0%, transparent 70%)`,
        }}
      />

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
        {/* Logo */}
        <div
          style={{
            opacity: logoProgress,
            transform: `scale(${interpolate(logoProgress, [0, 1], [0.7, 1])})`,
            marginBottom: 40,
          }}
        >
          <GlowPulse color={COLORS.primary}>
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: 26,
                background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 80px ${COLORS.primary}50`,
              }}
            >
              <span
                style={{
                  fontSize: 48,
                  fontWeight: 800,
                  color: COLORS.bgDark,
                  fontFamily: FONTS.heading,
                }}
              >
                FM
              </span>
            </div>
          </GlowPulse>
        </div>

        {/* Main CTA */}
        <SlideUp delay={20}>
          <h2
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: COLORS.textWhite,
              fontFamily: FONTS.heading,
              margin: 0,
              textAlign: "center",
              lineHeight: 1.15,
              letterSpacing: "-1px",
            }}
          >
            Say what you want.
          </h2>
        </SlideUp>

        <SlideUp delay={30}>
          <h2
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: COLORS.primary,
              fontFamily: FONTS.heading,
              margin: "0 0 24px 0",
              textAlign: "center",
              lineHeight: 1.15,
              letterSpacing: "-1px",
            }}
          >
            FlowMate executes.
          </h2>
        </SlideUp>

        <SlideUp delay={40}>
          <p
            style={{
              fontSize: 24,
              color: COLORS.textMuted,
              fontFamily: FONTS.body,
              margin: "0 0 50px 0",
              textAlign: "center",
              maxWidth: 600,
              lineHeight: 1.5,
            }}
          >
            Your autonomous financial operating system
            <br />
            powered by Flow blockchain & AI
          </p>
        </SlideUp>

        {/* Feature bullets */}
        <SlideUp delay={50}>
          <div
            style={{
              display: "flex",
              gap: 40,
              marginBottom: 50,
            }}
          >
            {["AI Agent", "Multi-Vault", "Auto-Execute", "Walletless"].map(
              (label, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: COLORS.primary,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 16,
                      color: COLORS.textLight,
                      fontFamily: FONTS.body,
                      fontWeight: 500,
                    }}
                  >
                    {label}
                  </span>
                </div>
              )
            )}
          </div>
        </SlideUp>

        {/* Hackathon badge */}
        <SlideUp delay={60}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "14px 28px",
              borderRadius: 50,
              border: `1px solid ${COLORS.primary}30`,
              background: `${COLORS.primary}08`,
            }}
          >
            <span
              style={{
                fontSize: 16,
                color: COLORS.textMuted,
                fontFamily: FONTS.body,
              }}
            >
              PL Genesis: Frontiers of Collaboration
            </span>
            <div
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: COLORS.textMuted,
              }}
            />
            <span
              style={{
                fontSize: 16,
                color: COLORS.primary,
                fontFamily: FONTS.body,
                fontWeight: 600,
              }}
            >
              Built on Flow
            </span>
          </div>
        </SlideUp>
      </div>
    </GradientBg>
  );
};
