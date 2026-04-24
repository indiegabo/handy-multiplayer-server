export type SetupStatusDto = {
  is_complete: boolean;
  completed_at: Date;
  details: Record<string, any>;
};