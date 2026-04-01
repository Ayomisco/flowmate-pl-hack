import { Composition } from "remotion";
import { FlowMateDemo } from "./FlowMateDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="FlowMateDemo"
        component={FlowMateDemo}
        durationInFrames={30 * 75} // 75 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
