import { IFallGroupOptions } from "types";
import { FallGroup } from "./FallGroup";

export enum FallServiceMode
{
    /**
     * Client calculates fall damage and applies it, and then server does it too. 
     * Best safe mode, but most expensive.
     */
    Double,
    /**
     * Server calculates fall damage and applies it.
     * Safe mode, but slow replication time, therefore causes "lags".
     */
    Server,
    /**
     * Client calculates fall damage and applies it.
     * Unsafe mode, but most cheap.
     */
    Client
}

export abstract class FallService
{
    public static Mode: FallServiceMode;
    public static FallGroups: Map<string, FallGroup> = new Map();

    public static CreateFallGroup(groupName: string, options?: IFallGroupOptions)
    {
        const fallGroup = new FallGroup({
            MinimumDistance: options?.MinimumDistance ?? 5,
            DamageMultiplier: options?.DamageMultiplier ?? 0.4,
            Materials: options?.Materials ?? {}
        });
        FallService.FallGroups.set(groupName, fallGroup);

        return fallGroup;
    }

    private static isInitialized = false;
    public static Init(mode: FallServiceMode) 
    {
        assert(!this.isInitialized, "You already initialized FallService");

        this.isInitialized = true;
        this.Mode = mode;
    }

    public static CharactersCustomData: Map<Model, IFallGroupOptions> = new Map();
    public static CharactersDestroyConnection: Map<Model, RBXScriptConnection> = new Map();

    public static PlayersCustomData: Map<Player, IFallGroupOptions> = new Map();
    public static PlayersDestroyConnections: Map<Player, RBXScriptConnection[]> = new Map();

    public static SetCustomData(characterOrPlayer: Player | Model, options: IFallGroupOptions | undefined)
    {
        if (characterOrPlayer.IsA("Player"))
        {
            let connections = this.PlayersDestroyConnections.get(characterOrPlayer);
            this.PlayersDestroyConnections.delete(characterOrPlayer);

            if (connections)
            {
                for (const connection of connections)
                    connection.Disconnect();
            }

            if (characterOrPlayer.Character)
                this.SetCustomData(characterOrPlayer, options);
            if (!options) return;

            const characterAddedConnection = characterOrPlayer.CharacterAdded.Connect((character) =>
            {
                this.SetCustomData(character, options);
            });

            const playerRemovedConnection = characterOrPlayer.AncestryChanged.Connect((_, parent) =>
            {
                if (parent) return;
                this.PlayersDestroyConnections.delete(characterOrPlayer);
            });

            this.PlayersDestroyConnections.set(characterOrPlayer, [characterAddedConnection, playerRemovedConnection]);
        } else
        {

            this.CharactersDestroyConnection.get(characterOrPlayer)?.Disconnect();
            this.CharactersDestroyConnection.delete(characterOrPlayer);

            if (!options) return;

            // Keep connection, and clear it if data set multiple times 
            // In case of parenting to nil (undefined) will triger too.. Currently it's roblox issue
            this.CharactersDestroyConnection.set(characterOrPlayer, characterOrPlayer.AncestryChanged.Connect((_, parent) =>
            {
                if (parent) return;
                this.CharactersCustomData.delete(characterOrPlayer);
            }));
        }
    }
}