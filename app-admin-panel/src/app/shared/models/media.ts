export type Media = {
  id: number;
  uuid: string;
  url: string;
  mediable_id: number;
  media_type: MediaType;
  title?: string;
  size_in_kb: number;
}

export enum MediaType {
  Image = 1,
  Audio = 2,
  Video = 3
}
