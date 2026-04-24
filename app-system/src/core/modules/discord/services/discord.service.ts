// discord.service.ts
import {
    Injectable,
    Logger,
    OnModuleInit,
    OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DISCORD_CONFIG } from '@src/config/discord.config';
import {
    Client,
    GatewayIntentBits,
    TextBasedChannel,
    MessageCreateOptions,
    MessagePayload,
} from 'discord.js';

@Injectable()
export class DiscordService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(DiscordService.name);
    private client?: Client;
    private enabled = false;
    private reportStatusChannelID = '';
    private publicStatusChannelID = '';
    private teamRoleID = '';

    constructor(private readonly cfg: ConfigService) { }

    async onModuleInit(): Promise<void> {
        this.enabled =
            (this.cfg.get<string>('DISCORD_ENABLED') ?? 'false')
                .toString()
                .toLowerCase() === 'true';

        if (!this.enabled) {
            this.logger.warn('Discord disabled by configuration.');
            return;
        }

        const token = (this.cfg.get<string>('DISCORD_BOT_TOKEN') || '').trim();
        if (!token) {
            this.logger.warn('Discord enabled but no token provided. Skipping.');
            this.enabled = false;
            return;
        }

        const appEnvironment =
            (this.cfg.get<string>('APP_ENVIRONMENT') ?? 'development')
                .toString()
                .toLowerCase();

        const isProduction = appEnvironment === 'production';

        this.reportStatusChannelID = isProduction
            ? DISCORD_CONFIG.maintenanceReportChannelID
            : DISCORD_CONFIG.devMaintenanceReportChannelID;

        this.publicStatusChannelID = isProduction
            ? DISCORD_CONFIG.publicStatusChannelID
            : DISCORD_CONFIG.devPublicStatusChannelID;

        this.teamRoleID = DISCORD_CONFIG.teamRoleID;

        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
            ],
        });

        try {
            await this.client.login(token);
            this.logger.log('Discord client logged in.');
        } catch (err) {
            this.logger.error(
                'Discord login failed; continuing without Discord.',
                (err as Error)?.stack,
            );
            this.client = undefined;
            this.enabled = false;
        }
    }

    async onModuleDestroy(): Promise<void> {
        if (this.client) {
            try {
                await this.client.destroy();
                this.logger.log('Discord client destroyed.');
            } catch (err) {
                this.logger.warn('Error destroying Discord client.', err as Error);
            }
        }
    }

    async sendStatusNotification(message: string): Promise<void> {
        if (!this.enabled || !this.client) return;
        await this.sendToChannel(
            this.publicStatusChannelID,
            message,
            false,
        );
    }

    async sendMaintenanceNotification(
        title: string,
        details: string,
    ): Promise<void> {
        if (!this.enabled || !this.client) return;

        // Maintenance IDs are sensitive and must never be posted
        // to the public status channel.
        const safeDetails = this.sanitizePublicMaintenanceDetails(details);
        const body = this.formatMaintenanceMessage(title, safeDetails);

        await this.sendToChannel(this.publicStatusChannelID, body, false);
    }

    async sendMaintenanceReportNotification(
        title: string,
        details: string,
    ): Promise<void> {
        if (!this.enabled || !this.client) return;

        const body = this.formatMaintenanceMessage(title, details);

        await this.sendToChannel(
            this.reportStatusChannelID,
            `<@&${this.teamRoleID}>\n\n${body}`,
            true,
        );
    }

    /**
     * Uses Discord markdown headings and blockquotes so each
     * maintenance update is visually separated and easy to scan.
     */
    private formatMaintenanceMessage(
        title: string,
        details: string,
    ): string {
        const normalizedTitle = title.trim();
        const normalizedDetails = details.trim();

        // Use Discord multiline quote syntax to keep the whole body grouped
        // and avoid isolated ">" lines on blank separators.
        return `## ${normalizedTitle}\n\n>>> ${normalizedDetails}`;
    }

    /**
     * Strips any maintenance-id fields/lines from public messages.
     * IDs are considered sensitive data and cannot be disclosed outside
     * the internal report channel.
     */
    private sanitizePublicMaintenanceDetails(details: string): string {
        const withoutMaintenanceLines = details
            .split('\n')
            .filter((line) => !/maintenance[\s_-]*id/i.test(line))
            .join('\n');

        const withoutJsonFields = withoutMaintenanceLines
            .replace(
                /,?\s*"maintenanceId"\s*:\s*"[^"]*"\s*,?/gi,
                '',
            )
            .replace(
                /,?\s*"maintenance_id"\s*:\s*"[^"]*"\s*,?/gi,
                '',
            );

        const normalized = withoutJsonFields
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        if (normalized.length > 0) {
            return normalized;
        }

        return 'Maintenance update available.';
    }

    private async sendToChannel(
        channelID: string,
        content: string,
        allowRoleMention: boolean,
    ): Promise<void> {
        if (!this.enabled || !this.client) return;

        if (!channelID) {
            this.logger.warn('Missing Discord channel ID for status message.');
            return;
        }

        try {
            const channel = (await this.client.channels.fetch(
                channelID,
            )) as TextBasedChannel | null;

            if (!channel?.isTextBased?.() || !('send' in channel)) {
                this.logger.warn('Invalid or non-text channel for status messages.');
                return;
            }

            const options: MessageCreateOptions = allowRoleMention
                ? {
                    content,
                    allowedMentions: { roles: [this.teamRoleID] },
                }
                : { content };

            // Keep the same payload path your code used:
            await channel.send(MessagePayload.create(channel, options));
        } catch (error) {
            this.logger.error(
                `Failed to send Discord message to channel ${channelID}.`,
                error as Error,
            );
            // Do not throw: keep the app healthy even if Discord fails.
        }
    }
}
