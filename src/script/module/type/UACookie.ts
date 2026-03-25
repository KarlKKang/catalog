export interface UACookie {
    readonly browser?: {
        readonly name?: string | undefined;
        readonly version?: string | undefined;
    };
    readonly device?: {
        readonly model?: string | undefined;
        readonly vendor?: string | undefined;
    };
    readonly os?: {
        readonly name?: string | undefined;
        readonly version?: string | undefined;
    };
}
