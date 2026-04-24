// English-only code and comments by project convention.
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { BetterLogger } from '../better-logger/better-logger.service';

type RenderOptions = {
    /**
     * Optional layout to wrap the rendered content.
     * The layout template must consume a `body` variable where
     * the inner HTML will be injected.
     * Example: 'layouts/base' or 'layouts/base.hbs'
     */
    layout?: string;
};

@Injectable()
export class TemplateEngineService {
    /**
     * Absolute path to the templates root directory.
     * Defaults to a discovered "<projectRoot>/templates".
     */
    private readonly templatesPath: string;

    /**
     * In-memory cache of compiled Handlebars templates.
     */
    private readonly cache: Map<string, Handlebars.TemplateDelegate<any>>;

    constructor(private readonly logger: BetterLogger) {
        this.logger.setContext(TemplateEngineService.name);

        this.templatesPath = this.resolveTemplatesRoot();
        this.logger.log(`Templates root: ${this.templatesPath}`);

        this.cache = new Map();

        // Register helpers and partials eagerly so they are available
        // to all templates throughout the app lifecycle.
        this.registerHelpers();
        this.registerAllPartials();
    }

    /* ------------------------------------ */
    /*  Public API                          */
    /* ------------------------------------ */

    /**
     * Render a template with the provided context.
     *
     * If the template itself declares a block layout
     * (e.g. {{#> layouts/base}} ... {{/layouts/base}}),
     * the explicit layout in options is ignored by Handlebars.
     *
     * If `options.layout` is provided, we render the inner template
     * first, then render the layout injecting the result into `body`.
     *
     * @param templateRelPath Path from templates root, with or without
     *                        `.hbs` extension. E.g.:
     *                        'emails/auth/single-token-login'
     *                        or 'emails/auth/single-token-login.hbs'
     * @param context         Key-value object for the template.
     * @param options         Optional wrapper layout key.
     * @returns Rendered HTML or text content.
     * @throws Error when the template cannot be found.
     */
    renderTemplate(
        templateRelPath: string,
        context: Record<string, any>,
        options?: RenderOptions,
    ): string {
        const html = this.compileAndRender(templateRelPath, context);

        if (options?.layout) {
            // Render the layout wrapping the inner HTML into {{{
            // body }}} of that layout
            return this.compileAndRender(options.layout, {
                ...context,
                body: html,
            });
        }

        return html;
    }

    /* ------------------------------------ */
    /*  Helpers                             */
    /* ------------------------------------ */

    /**
     * Determine the templates root directory using:
     * 1) env TEMPLATE_ROOT, if exists
     * 2) <cwd>/src/templates (new canonical location)
     * 3) legacy <cwd>/templates (backward compatibility)
     * 4) fallbacks relative to __dirname (works when running from dist/)
     * 5) <cwd>/dist/templates as a last checked runtime copy
     * If nothing matches, fallback to <cwd>/src/templates and warn.
     */
    private resolveTemplatesRoot(): string {
        // 2) New canonical source path (dev/ts-node)
        const cwdSrc = path.resolve(process.cwd(), 'src', 'templates');
        if (fs.existsSync(cwdSrc)) {
            return cwdSrc;
        }

        // 3) Legacy path for backward compatibility
        const cwdLegacy = path.resolve(process.cwd(), 'templates');
        if (fs.existsSync(cwdLegacy)) {
            return cwdLegacy;
        }

        // 4) Fallbacks relative to compiled JS location
        // NOTE: __dirname points to something like:
        //   dist/hms/modules/template-engine
        // We try both "src/templates" (bind/copy at runtime)
        // and "templates" (if assets were copied to dist/templates).
        const candidates = [
            // dist/hms/modules/template-engine -> <root>/src/templates
            path.resolve(__dirname, '..', '..', '..', '..', 'src', 'templates'),
            // dist/core/template-engine -> <root>/src/templates
            path.resolve(__dirname, '..', '..', '..', 'src', 'templates'),
            // dist/template-engine -> <root>/src/templates
            path.resolve(__dirname, '..', '..', 'src', 'templates'),

            // In case templates were copied as plain "templates/"
            path.resolve(__dirname, '..', '..', '..', '..', 'templates'),
            path.resolve(__dirname, '..', '..', '..', 'templates'),
            path.resolve(__dirname, '..', '..', 'templates'),

            // 5) If build copied to dist/templates at cwd
            path.resolve(process.cwd(), 'dist', 'templates'),
        ];

        for (const c of candidates) {
            if (fs.existsSync(c)) return c;
        }

        // Final fallback: prefer new canonical location under cwd
        const fallback = cwdSrc;
        this.logger.warn(
            'Templates root not found via discovery. Using fallback: ' + fallback,
        );
        return fallback;
    }


