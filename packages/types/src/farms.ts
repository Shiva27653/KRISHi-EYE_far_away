export interface Farm {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  sizeAcres: number;
  cropType: string;
  lastTreated?: Date | string;
}
