import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS, FONTS } from "../styles";
import {
  GradientBg,
  FloatingParticles,
  SlideUp,
  FadeIn,
} from "../components/Animations";

const PROBLEMS = [
  {
    icon: "😩",
    text: "Manually sending money every week",
    color: COLORS.accentRed,
  },
  {
    icon: "📉",
    text: "Forgetting to save consistently",
    color: COLORS.accentOrange,
  },
  {
    icon: "🔑",
    text: "Complex wallet setup & seed phrases",
    color: COLORS.accentPurple,
  },
  {
    icon: "⏰",
    text: "Repetitive DeFi tasks & approvals",
    color: COLORS.accentBlue,
  },
];

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <GradientBg>
      <FloatingParticles count={10} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: "0 120px",
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
                background: COLORS.accentRed,
                borderRadius: 1,
              }}
            />
            <span
              style={{
                color: COLORS.accentRed,
                fontSize: 16,
                fontFamily: FONTS.body,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 3,
              }}
            >
              The Problem
            </span>
          </div>
        </SlideUp>

        {/* Heading */}
        <SlideUp delay={15}>
          <h2
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: COLORS.textWhite,
              fontFamily: FONTS.heading,
              margin: 0,
              textAlign: "center",
              marginBottom: 60,
              lineHeight: 1.15,
            }}
          >
            Managing money on-chain
            <br />
            <span style={{ color: COLORS.textMuted }}>shouldn't be this hard</span>
          </h2>
        </SlideUp>

        {/* Problem cards */}
        <div
          style={{
            display: "flex",
            gap: 24,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {PROBLEMS.map((problem, i) => {
            const cardDelay = 35 + i * 12;
            const progress = spring({
              frame: frame - cardDelay,
              fps,
              config: { damping: 18, stiffness: 100, mass: 0.5 },
            });
            return (
              <div
                key={i}
                style={{
                  width: 380,
                  padding: "32px 28px",
                  borderRadius: 20,
                  background: COLORS.bgCard,
                  border: `1px solid ${problem.color}25`,
                  opacity: progress,
                  transform: `translateY(${interpolate(progress, [0, 1], [40, 0])}px)`,
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 16 }}>
                  {problem.icon}
                </div>
                <p
                  style={{
                    fontSize: 22,
                    color: COLORS.textLight,
                    fontFamily: FONTS.body,
                    margin: 0,
                    lineHeight: 1.4,
                    fontWeight: 500,
                  }}
                >
                  {problem.text}
                </p>
                {/* Animated strikethrough */}
                {frame > cardDelay + 40 && (
                  <div
                    style={{
                      position: "absolute",
                      left: 28,
                      right: 28,
                      top: "58%",
                      height: 3,
                      background: `${problem.color}60`,
                      borderRadius: 2,
                      width: `${interpolate(
                        frame - (cardDelay + 40),
                        [0, 15],
                        [0, 100],
                        { extrapolateRight: "clamp" }
                      )}%`,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </GradientBg>
  );
};
