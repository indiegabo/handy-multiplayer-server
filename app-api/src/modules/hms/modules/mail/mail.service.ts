// English-only code and comments by project convention.
import {
    Injectable,
    OnModuleInit,
} from '@nestjs/common';
import {
    createTransport,
    Transporter,
} from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { BetterLogger } from '../better-logger/better-logger.service';
import { SendTemplatedMailOptions } from './types/t.type';
import { TemplateEngineService } from '../template-engine/template-engine.service';

type AnyError = {
    message?: string;
    stack?: string;
    code?: string | number;
    response?: string;
    responseCode?: number;
    command?: string;
    errno?: number | string;
    syscall?: string;
    [key: string]: unknown;
};

function serializeError(err: unknown): Record<string, unknown> {
    if (!err) return { message: 'Unknown error' };
    const asAny = err as AnyError;
    const plain: Record<string, unknown> = {
        message: asAny?.message ?? null,
        code: asAny?.code ?? null,
        response: asAny?.response ?? null,
        responseCode: asAny?.responseCode ?? null,
        command: asAny?.command ?? null,
        errno: asAny?.errno ?? null,
        syscall: asAny?.syscall ?? null,
    };

    // Include enumerable extra props (defensive).
    try {
        for (const k of Object.keys(asAny)) {
            if (!(k in plain)) plain[k] = (asAny as any)[k];
        }
    } catch {
        /* ignore */
    }

    plain.stack = asAny?.stack ?? null;
    return plain;
}

@Injectable()
export class MailService implements OnModuleInit {
    private transporter!: Transporter;
    private isDevelopment: boolean;
    private debugTransport: boolean;

    constructor(
        private readonly configService: ConfigService,
        private readonly logger: BetterLogger,
        private readonly templates: TemplateEngineService,
    ) {
        this.logger.setContext(MailService.name);
        this.logger.setMessagesColor(BetterLogger.MAGENTA);

        this.isDevelopment =
            this.configService.get('APP_ENVIRONMENT') ===
            'development';

        this.debugTransport =
            String(this.configService.get('MAIL_DEBUG') ?? 'false')
                .toLowerCase() === 'true';
    }

    /* ------------------------------------ */
    /*  Small logging helpers               */
    /* ------------------------------------ */

    // Always log a string; pretty JSON when possible.
    private toPrettyJson(obj: unknown): string {
        try {
            return JSON.stringify(obj, null, 2);
        } catch {
            return String(obj);
        }
    }

    private getStack(err: unknown): string | undefined {
        const e = err as { stack?: unknown };
        return typeof e?.stack === 'string' ? e.stack : undefined;
    }

    private logError(message: string, err: unknown): void {
        const serialized = serializeError(err);
        this.logger.error(
            `${message}: ${this.toPrettyJson(serialized)}`,
            this.getStack(err),
        );
    }

    /* ------------------------------------ */
    /*  Lifecycle                           */
    /* ------------------------------------ */

    /**
     * Initialize transporter on boot.
     */
    async onModuleInit(): Promise<void> {
        await this.initializeTransporter();
    }

    /**
     * Create and verify the SMTP transporter.
     */
    private async initializeTransporter(): Promise<void> {
        try {
            const cfg = this.isDevelopment
                ? this.getDevelopmentConfig()
                : this.getProductionConfig();

            this.transporter = createTransport(cfg);

            if (this.debugTransport) {
                // nodemailer adds verbose logs when 'logger: true'
                // Enable it only in dev or when forced.
                (this.transporter as any).logger = true;
                (this.transporter as any).debug = true;
            }

            await this.verifyConnection();
        } catch (error: unknown) {
            this.logError('Failed to initialize mail transporter', error);
            throw error as Error;
        }
    }

    /**
     * Verify transporter connection.
     */
    async verifyConnection(): Promise<void> {
        try {
            await this.transporter.verify();
            this.logger.log('SMTP connection verified successfully');
        } catch (error: unknown) {
            this.logError('Failed to verify SMTP connection', error);
            throw error as Error;
        }
    }

    /* ------------------------------------ */
    /*  Transport Config                    */
    /* ------------------------------------ */

    /**
     * Dev: MailHog / Mailpit friendly config.
     */
    private getDevelopmentConfig() {
        return {
            host: this.configService.get<string>('MAIL_HOST', 'mailhog'),
            port: this.configService.get<number>('MAIL_PORT', 1025),
            secure: false,
            ignoreTLS: true,
            tls: { rejectUnauthorized: false },
            // logger/debug can be enabled via MAIL_DEBUG=true
        };
    }

    /**
     * Prod: real SMTP config (pool enabled).
     */
    private getProductionConfig() {
        return {
            host: this.configService.get<string>('MAIL_HOST'),
            port: this.configService.get<number>('MAIL_PORT'),
            secure: this.configService.get<boolean>('MAIL_SECURE', false),
            auth: {
                user: this.configService.get<string>('MAIL_USER'),
                pass: this.configService.get<string>('MAIL_PASSWORD'),
            },
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            tls: { rejectUnauthorized: true },
        };
    }

    /* ------------------------------------ */
    /*  Public API                          */
    /* ------------------------------------ */

