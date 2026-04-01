import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS, FONTS } from "../styles";
import {
  GradientBg,
  FloatingParticles,
  SlideUp,
  ProgressBar,
} from "../components/Animations";

const VAULTS = [
  {
    name: "Available",
    amount: "₦125,400",
    icon: "💳",
    color: COLORS.primary,
    percent: 0.35,
  },
  {
    name: "Savings",
    amount: "₦340,000",
    icon: "🏦",
    color: COLORS.accentBlue,
    percent: 0.68,
  },
  {
    name: "Emergency",
    amount: "₦80,000",
    icon: "🛡️",
    color: COLORS.accentOrange,
    percent: 0.16,
  },
  {
    name: "Staking",
    amount: "₦54,600",
    icon: "📈",
    color: COLORS.accentPurple,
    percent: 0.45,
  },
];

export const VaultsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Total balance animation
  const balanceProgress = spring({
    frame: frame - 20,
    fps,
    config: { damping: 20, stiffness: 80, mass: 0.6 },
  });
  const displayBalance = Math.floor(
    interpolate(balanceProgress, [0, 1], [0, 600000])
  ).toLocaleString();

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
                background: COLORS.accentBlue,
                borderRadius: 1,
              }}
            />
            <span
              style={{
                color: COLORS.accentBlue,
                fontSize: 16,
                fontFamily: FONTS.body,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 3,
              }}
            >
              Multi-Vault System
            </span>
          </div>
        </SlideUp>

        {/* Total balance */}
        <SlideUp delay={10}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <p
              style={{
                fontSize: 18,
                color: COLORS.textMuted,
                fontFamily: FONTS.body,
                margin: "0 0 8px 0",
              }}
            >
              Total Balance
            </p>
            <h2
              style={{
                fontSize: 72,
                fontWeight: 800,
                color: COLORS.textWhite,
                fontFamily: FONTS.heading,
                margin: 0,
              }}
            >
              ₦{displayBalance}
            </h2>
          </div>
        </SlideUp>

        <SlideUp delay={18}>
          <p
            style={{
              fontSize: 22,
              color: COLORS.textMuted,
              fontFamily: FONTS.body,
              margin: "0 0 50px 0",
              textAlign: "center",
            }}
          >
            Automatically organized across 4 purpose-built vaults
          </p>
        </SlideUp>

        {/* Vault cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: 24,
            width: "100%",
            maxWidth: 1200,
          }}
        >
          {VAULTS.map((vault, i) => {
            const cardDelay = 30 + i * 10;
            const progress = spring({
              frame: frame - cardDelay,
              fps,
              config: { damping: 18, stiffness: 100, mass: 0.5 },
            });

            // Animate the bar fill
            const barProgress = spring({
              frame: frame - (cardDelay + 15),
              fps,
              config: { damping: 25, stiffness: 60, mass: 0.8 },
            });

            return (
              <div
                key={i}
                style={{
                  padding: "32px 24px",
                  borderRadius: 20,
                  background: COLORS.bgCard,
                  border: `1px solid ${vault.color}20`,
                  opacity: progress,
                  transform: `translateY(${interpolate(progress, [0, 1], [30, 0])}px)`,
                  textAlign: "center",
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 18,
                    background: `${vault.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 32,
                    margin: "0 auto 20px",
                  }}
                >
                  {vault.icon}
                </div>

                {/* Name */}
                <p
                  style={{
                    fontSize: 16,
                    color: COLORS.textMuted,
                    fontFamily: FONTS.body,
                    margin: "0 0 8px 0",
                    fontWeight: 500,
                  }}
                >
                  {vault.name}
                </p>

                {/* Amount */}
                <h3
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: COLORS.textWhite,
                    fontFamily: FONTS.heading,
                    margin: "0 0 20px 0",
                  }}
                >
                  {vault.amount}
                </h3>

                {/* Progress bar */}
                <ProgressBar
                  progress={vault.percent * barProgress}
                  width={200}
                  height={6}
                  color={vault.color}
                />
              </div>
            );
          })}
        </div>
      </div>
    </GradientBg>
  );
};
