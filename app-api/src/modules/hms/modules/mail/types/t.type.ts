import type Mail from 'nodemailer/lib/mailer';

/**
 * Options for sending a templated email.
 */
export type SendTemplatedMailOptions = {
    /** Recipient(s). */
    to: string | string[];

    /** Optional CC. */
    cc?: string | string[];

    /** Optional BCC. */
    bcc?: string | string[];

    /** Optional Reply-To. */
    replyTo?: string;

    /** Nodemailer headers. */
    headers?: Mail.Headers;

    /** Attachments. */
    attachments?: Mail.Attachment[];

    /**
     * Handlebars template logical key, e.g.:
     * "emails/admin/invite"
     */
    template_key: string;

    /** Context passed to the Handlebars templates. */
    context?: Record<string, unknown>;

    /**
     * Optional explicit template paths.
     * If omitted, discovery uses:
     *  - subject: <key>/subject or <key>.subject
     *  - body:    <key>/body or <key>
     */
    subject_template?: string;
    body_template?: string;

    /**
     * Skip subject template and use this text.
     */
    subject_override?: string;

    /**
     * Optional layout; injects inner HTML into {{{
     * body
     * }}}.
     */
    layout?: string;
};