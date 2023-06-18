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
    private Characters: Map<Model, Script> = new Map();
    private Players: Map<Player, RBXScriptConnection> = new Map();
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

                fallHandlerModule.SetAttribute("Options", HttpService.JSONEncode(this.Options));
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

        fallHandlerModule.SetAttribute("Options", HttpService.JSONEncode(this.Options));
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

        // Connect to bind event inside script, and fire OnCharacterFall + OnPlayerFall (if player bind declared).
    }

    Disable(character: Model)
    {
        let fallHandlerScript = this.Characters.get(character);
        fallHandlerScript?.Destroy(); // Remove script from character
    }

    BindPlayer(player: Player, isInstantImpact: boolean)
    {
        if (this.Players.has(player)) return;

        this.Players.set(player, player.CharacterAdded.Connect(this.Enable));
        if (isInstantImpact)
            if (player.Character) this.Enable(player.Character);
    }

    UnbindPlayer(player: Player, isInstantImpact: boolean)
    {
        if (!this.Players.has(player)) return;

        this.Players.get(player)!.Disconnect();
        this.Players.delete(player);

        if (isInstantImpact)
            if (player.Character) this.Disable(player.Character);
    };
}