    /**
     * Send a login code email (legacy helper).
     * Internally uses sendTemplated() with the template key
     * "emails/auth/login-code".
     *
     * @param to Recipient address.
     * @param token One-time login code.
     * @returns True if sent.
     */
    async sendLoginToken(
        to: string,
        token: string,
    ): Promise<boolean> {
        const appName =
            this.configService.get<string>('APP_NAME') ??
            'Streaming Games';

        return this.sendTemplated({
            to,
            template_key: 'emails/auth/login-code',
            context: { appName, token },
            layout: 'layouts/email-base',
        });
    }

    /**
     * Send an email using Handlebars templates.
     * Resolves subject/body using convention-over-configuration,
     * unless explicit templates/override are provided.
     *
     * @param opts Templated mail options.
     * @returns True if sent.
     */
    async sendTemplated(
        opts: SendTemplatedMailOptions,
    ): Promise<boolean> {
        if (!this.transporter) {
            this.logger.error('Mail transporter not initialized');
            return false;
        }

        let subject = '';
        let html = '';

        // Render templates separately so we can distinguish errors.
        try {
            const rendered = this.renderSubjectAndBody(opts);
            subject = rendered.subject;
            html = rendered.html;
        } catch (renderErr: unknown) {
            const payload = {
                ...serializeError(renderErr),
                template_key: opts.template_key,
            };
            this.logger.error(
                `Mail template rendering failed: ${this.toPrettyJson(payload)
                }`,
                this.getStack(renderErr),
            );
            return false;
        }

        try {
            const from =
                this.configService.get<string>('MAIL_FROM') ||
                `No Reply <no-reply@${(this.configService.get('APP_NAME') ?? 'app')
                    .toString()
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                }.com>`;

            const info = await this.transporter.sendMail({
                from,
                to: opts.to,
                cc: opts.cc,
                bcc: opts.bcc,
                replyTo: opts.replyTo,
                subject,
                html,
                headers: {
                    'X-Application-Name':
                        this.configService.get('APP_NAME'),
                    'X-Environment':
                        this.configService.get('APP_ENVIRONMENT'),
                    ...(opts.headers ?? {}),
                },
                attachments: opts.attachments,
            });

            this.logger.log(
                `Email sent to ${JSON.stringify(opts.to)} ` +
                `| MessageId: ${info.messageId}`,
            );
            return true;
        } catch (sendErr: unknown) {
            this.logError(
                `Failed to send email to ${JSON.stringify(opts.to)}`,
                sendErr,
            );

            // Only try to reinit for transport-level issues
            const code = (sendErr as AnyError)?.code ?? '';
            if (
                code === 'ECONNECTION' ||
                code === 'EAUTH' ||
                code === 'ESOCKET' ||
                code === 'ETIMEDOUT'
            ) {
                try {
                    await this.initializeTransporter();
                } catch (reinitErr: unknown) {
                    this.logError(
                        'Reinitializing transporter failed',
                        reinitErr,
                    );
                }
            }
            return false;
        }
    }

    /* ------------------------------------ */
    /*  Rendering Helpers                   */
    /* ------------------------------------ */

    /**
     * Resolve and render subject + body using the configured
    *  TemplateEngineService. If a layout is provided, injects
     * the inner HTML into the layout via {{{body}}}.
     */
    private renderSubjectAndBody(
        opts: SendTemplatedMailOptions,
    ): { subject: string; html: string } {
        const ctx = opts.context ?? {};

        // Always derive variants from a base key WITHOUT extension
        const base = this.templates.baseKeyForVariants(opts.template_key);

        // Subject (optional)
        let subject: string | null = null;

        if (opts.subject_override) {
            subject = String(opts.subject_override);
        } else {
            subject = this.templates.tryRenderFirst(
                [
                    opts.subject_template,
                    `${base}/subject`,
                    `${base}.subject`,
                ],
                ctx,
            /* allowMissing */ true,
            );
        }

        // Body (required)
        const inner = this.templates.tryRenderFirst(
            [
                opts.body_template,
                `${base}/body`,
                base,
            ],
            ctx,
        /* allowMissing */ false,
        );

        const html = opts.layout
            ? this.templates.renderTemplate(opts.layout, { ...ctx, body: inner })
            : inner;

        return { subject: subject ?? this.defaultSubject(), html };
    }

    /**
     * Try a list of candidate templates and return the first
     * successful render. Optionally allow missing and return
     * null; otherwise throw on "not found".
     */
    private tryRenderFirst(
        candidates: Array<string | undefined>,
        ctx: Record<string, unknown>,
        allowMissing: boolean,
    ): string | null {
        const attempted: string[] = [];

        for (const c of candidates) {
            if (!c) continue;
            attempted.push(c);
            try {
                const out = this.templates.renderTemplate(c, ctx);
                if (out != null) return out;
            } catch (err: unknown) {
                const msg = String((err as AnyError)?.message ?? '');
                // Skip only when truly "not found"
                if (msg.includes('Template not found')) continue;

                // Real render error: rethrow with context, keep message
                const enriched = serializeError(err);
                (enriched as any).template = c;

                // Rethrow as Error to preserve call sites.
                throw new Error(
                    `Template render error: ${JSON.stringify(enriched)}`,
                );
            }
        }

        if (allowMissing) return null;

        throw new Error(
            'No body template found. Tried: ' + attempted.join(' | '),
        );
    }

    /**
     * Fallback subject when none could be rendered.
     */
    private defaultSubject(): string {
        const app =
            this.configService.get<string>('APP_NAME') ??
            'Streaming Games';
        return `${app}`;
    }
}
