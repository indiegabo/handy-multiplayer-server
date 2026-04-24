import { ScopedToken } from
    "@hms-module/modules/scoped-tokens/entities/scoped-token.entity";
import { v4 as uuid } from "uuid";

export const SCOPED_TOKENS_MOCK: ScopedToken[] = (() => {
    const creatorA = "11111111-1111-4111-8111-111111111111";
    const creatorB = "22222222-2222-4222-8222-222222222222";
    const revokerA = "33333333-3333-4333-8333-333333333333";

    const now = Date.now();

    const t1 = new ScopedToken();
    t1.id = "550e8400-e29b-41d4-a716-446655440000";
    t1.token = "valid-active-token";
    t1.creator_id = creatorA;
    t1.creator = null;
    t1.scopes = ["read:profile", "write:settings"];
    t1.data = { description: "For mobile app access" };
    t1.revoker_id = null;
    t1.revoker = null;
    t1.revoked_at = null;
    t1.created_at = new Date(now - 1000 * 60 * 60 * 24);
    t1.updated_at = new Date(now - 1000 * 60 * 60 * 24);

    const t2 = new ScopedToken();
    t2.id = "550e8400-e29b-41d4-a716-446655440001";
    t2.token = "revoked-token";
    t2.creator_id = creatorB;
    t2.creator = null;
    t2.scopes = ["admin:all"];
    t2.data = { purpose: "temporary admin access" };
    t2.revoker_id = revokerA;
    t2.revoker = null;
    t2.revoked_at = new Date(now - 1000 * 60 * 60 * 12);
    t2.created_at = new Date(now - 1000 * 60 * 60 * 24 * 2);
    t2.updated_at = new Date(now - 1000 * 60 * 60 * 12);

    const t3 = new ScopedToken();
    t3.id = "550e8400-e29b-41d4-a716-446655440002";
    t3.token = "minimal-scopes-token";
    t3.creator_id = "44444444-4444-4444-8444-444444444444";
    t3.creator = null;
    t3.scopes = ["read:basic"];
    t3.data = null; // allowed by entity (nullable true)
    t3.revoker_id = null;
    t3.revoker = null;
    t3.revoked_at = null;
    t3.created_at = new Date(now - 1000 * 60 * 30);
    t3.updated_at = new Date(now - 1000 * 60 * 30);

    const t4 = new ScopedToken();
    t4.id = "550e8400-e29b-41d4-a716-446655440003";
    t4.token = "system-generated-token";
    t4.creator_id = null; // system-generated
    t4.creator = null;
    t4.scopes = ["system:maintenance"];
    t4.data = { auto_generated: true };
    t4.revoker_id = null;
    t4.revoker = null;
    t4.revoked_at = null;
    t4.created_at = new Date(now - 1000 * 60 * 5);
    t4.updated_at = new Date(now - 1000 * 60 * 5);

    return [t1, t2, t3, t4];
})();
