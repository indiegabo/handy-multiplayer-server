export const TriggerTypesConfig = {
    // ============= TWITCH TRIGGERS =============
    'twitch-cheer': {
        label: 'Bits (Cheer)',
        description: 'When a viewer sends bits in the chat',
        icon: 'twitch-bits',
        platform: 'twitch',
    },

    'twitch-subscription': {
        label: 'New Subscription',
        description: 'When a viewer subscribes to the channel for the first time',
        icon: 'twitch-sub',
        platform: 'twitch',
    },

    'twitch-resub': {
        label: 'Subscription Renewal',
        description: 'When a viewer renews their subscription',
        icon: 'twitch-resub',
        platform: 'twitch',
    },

    'twitch-subgift': {
        label: 'Gift Subscription',
        description: 'When a viewer gifts a subscription',
        icon: 'twitch-gift',
        platform: 'twitch',
    },

    'twitch-submysterygift': {
        label: 'Mystery Gift',
        description: 'When a viewer sends mystery gifts of subscriptions',
        icon: 'twitch-mysterygift',
        platform: 'twitch',
    },

    'twitch-giftpaidupgrade': {
        label: 'Gift Upgrade',
        description: 'When a gifted subscription is converted to a regular subscription',
        icon: 'twitch-gift-upgrade',
        platform: 'twitch',
    },

    'twitch-anongiftpaidupgrade': {
        label: 'Anonymous Gift Upgrade',
        description: 'When an anonymous gifted subscription is converted to a regular subscription',
        icon: 'twitch-gift-upgrade',
        platform: 'twitch',
    },

    'twitch-primepaidupgrade': {
        label: 'Prime Upgrade',
        description: 'When a Prime subscription is converted to a regular subscription',
        icon: 'twitch-prime-upgrade',
        platform: 'twitch',
    },
    'twitch-follow': {
        label: 'New Follower',
        description: 'When a viewer follows the channel',
        icon: 'twitch-follow',
        platform: 'twitch',
    },

    'twitch-redeem': {
        label: 'Reward Redemption',
        description: 'When a viewer redeems a reward',
        icon: 'twitch-reward',
        platform: 'twitch',
    },

    'twitch-raid': {
        label: 'Raid',
        description: 'When another channel raids your channel',
        icon: 'twitch-raid',
        platform: 'twitch',
    },

    'twitch-host': {
        label: 'Host',
        description: 'When another channel hosts your channel',
        icon: 'twitch-host',
        platform: 'twitch',
    },

    'twitch-join': {
        label: 'Chat Join',
        description: 'When a user joins the chat',
        icon: 'twitch-join',
        platform: 'twitch',
    },

    'twitch-part': {
        label: 'Chat Leave',
        description: 'When a user leaves the chat',
        icon: 'twitch-part',
        platform: 'twitch',
    },

    'twitch-message': {
        label: 'Chat Message',
        description: 'When a specific message is sent in the chat',
        icon: 'twitch-message',
        platform: 'twitch',
    },

    'twitch-action': {
        label: 'Action Message (/me)',
        description: 'When a message with /me is sent in the chat',
        icon: 'twitch-action',
        platform: 'twitch',
    },

    'twitch-timeout': {
        label: 'Timeout',
        description: 'When a user receives timeout in the chat',
        icon: 'twitch-timeout',
        platform: 'twitch',
    },

    'twitch-ban': {
        label: 'Ban',
        description: 'When a user is banned from the chat',
        icon: 'twitch-ban',
        platform: 'twitch',
    },

    'twitch-hypetrain-start': {
        label: 'Hype Train Started',
        description: 'When a Hype Train starts',
        icon: 'twitch-hypetrain',
        platform: 'twitch',
    },

    'twitch-hypetrain-progress': {
        label: 'Hype Train Progress',
        description: 'When a Hype Train advances a level',
        icon: 'twitch-hypetrain-progress',
        platform: 'twitch',
    },

    'twitch-hypetrain-end': {
        label: 'Hype Train Ended',
        description: 'When a Hype Train is completed with success',
        icon: 'twitch-hypetrain-end',
        platform: 'twitch',
    },

    'twitch-poll-begin': {
        label: 'Poll Started',
        description: 'When a new poll is created',
        icon: 'twitch-poll',
        platform: 'twitch',
    },

    'twitch-poll-progress': {
        label: 'Poll Progress',
        description: 'During the execution of a poll',
        icon: 'twitch-poll-progress',
        platform: 'twitch',
    },

    'twitch-poll-end': {
        label: 'Poll Ended',
        description: 'When a poll is finalized',
        icon: 'twitch-poll-end',
        platform: 'twitch',
    },

    'twitch-prediction-begin': {
        label: 'Prediction Started',
        description: 'When a new prediction is created',
        icon: 'twitch-prediction',
        platform: 'twitch',
    },

    'twitch-prediction-progress': {
        label: 'Prediction Progress',
        description: 'During the execution of a prediction',
        icon: 'twitch-prediction-progress',
        platform: 'twitch',
    },

    'twitch-prediction-lock': {
        label: 'Prediction Locked',
        description: 'When a prediction is locked for new bets',
        icon: 'twitch-prediction-lock',
        platform: 'twitch',
    },

    'twitch-prediction-end': {
        label: 'Prediction Ended',
        description: 'When a prediction is finalized',
        icon: 'twitch-prediction-end',
        platform: 'twitch',
    },

    'twitch-stream-on': {
        label: 'Stream Started',
        description: 'When the live stream starts',
        icon: 'twitch-live',
        platform: 'twitch',
    },

    'twitch-stream-off': {
        label: 'Stream Ended',
        description: 'When the live stream ends',
        icon: 'twitch-offline',
        platform: 'twitch',
    },

    'twitch-emoteonly': {
        label: 'Emote Only Mode',
        description: 'When the chat is changed to emote only mode',
        icon: 'twitch-emoteonly',
        platform: 'twitch',
    },

    'twitch-followersonly': {
        label: 'Followers Only Mode',
        description: 'When the chat is changed to followers only mode',
        icon: 'twitch-followersonly',
        platform: 'twitch',
    },

    'twitch-slowmode': {
        label: 'Slow Mode',
        description: 'When the slow mode of the chat is activated',
        icon: 'twitch-slowmode',
        platform: 'twitch',
    },

    'twitch-subsonly': {
        label: 'Subscribers Only Mode',
        description: 'When the chat is changed to subscribers only mode',
        icon: 'twitch-subsonly',
        platform: 'twitch',
    },

    'twitch-announcement': {
        label: 'Announcement',
        description: 'When a moderator makes an announcement in the chat',
        icon: 'twitch-announcement',
        platform: 'twitch',
    },

    // ============= YOUTUBE TRIGGERS =============
    'youtube-superchat': {
        label: 'Super Chat',
        description: 'When a viewer sends a Super Chat',
        icon: 'youtube-superchat',
        platform: 'youtube',
    }
} as const;

// Tipos derivados para TypeScript
export type TriggerType = keyof typeof TriggerTypesConfig;
export type TriggerConfig = typeof TriggerTypesConfig[TriggerType];
export type TriggerInfo = {
    label: string;
    description: string;
    icon: string;
    platform: string;
};
