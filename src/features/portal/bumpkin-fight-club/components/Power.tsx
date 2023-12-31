import React, { useEffect, useState } from "react";

import { InnerPanel } from "components/ui/Panel";
import { PIXEL_SCALE } from "features/game/lib/constants";
import { SUNNYSIDE } from "assets/sunnyside";

class PlayerPowerManager {
  private listener?: (power: number) => void;

  public set(power: number) {
    if (this.listener) {
      this.listener(power);
    }
  }

  public listen(cb: (power: number) => void) {
    this.listener = cb;
  }
}

export const playerPowerManager = new PlayerPowerManager();

export const Power: React.FC = () => {
  const [power, setPower] = useState(0);

  useEffect(() => {
    playerPowerManager.listen((power) => {
      setPower(power);
    });
  }, []);

  return (
    <InnerPanel
      className="fixed z-50 flex items-center p-1"
      style={{
        top: `${PIXEL_SCALE * 53}px`,
        left: `${PIXEL_SCALE * 5}px`,
      }}
    >
      <img
        src={SUNNYSIDE.icons.sword}
        style={{
          width: `${PIXEL_SCALE * 10}px`,
        }}
      />
      <span className="text-sm ml-1.5 mb-0.5">{power}</span>
    </InnerPanel>
  );
};
