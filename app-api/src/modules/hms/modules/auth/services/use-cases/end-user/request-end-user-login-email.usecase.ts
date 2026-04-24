import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '@hms-module/modules/users/services/users.service';
import { OneTimeTokensService } from '@hms-module/modules/one-time-tokens/one-time-tokens.service';
import { MailService } from '@hms-module/modules/mail/mail.service';
import { SendLoginCodeResponseDto } from '@hms/shared-types/hms';
import { isEmail } from 'class-validator';

/**
 * Generate and send a one-time numeric login code to an end-user account.
 *
 * The input term can be either email or username.
 * - email: user is looked up by email and created when missing.
 * - username: user is looked up by username and token is sent only if found.
 */
@Injectable()
export class RequestEndUserLoginEmailUseCase {
    private readonly logger = new Logger(RequestEndUserLoginEmailUseCase.name);

    constructor(
        private readonly users: UsersService,
        private readonly ott: OneTimeTokensService,
        private readonly mail: MailService,
    ) { }

    async execute(
        termRaw: string,
        ttlMs: number = 1000 * 60 * 15,
    ): Promise<SendLoginCodeResponseDto> {
        const term = String(termRaw).trim().toLowerCase();

        if (isEmail(term)) {
            return this.handleEmailTerm(term, ttlMs);
        }

        return this.handleUsernameTerm(term, ttlMs);
    }

    private async handleEmailTerm(
        email: string,
        ttlMs: number,
    ): Promise<SendLoginCodeResponseDto> {
        let user = await this.users.findEndUserByEmail(email);
        if (!user) {
            user = await this.users.createUser({ email });
            this.logger.log(`Created end-user for email ${email}`);
        }

        await this.sendToken(user.id, email, ttlMs);

        return {
            recognized_username: user.username ?? null,
            redacted_email: this.redactEmail(email),
        };
    }

    private async handleUsernameTerm(
        username: string,
        ttlMs: number,
    ): Promise<SendLoginCodeResponseDto> {
        const user = await this.users.findByUsername(username);
        if (!user) {
            this.logger.log(
                `No end-user found for username ${username}. ` +
                'Login code dispatch skipped.',
            );

            return {
                recognized_username: null,
                redacted_email: null,
            };
        }

        await this.sendToken(user.id, user.email, ttlMs);

        return {
            recognized_username: user.username ?? null,
            redacted_email: this.redactEmail(user.email),
        };
    }

    private async sendToken(
        userId: string,
        email: string,
        ttlMs: number,
    ): Promise<void> {
        const oneTimeToken = await this.ott.create(
            { userId, userType: 'end_user' },
            ttlMs,
        );

        await this.mail.sendLoginToken(email, oneTimeToken.token);
    }

    private redactEmail(email: string): string {
        const [namePart, domainPart] = email.split('@');
        const visiblePart = namePart.slice(0, 3);

        return `${visiblePart}****@${domainPart}`;
    }
}
