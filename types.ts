export enum MemberStatus {
  Active = "Active",
  Injured = "Injured",
  Bench = "Bench",
}

export enum KitStatus {
  Upcoming = "Upcoming",
  Completed = "Completed",
  Missed = "Missed",
  NoPlay = "No Play",
}

export enum AssignmentReason {
  Rotation = "Rotation",
  PenaltyLate = "Penalty: Late",
  Deferred = "Deferred",
  Reassigned = "Reassigned",
}


export interface TeamMember {
  MemberID: string;
  Name: string;
  username: string;
  password: string;
  Role: string;
  IsAdmin: boolean;
  PhoneNumber: string;
  OwnsCar: boolean;
  Status: MemberStatus;
  RotationEligible: "Yes" | "No";
  PenaltyEligible: boolean;
  Order: number;
  CompletedInRound: boolean;
  Notes: string;
}

export interface KitTrackerEntry {
  Date: string; // YYYY-MM-DD
  DueDate: string; // YYYY-MM-DD
  GroundLatLong: { lat: number; lng: number; };
  GeoRadiusMeters: number;
  CutoffTime: string; // HH:MM
  ProvisionalAssignee: string; // MemberID
  KitResponsible: string; // MemberID
  TakenOnBehalfOf: string; // MemberID
  Status: KitStatus;
  WeeksHeld: number;
  Notes: string;
  MatchOn: boolean;
  Reason: AssignmentReason;
  DeferredMemberID?: string; // MemberID of the person who was deferred
}

export interface Arrival {
  ArrivalID: string;
  MatchDate: string; // YYYY-MM-DD, Ref to KitTrackerEntry.Date
  Member: string; // MemberID, Ref to TeamMember.MemberID
  ArrivalTime: string | null; // ISO DateTime string
  CheckInLatLong: { lat: number; lng: number; } | null;
}