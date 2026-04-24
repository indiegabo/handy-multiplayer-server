/**
 * Pagination + ordering settings for search.
 */

export type PaginationOptions = {
    limit?: number; // default 50
    offset?: number; // default 0
    orderBy?: 'created_at' |
    'scheduled_at' |
    'queued_at' |
    'sent_at' |
    'delivered_at' |
    'read_at' |
    'failed_at';
    orderDir?: 'ASC' | 'DESC'; // default DESC
};
