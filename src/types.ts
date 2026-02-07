export enum MemberStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Pending = 'Pending',
  Injured = 'Injured',
}

export enum KitStatus {
  Upcoming = 'Upcoming',
  Scheduled = 'Scheduled',
  Completed = 'Completed',
  NoPlay = 'No Play',
  // Obsolete
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Declined = 'Declined',
}

export enum AssignmentReason {
  Rotation = 'Rotation',
  Penalty = 'Penalty',
  Reassigned = 'Reassigned',
  Forced = 'Forced',
  Manual = 'Manual',
}

export enum PenaltyStatus {
  Pending = 'Pending',
  Completed = 'Completed',
}

export const DW_CATEGORIES = [
  'RS (Batsman)',
  'Main (All-Rounder)',
  'Middle Order (Batsman)',
  'Middle Order (Bat) & Main (Bowling)',
  'RS (All-Rounder)',
  'RS (Bat) & Main (Bowl)',
  'RS (Bowl) & Middle Order (Bat)',
] as const;

export type DWCategory = typeof DW_CATEGORIES[number];

export interface TeamMember {
  MemberID: string;
  Name: string;
  username: string;
  email: string;
  password?: string;
  Role: string;
  IsAdmin: boolean;
  PhoneNumber: string;
  OwnsCar: boolean;
  Status: MemberStatus;
  RotationEligible: 'Yes' | 'No';
  PenaltyEligible: boolean;
  Order: number;
  CompletedInRound?: boolean;
  Notes?: string;
  DWCategory: DWCategory;
  JerseyNumber?: number;
}

export interface KitTrackerEntry {
  id: string;
  Date: string;
  DueDate: string;
  Opponent?: string;
  Ground?: string;
  GroundLatLong: { lat: number; lng: number };
  GeoRadiusMeters: number;
  MeetTime?: string;
  ProvisionalAssignee?: string;
  KitResponsible: string;
  TakenOnBehalfOf: string;
  Status: KitStatus;
  MatchOn: boolean;
  Reason: AssignmentReason;
  Notes?: string;
  WeeksHeld?: number;
  DeferredMemberID?: string;
  CutoffTime?: string;
  reassignmentReason?: string;
  adjustmentStatus?: string; // New field for "1st Adjustment", "2nd Adjustment", etc.
}

export interface Penalty {
  PenaltyID: string;
  MemberID: string;
  MatchDate: string;
  Notes: string;
  Status: PenaltyStatus;
}

export interface Match {
  id: string;
  date: string;
  status: 'Scheduled' | 'Upcoming' | 'Completed' | 'No Play';
  notes?: string;
  assignedPlayer?: string;
  adjustmentStatus?: string;
}

export interface Arrival {
    ArrivalID: string;
    MatchDate: string;
    Member: string;
    ArrivalTime: string | null;
    CheckInLatLong: { lat: number; lng: number } | null;
}
