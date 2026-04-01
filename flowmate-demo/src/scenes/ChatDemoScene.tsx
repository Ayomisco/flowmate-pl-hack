import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS, FONTS } from "../styles";
import {
  GradientBg,
  FloatingParticles,
  SlideUp,
  Typewriter,
} from "../components/Animations";

// Simulated chat conversation
const MESSAGES: Array<{
  role: "user" | "agent";
  text: string;
  delay: number;
}> = [
  { role: "user", text: "Save ₦5,000 every Friday to my savings vault", delay: 15 },
  {
    role: "agent",
    text: "Done! I've created a recurring savings rule:\n→ ₦5,000 every Friday\n→ To: Savings Vault\n→ Next execution: This Friday",
    delay: 55,
  },
  { role: "user", text: "Also send ₦2,000 to John every Monday", delay: 120 },
  {
    role: "agent",
    text: "Scheduled! Recurring transfer set up:\n→ ₦2,000 to John (0x8a3f...)\n→ Every Monday at 9:00 AM\n→ Auto-executing in Assist mode ✓",
    delay: 155,
  },
];

export const ChatDemoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <GradientBg>
      <FloatingParticles count={8} />

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
        {/* Left side - description */}
        <div
          style={{
            flex: "0 0 400px",
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
                  background: COLORS.accentPurple,
                  borderRadius: 1,
                }}
              />
              <span
                style={{
                  color: COLORS.accentPurple,
                  fontSize: 16,
                  fontFamily: FONTS.body,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 3,
                }}
              >
                AI Agent
              </span>
            </div>
          </SlideUp>

          <SlideUp delay={12}>
            <h2
              style={{
                fontSize: 52,
                fontWeight: 800,
                color: COLORS.textWhite,
                fontFamily: FONTS.heading,
                margin: "0 0 20px 0",
                lineHeight: 1.15,
              }}
            >
              Just tell it
              <br />
              <span style={{ color: COLORS.primary }}>what you need</span>
            </h2>
          </SlideUp>

          <SlideUp delay={20}>
            <p
              style={{
                fontSize: 20,
                color: COLORS.textMuted,
                fontFamily: FONTS.body,
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Natural language commands. No forms. No buttons. 
              Your AI agent understands financial intent and executes 
              autonomously within your defined boundaries.
            </p>
          </SlideUp>
        </div>

        {/* Right side - chat mockup */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <ScaleInChat delay={10}>
            <div
              style={{
                background: COLORS.bgCard,
                borderRadius: 24,
                border: `1px solid ${COLORS.primary}15`,
                overflow: "hidden",
                boxShadow: `0 0 80px ${COLORS.primary}08, 0 20px 60px rgba(0,0,0,0.4)`,
              }}
            >
              {/* Chat header */}
              <div
                style={{
                  padding: "20px 28px",
                  borderBottom: `1px solid ${COLORS.bgCardLight}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                  }}
                >
                  🤖
                </div>
                <div>
                  <div
                    style={{
                      color: COLORS.textWhite,
                      fontSize: 17,
                      fontWeight: 600,
                      fontFamily: FONTS.body,
                    }}
                  >
                    FlowMate Agent
                  </div>
                  <div
                    style={{
                      color: COLORS.primary,
                      fontSize: 13,
                      fontFamily: FONTS.body,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: COLORS.primary,
                      }}
                    />
                    Assist Mode
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ padding: "24px 28px", minHeight: 380 }}>
                {MESSAGES.map((msg, i) => {
                  const msgProgress = spring({
                    frame: frame - msg.delay,
                    fps,
                    config: { damping: 20, stiffness: 120, mass: 0.4 },
                  });
                  if (msgProgress < 0.05) return null;
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: isUser ? "flex-end" : "flex-start",
                        marginBottom: 16,
                        opacity: msgProgress,
                        transform: `translateY(${interpolate(msgProgress, [0, 1], [15, 0])}px)`,
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "80%",
                          padding: "14px 20px",
                          borderRadius: isUser
                            ? "18px 18px 4px 18px"
                            : "18px 18px 18px 4px",
                          background: isUser
                            ? `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`
                            : COLORS.bgCardLight,
                          color: isUser ? COLORS.bgDark : COLORS.textLight,
                          fontSize: 16,
                          fontFamily: FONTS.body,
                          fontWeight: isUser ? 600 : 400,
                          lineHeight: 1.5,
                          whiteSpace: "pre-line",
                        }}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {frame > 45 && frame < 55 && (
                  <div style={{ display: "flex", gap: 6, padding: "10px 0" }}>
                    {[0, 1, 2].map((dot) => (
                      <div
                        key={dot}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: COLORS.textMuted,
                          opacity:
                            0.3 +
                            Math.sin((frame + dot * 8) * 0.3) * 0.5,
                        }}
                      />
                    ))}
                  </div>
                )}
                {frame > 145 && frame < 155 && (
                  <div style={{ display: "flex", gap: 6, padding: "10px 0" }}>
                    {[0, 1, 2].map((dot) => (
                      <div
                        key={dot}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: COLORS.textMuted,
                          opacity:
                            0.3 +
                            Math.sin((frame + dot * 8) * 0.3) * 0.5,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScaleInChat>
        </div>
      </div>
    </GradientBg>
  );
};

// Separate ScaleIn to avoid import conflict with renamed component
const ScaleInChat: React.FC<{
  children: React.ReactNode;
  delay?: number;
}> = ({ children, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 18, stiffness: 80, mass: 0.6 },
  });
  const scale = interpolate(progress, [0, 1], [0.92, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  return (
    <div style={{ transform: `scale(${scale})`, opacity }}>
      {children}
    </div>
  );
};
