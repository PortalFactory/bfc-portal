import { SceneId } from "features/world/mmoMachine";
import { BaseScene } from "features/world/scenes/BaseScene";
import { npcModalManager } from "features/world/ui/NPCModals";
import { Player } from "features/world/types/Room";
import { interactableModalManager } from "features/world/ui/InteractableModals";
import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { NPCName } from "lib/npcs";
import { hasFeatureAccess } from "lib/flags";

import mapJson from "assets/bumpkin-fight-club/map.json";

import { playerModalManager } from "./PlayerModal";
import { playerPowerManager } from "./Power";

export class PortalScene extends BaseScene {
  sceneId: SceneId = "bumpkin_fight_club";

  constructor() {
    super({
      name: "bumpkin_fight_club",
      map: {
        json: mapJson,
        tilesetUrl: "tileset-extruded.png",
        padding: [1, 2],
      },
      player: {
        spawn: {
          x: 240,
          y: 255,
        },
      },
      audio: { fx: { walk_key: "dirt_footstep" } },
    });
  }

  preload() {
    super.preload();

    // Ambience SFX
    if (!this.sound.get("nature_1")) {
      const nature1 = this.sound.add("nature_1");
      nature1.play({ loop: true, volume: 0.01 });
    }

    // Shut down the sound when the scene changes
    this.events.once("shutdown", () => {
      this.sound.getAllPlaying().forEach((sound) => {
        sound.destroy();
      });
    });
  }

  async create() {
    super.create();

    if (this.mmoServer) {
      // this.mmoServer.state.actions.onAdd(async (action) => {});
    }
  }

  update(time: number, delta: number) {
    super.update(time, delta);

    this.updatePower();
  }

  updatePower() {
    if (!this.mmoServer) return;

    this.mmoServer.state.players.forEach((player, sessionId) => {
      if (this.playerEntities[sessionId]) {
        this.playerEntities[sessionId].power = player.power;
      } else if (sessionId === this.mmoServer.sessionId && this.currentPlayer) {
        this.currentPlayer.power = player.power;
        playerPowerManager.set(player.power);
      }
    });
  }

  createPlayer({
    x,
    y,
    farmId,
    username,
    isCurrentPlayer,
    clothing,
    npc,
    experience = 0,
  }: {
    isCurrentPlayer: boolean;
    x: number;
    y: number;
    farmId: number;
    username?: string;
    clothing: Player["clothing"];
    npc?: NPCName;
    experience?: number;
  }): BumpkinContainer {
    const defaultClick = () => {
      const distance = Phaser.Math.Distance.BetweenPoints(
        entity,
        this.currentPlayer as BumpkinContainer
      );

      if (distance > 50) {
        entity.speak("You are too far away");
        return;
      }

      if (npc) {
        npcModalManager.open(npc);
      } else {
        if (farmId !== this.id) {
          playerModalManager.open({
            id: farmId,
            clothing,
            experience,
          });
        }
      }
    };

    const entity = new BumpkinContainer({
      scene: this,
      x,
      y,
      clothing,
      name: npc,
      onClick: defaultClick,
    });

    if (!npc) {
      const nameTag = this.createPlayerText({
        x: 0,
        y: 0,
        text: username ? username : `#${farmId}`,
      });
      nameTag.name = "nameTag";
      entity.add(nameTag);
    }

    // Is current player
    if (isCurrentPlayer) {
      this.currentPlayer = entity;

      // (this.currentPlayer.body as Phaser.Physics.Arcade.Body).width = 10;
      (this.currentPlayer.body as Phaser.Physics.Arcade.Body)
        .setOffset(3, 10)
        .setSize(10, 8)
        .setCollideWorldBounds(true);

      (this.currentPlayer.body as Phaser.Physics.Arcade.Body).setAllowRotation(
        false
      );

      // Follow player with camera
      this.cameras.main.startFollow(this.currentPlayer);

      // Callback to fire on collisions
      this.physics.add.collider(
        this.currentPlayer,
        this.colliders as Phaser.GameObjects.Group,
        // Read custom Tiled Properties
        async (obj1, obj2) => {
          const id = (obj2 as any).data?.list?.id;

          // See if scene has registered any callbacks to perform
          const cb = this.onCollision[id];
          if (cb) {
            cb(obj1, obj2);
          }

          // Change scenes
          const warpTo = (obj2 as any).data?.list?.warp;
          if (
            warpTo &&
            (warpTo !== "beach" || hasFeatureAccess(this.gameState, "BEACH"))
          ) {
            this.currentPlayer?.stopSpeaking();
            this.cameras.main.fadeOut(1000);

            this.cameras.main.on(
              "camerafadeoutcomplete",
              () => {
                this.switchToScene = warpTo;
              },
              this
            );
          }

          const interactable = (obj2 as any).data?.list?.open;
          if (interactable) {
            interactableModalManager.open(interactable);
          }
        }
      );

      this.physics.add.overlap(
        this.currentPlayer,
        this.triggerColliders as Phaser.GameObjects.Group,
        (obj1, obj2) => {
          // You can access custom properties of the trigger object here
          const id = (obj2 as any).data?.list?.id;

          // See if scene has registered any callbacks to perform
          const cb = this.onCollision[id];
          if (cb) {
            cb(obj1, obj2);
          }
        }
      );
    } else {
      (entity.body as Phaser.Physics.Arcade.Body)
        .setSize(16, 20)
        .setOffset(0, 0);
    }

    return entity;
  }
}
