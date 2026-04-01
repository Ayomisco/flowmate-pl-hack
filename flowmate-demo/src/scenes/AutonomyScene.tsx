import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS, FONTS } from "../styles";
import {
  GradientBg,
  FloatingParticles,
  SlideUp,
} from "../components/Animations";

const MODES = [
  {
    name: "Manual",
    desc: "Agent suggests, you approve each action",
    icon: "🖐️",
    color: COLORS.accentBlue,
    level: 1,
  },
  {
    name: "Assist",
    desc: "Agent confirms before executing",
    icon: "🤝",
    color: COLORS.accentOrange,
    level: 2,
  },
  {
    name: "Autopilot",
    desc: "Agent executes immediately, notifies after",
    icon: "🚀",
    color: COLORS.primary,
    level: 3,
  },
];

const RULES = [
  {
    label: "Save ₦5,000 every Friday",
    type: "Savings",
    status: "Active",
    next: "Apr 4, 9:00 AM",
    color: COLORS.primary,
  },
  {
    label: "Send ₦2,000 to John weekly",
    type: "Transfer",
    status: "Active",
    next: "Apr 7, 9:00 AM",
    color: COLORS.accentBlue,
  },
  {
    label: "Split salary 30/60/10",
    type: "Auto-Allocate",
    status: "Waiting",
    next: "On next deposit",
    color: COLORS.accentPurple,
  },
  {
    label: "DCA ₦10,000 FLOW monthly",
    type: "Swap",
    status: "Active",
    next: "May 1, 12:00 AM",
    color: COLORS.accentOrange,
  },
];

export const AutonomyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Mode selector spotlight: cycles through modes
  const activeMode = frame < 60 ? 0 : frame < 100 ? 1 : 2;

  return (
    <GradientBg>
      <FloatingParticles count={10} />

      <div
        style={{
          display: "flex",
          height: "100%",
          padding: "60px 100px",
          gap: 60,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Left - Autonomy Modes */}
        <div
          style={{
            flex: "0 0 480px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
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
                  background: COLORS.accentOrange,
                  borderRadius: 1,
                }}
              />
              <span
                style={{
                  color: COLORS.accentOrange,
                  fontSize: 16,
                  fontFamily: FONTS.body,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 3,
                }}
              >
                Your Control
              </span>
            </div>
          </SlideUp>

          <SlideUp delay={12}>
            <h2
              style={{
                fontSize: 48,
                fontWeight: 800,
                color: COLORS.textWhite,
                fontFamily: FONTS.heading,
                margin: "0 0 12px 0",
                lineHeight: 1.15,
              }}
            >
              Choose your
              <br />
              <span style={{ color: COLORS.primary }}>autonomy level</span>
            </h2>
          </SlideUp>

          <SlideUp delay={18}>
            <p
              style={{
                fontSize: 18,
                color: COLORS.textMuted,
                fontFamily: FONTS.body,
                margin: "0 0 40px 0",
                lineHeight: 1.5,
              }}
            >
              Three modes that match your comfort level. Change anytime.
            </p>
          </SlideUp>

          {/* Mode cards */}
          {MODES.map((mode, i) => {
            const cardDelay = 30 + i * 12;
            const progress = spring({
              frame: frame - cardDelay,
              fps,
              config: { damping: 18, stiffness: 100, mass: 0.5 },
            });
            const isActive = activeMode === i;
            return (
              <div
                key={i}
                style={{
                  padding: "20px 24px",
                  borderRadius: 16,
                  background: isActive ? `${mode.color}12` : COLORS.bgCard,
                  border: `2px solid ${isActive ? mode.color : `${COLORS.bgCardLight}`}`,
                  marginBottom: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  opacity: progress,
                  transform: `translateX(${interpolate(progress, [0, 1], [-30, 0])}px)`,
                  transition: "background 0.3s, border 0.3s",
                }}
              >
                <span style={{ fontSize: 30 }}>{mode.icon}</span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: isActive ? mode.color : COLORS.textWhite,
                      fontFamily: FONTS.heading,
                    }}
                  >
                    {mode.name}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: COLORS.textMuted,
                      fontFamily: FONTS.body,
                    }}
                  >
                    {mode.desc}
                  </div>
                </div>
                {isActive && (
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: mode.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      color: COLORS.bgDark,
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right - Active Rules */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SlideUp delay={25}>
            <h3
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: COLORS.textWhite,
                fontFamily: FONTS.heading,
                margin: "0 0 24px 0",
              }}
            >
              Active Financial Rules
            </h3>
          </SlideUp>

          {RULES.map((rule, i) => {
            const ruleDelay = 50 + i * 12;
            const progress = spring({
              frame: frame - ruleDelay,
              fps,
              config: { damping: 18, stiffness: 100, mass: 0.5 },
            });
            return (
              <div
                key={i}
                style={{
                  padding: "22px 24px",
                  borderRadius: 16,
                  background: COLORS.bgCard,
                  border: `1px solid ${rule.color}20`,
                  marginBottom: 14,
                  opacity: progress,
                  transform: `translateX(${interpolate(progress, [0, 1], [30, 0])}px)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: COLORS.textWhite,
                      fontFamily: FONTS.body,
                      marginBottom: 4,
                    }}
                  >
                    {rule.label}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: COLORS.textMuted,
                      fontFamily: FONTS.body,
                    }}
                  >
                    {rule.type} · Next: {rule.next}
                  </div>
                </div>
                <div
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    background: `${rule.status === "Active" ? COLORS.primary : COLORS.accentOrange}18`,
                    color:
                      rule.status === "Active"
                        ? COLORS.primary
                        : COLORS.accentOrange,
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: FONTS.body,
                  }}
                >
                  {rule.status}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GradientBg>
  );
};