    /**
     * Ensure a logical key is POSIX-like and without a leading slash.
     * E.g., "\emails\auth\foo.hbs" -> "emails/auth/foo.hbs"
     */
    private normalizeKey(key: string): string {
        const posix = key.replace(/\\/g, '/');
        return posix.replace(/^\/+/, '');
    }

    /**
     * Remove a trailing ".hbs" from a logical key if present.
     */
    private stripExt(key: string): string {
        return key.endsWith('.hbs') ? key.slice(0, -4) : key;
    }

    /**
     * Add ".hbs" to a key if missing.
     */
    private ensureExt(key: string): string {
        return key.endsWith('.hbs') ? key : `${key}.hbs`;
    }

    /**
     * Build an absolute path from templates root for a given logical key
     * that may or may not have ".hbs".
     */
    private resolveFilePath(relKey: string): string {
        const normalized = this.normalizeKey(relKey);
        const withExt = this.ensureExt(normalized);
        return path.join(this.templatesPath, withExt);
    }

    /* ------------------------------------ */
    /*  Handlebars setup                    */
    /* ------------------------------------ */

    /**
     * Register global Handlebars helpers.
     * Keep helpers side-effect free and deterministic.
     */
    private registerHelpers(): void {
        // Example: {{uppercase value}}
        Handlebars.registerHelper('uppercase', (v: unknown) =>
            `${v ?? ''}`.toUpperCase(),
        );

        // Example: {{#if (eq a b)}} ... {{/if}}
        Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);

