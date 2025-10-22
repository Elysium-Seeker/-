
export interface Article {
  title: string;
  summary: string;
  source: string;
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface FilterOptions {
  subTopic: string;
}