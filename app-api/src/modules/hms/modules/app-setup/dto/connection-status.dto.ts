export type ConnectionStatusDto = {
    service: string;
    status: boolean;
    error?: string;
    details?: any;
}