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

interface IInitializationData
{
    Mode: FallServiceMode,
    /**
     * Min: 1, Max: 5.
     * Default: 1.
     * If 1 then check will be each frame, if 2 then check once per 2 frames.
     */
    FramesPerCheck?: number
}

export abstract class FallService
{
    public static Mode: FallServiceMode;
    public static FramesPerCheck: number;
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

    /**
     * @hidden
     */
    public static RemoveFromOtherGroup(characterOrPlayer: Player | Model)
    {
        //#region Leave from current fall group
        for (const [_, fallGroup] of this.FallGroups)
            fallGroup.RemoveFromGroup(characterOrPlayer);
        //#endregion
    }

    private static isInitialized = false;
    public static Init(initData: IInitializationData) 
    {
        assert(!this.isInitialized, "You already initialized FallService");
        this.isInitialized = true;

        this.Mode = initData.Mode;

        if (initData.FramesPerCheck)
            assert(!(initData.FramesPerCheck < 1 || initData.FramesPerCheck > 5), "Wrong FramesPerCheck value");

        this.FramesPerCheck = initData.FramesPerCheck ?? 1;
    }

    public static CharactersCustomData: Map<Model, IFallGroupOptions> = new Map();

    public static CharactersCDDestroyConnection: Map<Model, RBXScriptConnection> = new Map();
    public static PlayersCDDestroyConnections: Map<Player, RBXScriptConnection[]> = new Map();

    public static SetCustomData(characterOrPlayer: Player | Model, options: IFallGroupOptions | undefined)
    {
        if (characterOrPlayer.IsA("Player"))
        {
            let connections = this.PlayersCDDestroyConnections.get(characterOrPlayer);
            this.PlayersCDDestroyConnections.delete(characterOrPlayer);

            if (connections)
                for (const connection of connections)
                    connection.Disconnect();

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
                this.PlayersCDDestroyConnections.delete(characterOrPlayer);
            });

            this.PlayersCDDestroyConnections.set(characterOrPlayer, [characterAddedConnection, playerRemovedConnection]);
        } else
        {

            this.CharactersCDDestroyConnection.get(characterOrPlayer)?.Disconnect();
            this.CharactersCDDestroyConnection.delete(characterOrPlayer);

            if (!options) return;
            this.CharactersCustomData.set(characterOrPlayer, options);

            // Keep connection, and clear it if data set multiple times 
            // In case of parenting to nil (undefined) will triger too.. Currently it's roblox issue
            const connection = characterOrPlayer.AncestryChanged.Connect((_, parent) =>
            {
                if (parent) return;

                connection.Disconnect();
                this.CharactersCustomData.delete(characterOrPlayer);
            })
            this.CharactersCDDestroyConnection.set(characterOrPlayer, connection);
        }
    }
}