import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS, FONTS } from "../styles";
import {
  GradientBg,
  FloatingParticles,
  SlideUp,
} from "../components/Animations";

const TECH_STACK = [
  { name: "Flow Blockchain", desc: "Cadence 1.0 smart contracts", icon: "⛓️" },
  { name: "AI Engine", desc: "Claude / Gemini / OpenAI / Groq", icon: "🧠" },
  { name: "React + Vite", desc: "Modern frontend with TypeScript", icon: "⚛️" },
  { name: "Express + Prisma", desc: "Type-safe backend API", icon: "🔧" },
];

const CONTRACTS = [
  {
    name: "FlowMateAgent.cdc",
    desc: "User config, autonomy modes, limits",
    color: COLORS.primary,
  },
  {
    name: "VaultManager.cdc",
    desc: "Multi-vault CRUD & transfers",
    color: COLORS.accentBlue,
  },
  {
    name: "ScheduledTransactions.cdc",
    desc: "On-chain rule execution engine",
    color: COLORS.accentPurple,
  },
];

export const TechStackScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

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
        {/* Left - Tech stack */}
        <div
          style={{
            flex: 1,
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
                  background: COLORS.accentTeal,
                  borderRadius: 1,
                }}
              />
              <span
                style={{
                  color: COLORS.accentTeal,
                  fontSize: 16,
                  fontFamily: FONTS.body,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 3,
                }}
              >
                Under the Hood
              </span>
            </div>
          </SlideUp>

          <SlideUp delay={10}>
            <h2
              style={{
                fontSize: 52,
                fontWeight: 800,
                color: COLORS.textWhite,
                fontFamily: FONTS.heading,
                margin: "0 0 50px 0",
                lineHeight: 1.15,
              }}
            >
              Built with
              <br />
              <span style={{ color: COLORS.primary }}>production-grade</span>
              <br />
              technology
            </h2>
          </SlideUp>

          {/* Tech items */}
          {TECH_STACK.map((tech, i) => {
            const itemDelay = 25 + i * 10;
            const progress = spring({
              frame: frame - itemDelay,
              fps,
              config: { damping: 18, stiffness: 100, mass: 0.5 },
            });
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 20,
                  opacity: progress,
                  transform: `translateX(${interpolate(progress, [0, 1], [-20, 0])}px)`,
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: `${COLORS.bgCardLight}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                     flexShrink: 0,
                  }}
                >
                  {tech.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      color: COLORS.textWhite,
                      fontFamily: FONTS.body,
                    }}
                  >
                    {tech.name}
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      color: COLORS.textMuted,
                      fontFamily: FONTS.body,
                    }}
                  >
                    {tech.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right - Smart Contracts */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SlideUp delay={15}>
            <h3
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: COLORS.textWhite,
                fontFamily: FONTS.heading,
                margin: "0 0 12px 0",
              }}
            >
              On-Chain Contracts
            </h3>
            <p
              style={{
                fontSize: 16,
                color: COLORS.textMuted,
                fontFamily: FONTS.body,
                margin: "0 0 30px 0",
              }}
            >
              Deployed on Flow Testnet · 0xc26f3fa2883a46db
            </p>
          </SlideUp>

          {CONTRACTS.map((contract, i) => {
            const cDelay = 40 + i * 12;
            const progress = spring({
              frame: frame - cDelay,
              fps,
              config: { damping: 18, stiffness: 100, mass: 0.5 },
            });
            return (
              <div
                key={i}
                style={{
                  padding: "24px 28px",
                  borderRadius: 16,
                  background: COLORS.bgCard,
                  border: `1px solid ${contract.color}25`,
                  marginBottom: 16,
                  opacity: progress,
                  transform: `translateY(${interpolate(progress, [0, 1], [20, 0])}px)`,
                }}
              >
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 18,
                    fontWeight: 600,
                    color: contract.color,
                    marginBottom: 6,
                  }}
                >
                  📄 {contract.name}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    color: COLORS.textMuted,
                    fontFamily: FONTS.body,
                  }}
                >
                  {contract.desc}
                </div>
              </div>
            );
          })}

          {/* Terminal-style output */}
          {(() => {
            const termDelay = 80;
            const termProgress = spring({
              frame: frame - termDelay,
              fps,
              config: { damping: 20, stiffness: 80, mass: 0.6 },
            });
            return (
              <div
                style={{
                  marginTop: 16,
                  padding: "20px 24px",
                  borderRadius: 14,
                  background: "#000000",
                  border: `1px solid ${COLORS.bgCardLight}`,
                  opacity: termProgress,
                  fontFamily: FONTS.mono,
                  fontSize: 14,
                  color: COLORS.primary,
                  lineHeight: 1.7,
                }}
              >
                <span style={{ color: COLORS.textMuted }}>$</span> flow project deploy
                --network=testnet
                <br />
                <span style={{ color: COLORS.textMuted }}>✓</span> FlowMateAgent deployed
                <br />
                <span style={{ color: COLORS.textMuted }}>✓</span> VaultManager deployed
                <br />
                <span style={{ color: COLORS.textMuted }}>✓</span>{" "}
                ScheduledTransactions deployed
              </div>
            );
          })()}
        </div>
      </div>
    </GradientBg>
  );
};
