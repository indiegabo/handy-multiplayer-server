export type AdminPermissions = {
    all?: boolean;
    modules?: {
        users?: boolean | string[];
        content?: boolean | string[];
        settings?: boolean | string[];
        // Adicione outros módulos conforme necessário
    };
    granted_at?: string;
    granted_by?: number; // ID do admin que concedeu as permissões
    custom_permissions?: Record<string, boolean | string[]>;
}