import { assign, createMachine, Interpreter, State } from "xstate";
import { Client, Room } from "colyseus.js";

import { CONFIG } from "lib/config";
import { OFFLINE_FARM } from "features/game/lib/landData";
import { GameState } from "features/game/types/game";
import { PortalName } from "features/game/types/portals";
import { PlazaRoomState } from "features/world/types/Room";
import { decodeToken } from "features/auth/actions/login";

import { claimArcadeToken } from "../actions/claimArcadeToken";
import { loadPortal } from "../actions/loadPortal";
import { hasReadRules } from "./utils";

const getJWT = () => {
  const code = new URLSearchParams(window.location.search).get("jwt");

  return code;
};

const getServer = () => {
  const code = new URLSearchParams(window.location.search).get("server");

  return code;
};

export interface Context {
  id: number;
  jwt: string;
  state: GameState;
  mmoServer?: Room<PlazaRoomState>;
}

export type PortalEvent =
  | { type: "START" }
  | { type: "CLAIM" }
  | { type: "RETRY" }
  | { type: "CONTINUE" };

export type PortalState = {
  value:
    | "initialising"
    | "error"
    | "idle"
    | "ready"
    | "unauthorised"
    | "loading"
    | "claiming"
    | "completed"
    | "rules";
  context: Context;
};

export type MachineInterpreter = Interpreter<
  Context,
  any,
  PortalEvent,
  PortalState
>;

export type PortalMachineState = State<Context, PortalEvent, PortalState>;

