# Crowd Actions JSON — Guide for Game Designers

This document explains the JSON structures stored in `version.crowd.actions` and
`version.crowd.mappings`. Use these files in the admin panel's JsonEditor to
compose and maintain crowd-driven gameplay behavior.

Purpose summary

- Triggers: define when a crowd action should be considered (platform events,
  chat messages, donations/cheers, subscriptions, etc.). Triggers are the
  conditions observed by the system that can cause a crowd action to run.
- Chat Commands: define chat-exposed commands (name, args, cooldowns,
  restrictions). Commands are executable by viewers (or by the system) and are
  used to interact with the game.
- Crowd Action Mappings: link an `identifier` to a set of `triggers` and the
  `commands` that implement the action. Mappings are the versioned glue used by
  the game runtime to map platform events to in-game effects.

High-level intent (how designers should think about these files)

- `version.crowd.actions` contains the canonical list of commands provided by
  your game version. Think of it as the command catalogue — reusable, named,
  and described.
- `version.crowd.mappings` contains the actionable mappings that say: "when X
  happens (trigger), run Y (commands)". Mappings can reference commands from
  the actions file or include variations specific to a mapping/version.

Type references

- `ChatCommand` type: [/app-shared-types/src/sg/crowd-actions/chat-command.ts](/app-shared-types/src/sg/crowd-actions/chat-command.ts#L1)
- `Argument` type: [/app-shared-types/src/sg/crowd-actions/argument.ts](/app-shared-types/src/sg/crowd-actions/argument.ts#L1)
- `ArgumentType` enum: [/app-shared-types/src/sg/crowd-actions/argument-type.ts](/app-shared-types/src/sg/crowd-actions/argument-type.ts#L1)
- `CrowdActionMapping`: [/app-shared-types/src/sg/crowd-actions/crowd-action-mapping.ts](/app-shared-types/src/sg/crowd-actions/crowd-action-mapping.ts#L1)
- `GameActionTrigger`: [/app-shared-types/src/sg/games/game-action-trigger.ts](/app-shared-types/src/sg/games/game-action-trigger.ts#L1)
- Trigger type catalogue: [/app-api/src/modules/sg/core/types/trigger-type.type.ts](/app-api/src/modules/sg/core/types/trigger-type.type.ts#L1)

Field reference — ChatCommand

- `name` (string): unique command name used by the system. Example: `spin`.
- `aliases` (string[]): alternative names viewers can type.
- `description` (string): short human-friendly description.
- `args` (Argument[]): list of arguments. Fields:
  - `key` (string): argument identifier.
  - `type` (ArgumentType numeric enum): 1=None, 2=String, 3=Integer, 4=Float, 5=Boolean.
  - `required` (boolean): whether argument is mandatory.
  - `defaultValue` (any, optional): fallback value.
- `global_cooldown` (number): cooldown in seconds applied to the whole channel.
- `user_cooldown` (number): cooldown in seconds per user.
- `admin_only` (boolean): restricts usage to admins/moderators.
- `is_enabled` (boolean): toggle to enable/disable the command.

Note about `CrowdAction.identifier`

- Each `CrowdAction` object also contains an `identifier` (string) which is the
  stable id used by the game runtime and by mappings to reference actions. In
  the seed example `FAKEGOTCHI_METADATA` you can see the pattern: the
  `crowdActions` array contains actions with `identifier` values and the
  `mappings` entries use the same identifiers to link triggers to those
  actions. See the seed for reference: [/app-api/src/database/seeds/sg/dev/6-dev-fakegotchi.seed.ts](/app-api/src/database/seeds/sg/dev/6-dev-fakegotchi.seed.ts#L1).

Field reference — CrowdActionMapping

- `identifier` (string): unique id for this crowd action mapping (used in-game).
- `triggers` (GameActionTrigger[]): when this mapping can trigger. A trigger
  contains:
  - `platform` (ConnectionPlatform / string): platform where the trigger comes from (e.g. `twitch`, `youtube`). See [connection-platform](/app-shared-types/src/sg/games/connection-platform.ts#L1).
  - `trigger_type` (string): the trigger key from the trigger catalogue (e.g. `twitch-cheer`, `twitch-message`). Validate against the trigger type catalogue.
  - `conditions` (any): free-form object describing trigger specifics. The system expects different keys depending on `trigger_type` (e.g. `{ "min_bits": 100 }` for bit-based triggers or `{ "match": "!spin", "case_sensitive": false }` for message matchers).
  - `is_enabled` (boolean): enable/disable this trigger.
- `commands` (ChatCommand[]): list of commands executed when the mapping fires. Commands may be full definitions or minimal copies referencing canonical items from `version.crowd.actions`.

Practical rules and recommendations

- Use `snake_case` for property names (fields are read by backend in that shape).
- Prefer reusing canonical commands in `version.crowd.actions` and reference
  them in mappings by copying the minimal definition; this makes reuse clear.
- Always use the numeric values from `ArgumentType` in saved JSON.
- Validate `trigger_type` values against the trigger catalog in the project.
- Keep `identifier` values unique per game version.

Common mistakes to avoid

- Using string labels for `Argument.type` instead of enum numbers.
- Omitting `aliases` or setting it to `null` (use empty array `[]` instead).
- Wrong keys in `conditions` for a given `trigger_type` (document the expected condition fields inline when creating custom matchers).

Examples

-- Scenario: Pet Virtual

- [actions.json](/docs/examples/pet-virtual/actions.json)
- [mappings.json](/docs/examples/pet-virtual/mappings.json)

-- Scenario: Arena

- [actions.json](/docs/examples/arena/actions.json)
- [mappings.json](/docs/examples/arena/mappings.json)

-- Scenario: RPG

- [actions.json](/docs/examples/rpg/actions.json)
- [mappings.json](/docs/examples/rpg/mappings.json)
