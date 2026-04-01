import React from "react";
import { Sequence, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { IntroScene } from "./scenes/IntroScene";
import { ProblemScene } from "./scenes/ProblemScene";
import { SolutionScene } from "./scenes/SolutionScene";
import { ChatDemoScene } from "./scenes/ChatDemoScene";
import { VaultsScene } from "./scenes/VaultsScene";
import { AutonomyScene } from "./scenes/AutonomyScene";
import { TechStackScene } from "./scenes/TechStackScene";
import { UseCasesScene } from "./scenes/UseCasesScene";
import { ClosingScene } from "./scenes/ClosingScene";

/*
 * FlowMate Demo Video - Scene Timeline (75 seconds @ 30fps = 2250 frames)
 *
 * Scene 1: Intro / Title Card         →  0–300   (0s–10s)
 * Scene 2: The Problem                →  270–570  (9s–19s)
 * Scene 3: The Solution / Features    →  540–810  (18s–27s)
 * Scene 4: AI Chat Demo               →  780–1080 (26s–36s)
 * Scene 5: Multi-Vault System         →  1050–1320 (35s–44s)
 * Scene 6: Autonomy & Rules           →  1290–1590 (43s–53s)
 * Scene 7: Tech Stack & Contracts     →  1560–1830 (52s–61s)
 * Scene 8: Use Cases / Personas       →  1800–2040 (60s–68s)
 * Scene 9: Closing CTA                →  2010–2250 (67s–75s)
 *
 * Scenes overlap by 30 frames for smooth cross-fade transitions
 */

const SCENES = [
  { component: IntroScene, from: 0, duration: 300 },
  { component: ProblemScene, from: 270, duration: 300 },
  { component: SolutionScene, from: 540, duration: 270 },
  { component: ChatDemoScene, from: 780, duration: 300 },
  { component: VaultsScene, from: 1050, duration: 270 },
  { component: AutonomyScene, from: 1290, duration: 300 },
  { component: TechStackScene, from: 1560, duration: 270 },
  { component: UseCasesScene, from: 1800, duration: 240 },
  { component: ClosingScene, from: 2010, duration: 240 },
];

const TRANSITION_FRAMES = 30;

const SceneWithTransition: React.FC<{
  children: React.ReactNode;
  from: number;
  duration: number;
}> = ({ children, from, duration }) => {
  const frame = useCurrentFrame();
  const sceneFrame = frame - from;

  // Fade in at start
  const fadeIn = interpolate(sceneFrame, [0, TRANSITION_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out at end
  const fadeOut = interpolate(
    sceneFrame,
    [duration - TRANSITION_FRAMES, duration],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
      }}
    >
      {children}
    </div>
  );
};

export const FlowMateDemo: React.FC = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#0A0E17",
        position: "relative",
      }}
    >
      {SCENES.map((scene, i) => (
        <Sequence
          key={i}
          from={scene.from}
          durationInFrames={scene.duration}
          name={scene.component.name || `Scene ${i + 1}`}
        >
          <SceneWithTransition from={scene.from} duration={scene.duration}>
            <scene.component />
          </SceneWithTransition>
        </Sequence>
      ))}
    </div>
  );
};
