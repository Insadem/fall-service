import { Signal } from "@rbxts/beacon";
import { HttpService } from "@rbxts/services";
import { FallService, FallServiceMode } from "FallService";
import { IFallGroup, IFallGroupOptions } from "types";

type FallHandler = ModuleScript & {
    server: Script,
    client: LocalScript
}

export class FallGroup implements IFallGroup
{
    private Characters: Map<Model, RBXScriptConnection> = new Map();
    private Players: Map<Player, RBXScriptConnection[]> = new Map();

    /**
     * @hidden
     */
    public RemoveFromGroup(characterOrPlayer: Player | Model)
    {
        if (characterOrPlayer.IsA("Player")) 
        {
            const connections = this.Players.get(characterOrPlayer);
            if (!connections) return;

            for (const connection of connections)
                connection.Disconnect();

            this.Players.delete(characterOrPlayer);
        } else
        {
            const connection = this.Characters.get(characterOrPlayer);
            if (!connection) return;

            connection.Disconnect();
            this.Characters.delete(characterOrPlayer);
        }
    }

    private _Options: Required<IFallGroupOptions> = undefined!; // Add setter, on options change apply them to all characters in this fall group 
    private set Options(options: Required<IFallGroupOptions>)
    {
        this._Options = options;

        //#region Reapply all options to characters
        const scriptNames = ["server", "client"]
        for (const [character, _] of this.Characters)
        {
            const actor = character.FindFirstChild("FallServiceActor") as Actor | undefined;
            if (!actor) continue;

            for (const scriptName of scriptNames)
            {
                const fallHandlerModule = actor.FindFirstChild(scriptName)?.FindFirstChild("FallHandler") as FallHandler | undefined;
                if (!fallHandlerModule) continue;

                const options = (fallHandlerModule.FindFirstChild("Options") as StringValue | undefined);
                if (!options) continue;

                options.Value = HttpService.JSONEncode(this.Options);
            }
        }
        //#endregion
    }

    private get Options() { return this._Options; }

    public OnCharacterFall: Signal<Model> = new Signal();
    public OnPlayerFall: Signal<Player> = new Signal();

    constructor(options: Required<IFallGroupOptions>)
    {
        this.Options = options;
    }

    Modificate(options: Required<IFallGroupOptions>)
    {
        this.Options = options;
    }

    Enable(character: Model)
    {
        if (this.Characters.has(character)) return;
        FallService.RemoveFromOtherGroup(character);

        const actor = new Instance("Actor");
        actor.Name = "FallServiceActor";
        actor.Parent = character;

        const fallHandlerModule = (script as unknown as ModuleScript & {
            "FallHandler": FallHandler
        })["FallHandler"].Clone();

        const serverScript = fallHandlerModule.server;
        serverScript.Parent = undefined;

        const clientScript = fallHandlerModule.client;
        clientScript.Parent = undefined;

        const options = new Instance("StringValue");
        options.Name = "Options";
        options.Value = options.Value = HttpService.JSONEncode(this.Options);
        options.Parent = fallHandlerModule;

        if (FallService.Mode == FallServiceMode.Server || FallService.Mode == FallServiceMode.Double)
        {
            const fallEvent = new Instance("BindableEvent");
            fallEvent.Name = "OnFall";
            fallEvent.Parent = serverScript;

            fallEvent.Event.Connect(() =>
            {
                this.OnCharacterFall.Fire(character);

                for (let [player, _] of this.Players)
                {
                    if (player.Character != character) continue;

                    this.OnPlayerFall.Fire(player);
                    break;
                };
            });

            fallHandlerModule.Clone().Parent = serverScript;
            serverScript.Parent = actor;
        }
        if (FallService.Mode == FallServiceMode.Client || FallService.Mode == FallServiceMode.Double)
        {
            fallHandlerModule.Parent = clientScript;
            clientScript.Parent = actor;
        }

        const connection = character.AncestryChanged.Connect((_, parent) =>
        {
            if (parent) return;

            connection.Disconnect();
            this.Characters.delete(character);
        });
        this.Characters.set(character, connection);
    }

    Disable(character: Model)
    {
        const connection = this.Characters.get(character);
        if (!connection) return;

        connection.Disconnect();
        this.Characters.delete(character);

        character.FindFirstChild("FallServiceActor")?.Destroy(); // Remove script from character
    }

    BindPlayer(player: Player, isInstantImpact: boolean = true)
    {
        if (this.Players.has(player)) return;
        FallService.RemoveFromOtherGroup(player);

        const characterAddedConnection = player.CharacterAdded.Connect((character) =>
        {
            this.Enable(character)
        });

        const playerRemovedConnection = player.AncestryChanged.Connect((_, parent) =>
        {
            if (parent) return;
            this.Players.delete(player);
        });

        this.Players.set(player, [characterAddedConnection, playerRemovedConnection]);
        if (isInstantImpact)
            if (player.Character) this.Enable(player.Character);
    }

    UnbindPlayer(player: Player, isInstantImpact: boolean = true)
    {
        if (!this.Players.has(player)) return;

        const connections = this.Players.get(player);
        if (!connections) return;

        for (const connection of connections)
            connection.Disconnect();

        this.Players.delete(player);

        if (isInstantImpact)
            if (player.Character) this.Disable(player.Character);
    };
}