        // Example: {{nl2br text}}
        // Escapes input and converts newlines to <br/>.
        Handlebars.registerHelper('nl2br', (text: unknown) => {
            const s = `${text ?? ''}`;
            const esc = Handlebars.escapeExpression(s);
            return new Handlebars.SafeString(esc.replace(/\n/g, '<br/>'));
        });
    }

    /**
     * Register all .hbs files found under `baseDir` as Handlebars partials,
     * namespaced with `namespace`.
     *
     * For example, a file:
     *   <baseDir>/emails/header.hbs
     * becomes a partial named:
     *   'partials/emails/header'
     */
    private registerAllPartials(): void {
        const partialsDir = path.join(this.templatesPath, 'partials');
        const layoutsDir = path.join(this.templatesPath, 'layouts');

        this.registerPartialsFromDir(partialsDir, 'partials');
        this.registerPartialsFromDir(layoutsDir, 'layouts');
    }

    /**
     * Register all .hbs files found under `baseDir` as Handlebars partials,
     * namespaced with `namespace`.
     *
     * For example, a file:
     *   <baseDir>/emails/header.hbs
     * becomes a partial named:
     *   'partials/emails/header'
     */
    private registerPartialsFromDir(baseDir: string, namespace: string): void {
        if (!fs.existsSync(baseDir)) {
            // Silently skip if directory does not exist.
            return;
        }

        const walk = (dir: string) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });

            for (const entry of entries) {
                const full = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    walk(full);
                    continue;
                }

                if (!entry.name.endsWith('.hbs')) continue;

                const rel = path.relative(baseDir, full);
                const nameNoExt = rel.replace(/\\/g, '/').replace(/\.hbs$/, '');
                const partialName = `${namespace}/${nameNoExt}`;

                const content = fs.readFileSync(full, 'utf-8');
                Handlebars.registerPartial(partialName, content);
            }
        };

        try {
            walk(baseDir);
        } catch (e) {
            this.logger.warn(
                `Failed to register partials in ${baseDir}: ${String(e)}`,
            );
        }
    }

    /* ------------------------------------ */
    /*  Compile + render (with cache)       */
    /* ------------------------------------ */

    /**
     * Compile (with caching) and render a template file using the
     * provided context.
     *
     * @param templateRelPath Relative path (from templates root),
     *                        with or without `.hbs` extension.
     * @param context         Key-value object for the template.
     * @returns Rendered string.
     * @throws Error when the template file is missing.
     */
    private compileAndRender(
        templateRelPath: string,
        context: Record<string, any>,
    ): string {
        const fullPath = this.resolveFilePath(templateRelPath);

        if (!fs.existsSync(fullPath)) {
            // Emit a helpful message showing both the key and the disk path
            const logical = this.normalizeKey(templateRelPath);
            throw new Error(
                `Template not found: ${logical} (resolved: ${fullPath})`,
            );
        }

        // Cache key must be logical POSIX path + ".hbs"
        const cacheKey = this.ensureExt(this.normalizeKey(templateRelPath));

        let compiled = this.cache.get(cacheKey);
        if (!compiled) {
            const templateContent = fs.readFileSync(fullPath, 'utf-8');
            compiled = Handlebars.compile(templateContent);
            this.cache.set(cacheKey, compiled);
        }

        return compiled(context);
    }

    /* ------------------------------------ */
    /*  Convenience for subject/body keys   */
    /* ------------------------------------ */

    /**
     * Given a base key that may include ".hbs", return the base key
     * without extension for composing "/body" and ".subject" variants.
     */
    baseKeyForVariants(key: string): string {
        const normalized = this.normalizeKey(key);
        return this.stripExt(normalized);
    }

    /**
     * Render one of a list of candidates. Each candidate can be passed
     * with or without ".hbs"; both forms are attempted. When composing
     * "body" or "subject" variants, ensure the base key has no ".hbs".
     *
     * This method is compatible with the calling pattern from your
     * MailService (it expects to receive logical keys, not absolute).
     *
     * @param candidates A list of logical keys to try.
     * @param ctx        Rendering context.
     * @param allowMissing If true, returns null when all miss.
     */
    tryRenderFirst(
        candidates: Array<string | undefined>,
        ctx: Record<string, unknown>,
        allowMissing: boolean,
    ): string | null {
        const attempted: string[] = [];

        // Expand each candidate to [raw, with .hbs] when needed.
        const expanded: string[] = [];
        for (const c of candidates) {
            if (!c) continue;
            const base = this.normalizeKey(c);
            // If the caller passed a key that ends with ".hbs", we include it
            // as-is and also a version without the extension so that any inner
            // logic that composes "/body" etc. can still work upstream.
            if (base.endsWith('.hbs')) {
                expanded.push(base);
                expanded.push(this.stripExt(base));
            } else {
                expanded.push(base);
                expanded.push(`${base}.hbs`);
            }
        }

        for (const logical of expanded) {
            attempted.push(logical);

            try {
                // compileAndRender accepts logical with or without ".hbs"
                const out = this.compileAndRender(logical, ctx as any);
                if (out != null) return out;
            } catch (err: any) {
                const msg = String(err?.message ?? '');
                // Skip only when truly "not found"
                if (msg.includes('Template not found')) continue;

                // Real render error: rethrow with context
                const enriched = {
                    message: err?.message ?? String(err),
                    template: logical,
                };
                throw new Error(
                    `Template render error: ${JSON.stringify(enriched)}`,
                );
            }
        }

        if (allowMissing) return null;

        throw new Error(
            'Template not found. Tried: ' + attempted.join(' | '),
        );
    }

    /* ------------------------------------ */
    /*  Notes for callers (MailService)     */
    /* ------------------------------------ */

    /**
     * Callers building subject/body must ensure they derive variants
     * from the **base key without extension**. Example:
     *
     * const base = baseKeyForVariants(templateKeyFromCaller);
     * tryRenderFirst([ `${base}/subject`, `${base}.subject` ], ctx, true);
     * tryRenderFirst([ `${base}/body`, base ], ctx, false);
     *
     * This avoids generating "...file.hbs/body" which is invalid.
     */
}
