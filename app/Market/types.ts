// app/Market/types.ts

export type MarketplaceType = "project" | "hackathon" | "startup";

export interface MarketplacePost {
  _id?: string; // Convex auto id when fetched

  // Creator info
  creatorId: string;
  creatorName: string;
  creatorImage?: string;

  // Type of marketplace post
  type: MarketplaceType;

  // Content
  title: string;
  description: string;
  tags?: string[];

  // Recruitment
  lookingFor?: string;

  // Dates
  eventDate?: string;       // only for hackathons
  lastDateToJoin?: string;  // optional

  // Image optional
  imageUrl?: string;
  imageStorageId?: string;

  // Interest system
  interestedUsers?: string[];

  // Timestamp
  createdAt: number;
}
