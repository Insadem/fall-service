export interface IFallGroupOptions 
{
    MinimumDistance?: number,
    DamageMultiplier?: number,
    Materials?: {
        [materialName: string]: number
    }
}

export interface IFallGroup
{
    /**
     * Modificate fall group
     */
    Modificate: (options: Required<IFallGroupOptions>) => void,
    /**
    * Enable fall damage for character
    */
    Enable: (character: Model) => void,
    /**
     * Disable fall damage for character
     */
    Disable: (character: Model) => void,
    /**
     * Bind enable fall damage for player's character.
     * @param isInstantImpact enable fall damage if character is already spawned?
     */

    BindPlayer: (player: Player, isInstantImpact: boolean) => void,
    /**
     * Unbind enable fall damage for player's character.
     * @param isInstantImpact disable fall damage if character is already spawned?
     */
    UnbindPlayer: (player: Player, isInstantImpact: boolean) => void
}