export const portalMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QAcD2AnALgQwDYFlsBjACwEsA7MAOkrMzLzNkqgGIBtABgF1EVULBqgr8QAD0QBGAOwAWagDYAHPOUBWOQE5F6nZoA0IAJ6I5yxdQBMV3YsUyAzFyl6rAX3dG0WPIVKUNHQMTCwU7BxSfEggaEJkImKSCLIKKmqa+vpyRqYI6irWtuoyio5aWlxa2p7eGDgExORUtBSY6KgQAK5EwhScvGJx9AmiMcnKVjLUjnqOilzaujoyuYhlClyl6pNZUvO1sfV+TYGt7Z09fZxRQ4IjieOIk9OzWvOLWQ5rCOUK8o4rJMuGVlFwrItDj4Gv5mkE2h1ur1RpwrNEBPFHqAJlMZnMFks9N8TIh1FxlNY5IDFFZ1FY5No5IoocdGgEWrhUNgIKw2BARPCAG6oADWNGhJ3ZNE53NYCEowqI2D63B4qrumLG2NJLmocxkZK4RuNIJ+6j01BNUi08i2VPULN8bLh1BlPPCbDA6A66GoyFwyoAZhgALZ+1mws5uuUK1BKlW8dUxYZ9JI6qR694Gk0mxRmqQZw0ueY23SqR0w04tdBdXBwNgAYQA8gA5AAqAEkWwBVACiSYxDy1EmedMtMjBpV06kB1rNykceu2Fj0skUTIrkpd6DA3OMjYAMgBBDv4AdHTVplKuSxSKrlLSyKyOcpWH7KDPaCpaEqKLTKOQQRkTdnTOIgAzIENeX5FpYzFcMnUjFpwOwSCYwoRVlVGVVzxTUYrzJQssyLHM8xJBAISsSlv3KApHzpECkJoFC0I9L0fT9ANMGDdAwwlUDkIgqDwnlDC4ywkQcMGZN7lTJ58l1fUSNzH5HCkSwbDsG11FkFwCkYqtmNQEN-TATBIEbVtOx7ftpMHOTtWvWklHvMkXnsKRVI0SlqUcJw1ILB0vCORDDOodiMDYAAlXs2yigBNXDZPw+TNApEF6UqF873XHJyPmRcZGKA0ZGqCcymZQ4KE6OA7lCqUNSHK8AFoyLyZr1Gob8dC2a1qmUaogrqeqXWCRhcGYVhGockcEDkN9yPMDNSxKcoPwsKohpCyspXORErhS+zDtm+wtGoeQKjBewrCkIFlHnLhzuKHYHCmW7lAM3bo3CabjuSF9phnW7AOykEGTNeauu2TR1zWm1Pu3Wtapky95IqBQbtUZxrve+7yJpSwAVsFwtmJ4Dgv4pjqB3PdfqxWbbpkaZsyNcxHAZFQfiWagLBeJkcvXEEEbAoSppRpr5JfKigfpLhQdyn5rWmFbZmxgsNDkYXkOM0zzIgOnh2SdHrCkLGQRpXGvM6onyXkO9NYpiMwoi9ADavU7zq-K6Lbus0jR57M1JsYmmUq4adpdLoKGwLpMBIDBmEgN3Jb8vUg5BtSwbyvJzAUORticf9TYWH9PE8IA */
  id: "portalMachine",
  initial: "initialising",
  context: {
    id: 0,
    jwt: getJWT(),
    state: CONFIG.API_URL ? undefined : OFFLINE_FARM,
    completeAcknowledged: false,
  },
  states: {
    initialising: {
      always: [
        {
          target: "unauthorised",
          // TODO: Also validate token
          cond: (context) => !!CONFIG.API_URL && !context.jwt,
        },
        {
          target: "loading",
        },
      ],
    },
    introduction: {
      always: [
        { target: "rules", cond: () => !hasReadRules() },
        {
          target: "completed",
          cond: (c) => {
            const todayKey = new Date().toISOString().slice(0, 10);

            const portals = (c.state?.portals ??
              {}) as Required<GameState>["portals"];

            const portal = portals[CONFIG.PORTAL_APP as PortalName];

            const alreadyMintedToday =
              portal?.history[todayKey]?.arcadeTokensMinted ?? 0;

            return alreadyMintedToday > 0;
          },
        },
        {
          target: "ready",
        },
      ],
    },
    loading: {
      id: "loading",
      invoke: {
        src: async (context) => {
          let game;
          let farmId;
          if (!CONFIG.API_URL) {
            game = OFFLINE_FARM;
            farmId = 86;
          } else {
            farmId = decodeToken(context.jwt as string).farmId;
            game = (
              await loadPortal({
                portalId: CONFIG.PORTAL_APP,
                token: context.jwt as string,
              })
            ).game;
          }

          // Join the MMO Server
          let mmoServer: Room<PlazaRoomState> | undefined;
          const serverName = getServer() ?? "main";
          const mmoUrl = CONFIG.ROOM_URL;

          if (serverName && mmoUrl) {
            const client = new Client(mmoUrl);

            mmoServer = await client?.joinOrCreate<PlazaRoomState>(serverName, {
              sceneId: "bumpkin_fight_club",
              bumpkin: game?.bumpkin,
              farmId,
              experience: game.bumpkin?.experience ?? 0,
            });
          }

          return { game, mmoServer, farmId };
        },
        onDone: [
          {
            target: "introduction",
            actions: assign({
              state: (_: any, event) => event.data.game,
              mmoServer: (_: any, event) => event.data.mmoServer,
              id: (_: any, event) => event.data.farmId,
            }),
          },
        ],
        onError: {
          target: "error",
        },
      },
    },
    rules: {
      on: {
        CONTINUE: {
          target: "introduction",
        },
      },
    },
    ready: {
      on: {
        CLAIM: {
          target: "claiming",
        },
      },
    },
    claiming: {
      id: "claiming",
      invoke: {
        src: async (context) => {
          const { game } = await claimArcadeToken({
            token: context.jwt as string,
          });

          return { game };
        },
        onDone: [
          {
            target: "completed",
            actions: assign({
              state: (_: any, event) => event.data.game,
            }),
          },
        ],
        onError: [
          {
            target: "error",
          },
        ],
      },
    },
    completed: {
      on: {
        CONTINUE: {
          target: "ready",
        },
      },
    },
    error: {
      on: {
        RETRY: {
          target: "initialising",
        },
      },
    },
    unauthorised: {},
  },
});
