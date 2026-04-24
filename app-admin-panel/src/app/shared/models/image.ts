export interface Image {
  uuid: string;
  imageable_id: number;
  title?: string;
  url: string;
  filename: string;
}

export interface ImageAttachData {
  data: string;
  name: string;
  title?: string;
}
