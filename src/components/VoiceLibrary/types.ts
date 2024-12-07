export interface Voice {
  id: string;
  name: string;
  gender: string;
  nationality: string;
  language: string;
  provider: string;
  traits: string[];
  isCloned?: boolean;
  previewUrl?: string;
  audioUrl?: string;
};

export interface Provider {
  name: string;
  status: "Included" | "Premium" | "Custom";
  languages: string[];
};