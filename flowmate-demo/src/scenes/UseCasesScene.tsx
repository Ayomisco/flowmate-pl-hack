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

const USE_CASES = [
  {
    persona: "Amaka",
    role: "Emerging Middle Class",
    action: '"Save ₦2,500 every Friday"',
    result: "Builds ₦130,000/year on autopilot",
    icon: "👩🏾‍💼",
    color: COLORS.primary,
  },
  {
    persona: "Kunle",
    role: "Freelancer",
    action: '"Split income: 30% savings, 60% available, 10% emergency"',
    result: "Auto-allocates every deposit",
    icon: "👨🏾‍💻",
    color: COLORS.accentBlue,
  },
  {
    persona: "Chisom",
    role: "Web3 Native",
    action: '"DCA ₦5,000 into FLOW every Monday"',
    result: "Automated dollar-cost averaging",
    icon: "🧑🏾‍🔬",
    color: COLORS.accentPurple,
  },
];

export const UseCasesScene: React.FC = () => {
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
          padding: "0 100px",
          position: "relative",
          zIndex: 1,
        }}
      >
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
              Who It's For
            </span>
          </div>
        </SlideUp>

        <SlideUp delay={10}>
          <h2
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: COLORS.textWhite,
              fontFamily: FONTS.heading,
              margin: "0 0 60px 0",
              textAlign: "center",
              lineHeight: 1.15,
            }}
          >
            Built for{" "}
            <span style={{ color: COLORS.primary }}>real people</span>
          </h2>
        </SlideUp>

        {/* Use case cards */}
        <div
          style={{
            display: "flex",
            gap: 32,
            width: "100%",
            maxWidth: 1400,
            justifyContent: "center",
          }}
        >
          {USE_CASES.map((uc, i) => {
            const cardDelay = 25 + i * 15;
            const progress = spring({
              frame: frame - cardDelay,
              fps,
              config: { damping: 18, stiffness: 100, mass: 0.5 },
            });
            return (
              <div
                key={i}
                style={{
                  flex: "0 0 400px",
                  padding: "40px 32px",
                  borderRadius: 24,
                  background: COLORS.bgCard,
                  border: `1px solid ${uc.color}20`,
                  opacity: progress,
                  transform: `translateY(${interpolate(progress, [0, 1], [40, 0])}px) scale(${interpolate(progress, [0, 1], [0.95, 1])})`,
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      fontSize: 42,
                      width: 64,
                      height: 64,
                      borderRadius: 18,
                      background: `${uc.color}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {uc.icon}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: COLORS.textWhite,
                        fontFamily: FONTS.heading,
                      }}
                    >
                      {uc.persona}
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        color: uc.color,
                        fontFamily: FONTS.body,
                        fontWeight: 500,
                      }}
                    >
                      {uc.role}
                    </div>
                  </div>
                </div>

                {/* Command */}
                <div
                  style={{
                    padding: "14px 18px",
                    borderRadius: 12,
                    background: `${uc.color}08`,
                    border: `1px solid ${uc.color}15`,
                    marginBottom: 20,
                  }}
                >
                  <span
                    style={{
                      fontSize: 18,
                      color: COLORS.textLight,
                      fontFamily: FONTS.body,
                      fontStyle: "italic",
                      lineHeight: 1.4,
                    }}
                  >
                    {uc.action}
                  </span>
                </div>

                {/* Result */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      color: uc.color,
                      fontSize: 18,
                      fontWeight: 600,
                    }}
                  >
                    →
                  </div>
                  <span
                    style={{
                      fontSize: 16,
                      color: COLORS.textMuted,
                      fontFamily: FONTS.body,
                    }}
                  >
                    {uc.result}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GradientBg>
  );
};
