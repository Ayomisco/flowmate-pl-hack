import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS, FONTS } from "../styles";
import {
  GradientBg,
  FloatingParticles,
  FadeIn,
  SlideUp,
  ScaleIn,
  GlowPulse,
} from "../components/Animations";

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo circle animation
  const logoScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 12, stiffness: 80, mass: 0.6 },
  });

  // Tagline fade
  const taglineOpacity = interpolate(frame, [50, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtitle
  const subtitleOpacity = interpolate(frame, [80, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Built on Flow badge
  const badgeProgress = spring({
    frame: frame - 100,
    fps,
    config: { damping: 15, stiffness: 100, mass: 0.5 },
  });

  return (
    <GradientBg>
      <FloatingParticles count={20} />

      {/* Grid pattern overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(${COLORS.primary}08 1px, transparent 1px),
            linear-gradient(90deg, ${COLORS.primary}08 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          opacity: 0.4,
        }}
      />

      {/* Center content */}
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
            transform: `scale(${logoScale})`,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 30,
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 60px ${COLORS.primary}40, 0 20px 40px rgba(0,0,0,0.3)`,
            }}
          >
            <span
              style={{
                fontSize: 60,
                fontWeight: 800,
                color: COLORS.bgDark,
                fontFamily: FONTS.heading,
              }}
            >
              FM
            </span>
          </div>
        </div>

        {/* Title */}
        <SlideUp delay={25}>
          <h1
            style={{
              fontSize: 96,
              fontWeight: 800,
              color: COLORS.textWhite,
              fontFamily: FONTS.heading,
              margin: 0,
              textAlign: "center",
              letterSpacing: "-2px",
            }}
          >
            Flow
            <span style={{ color: COLORS.primary }}>Mate</span>
          </h1>
        </SlideUp>

        {/* Tagline */}
        <div
          style={{
            opacity: taglineOpacity,
            marginTop: 20,
          }}
        >
          <p
            style={{
              fontSize: 36,
              color: COLORS.textLight,
              fontFamily: FONTS.body,
              margin: 0,
              textAlign: "center",
              fontWeight: 300,
              letterSpacing: "1px",
            }}
          >
            Say what you want.{" "}
            <span style={{ color: COLORS.primary, fontWeight: 600 }}>
              FlowMate executes.
            </span>
          </p>
        </div>

        {/* Subtitle */}
        <div style={{ opacity: subtitleOpacity, marginTop: 16 }}>
          <p
            style={{
              fontSize: 22,
              color: COLORS.textMuted,
              fontFamily: FONTS.body,
              margin: 0,
              textAlign: "center",
              maxWidth: 700,
              lineHeight: 1.5,
            }}
          >
            Your autonomous financial operating system on Flow blockchain
          </p>
        </div>

        {/* Built on Flow badge */}
        <div
          style={{
            marginTop: 50,
            opacity: badgeProgress,
            transform: `translateY(${interpolate(badgeProgress, [0, 1], [20, 0])}px)`,
          }}
        >
          <GlowPulse color={COLORS.primary} delay={100}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 28px",
                borderRadius: 50,
                border: `1px solid ${COLORS.primary}40`,
                background: `${COLORS.primary}10`,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: COLORS.primary,
                  boxShadow: `0 0 10px ${COLORS.primary}`,
                }}
              />
              <span
                style={{
                  color: COLORS.primary,
                  fontSize: 18,
                  fontFamily: FONTS.body,
                  fontWeight: 600,
                }}
              >
                Built on Flow Blockchain
              </span>
            </div>
          </GlowPulse>
        </div>
      </div>
    </GradientBg>
  );
};
