// Will be cloned on server & client, so should adapt to this
// Here will be options & logic to handle fall for character
// Check automatically if script removed, and then stop handling fall damage and exit

import { HttpService, RunService } from "@rbxts/services";
import { IFallGroupOptions } from "types";

const character = script.Parent!.Parent!.Parent as Model; // module -> client/server script -> actor -> character

const optionsContainer = (script as ModuleScript & { Options: StringValue }).Options;
function GetOptions(): IFallGroupOptions
{
    return HttpService.JSONDecode(optionsContainer.Value) as IFallGroupOptions;
}

const connection = RunService.RenderStepped.ConnectParallel(() =>
{
    // If Server, then call OnFall bindable event on character's fall with damage
});