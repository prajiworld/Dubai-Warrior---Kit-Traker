import React from 'react';

export enum MemberStatus {
  Active = "Active",
  Injured = "Injured",
  Bench = "Bench",
}

export enum KitStatus {
  Scheduled = "Scheduled", // New status for matches pending admin confirmation
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

export const DW_CATEGORIES = [
  "Main (All-Rounder)",
  "Middle Order (Batsman)",
  "Middle Order (Bat) & Main (Bowling)",
  "RS (All-Rounder)",
  "RS (Bat) & Main (Bowl)",
  "RS (Bowl) & Main (Bat)",
  "RS (Batsman)",
  "RS (Bowl) & Middle Order (Bat)",
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
  RotationEligible: "Yes" | "No";
  PenaltyEligible: boolean;
  Order: number;
  CompletedInRound: boolean;
  Notes: string;
  DWCategory: DWCategory;
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

export interface Player {
    id: number;
    name: string;
    category: string;
    baseValue: number;
    soldAt?: number;
}

export interface Team {
    name: string;
    purse: number;
    spent: number;
    players: Player[];
}

export interface Teams {
    [key: string]: Team;
}

export interface Category {
    id: number;
    name: string;
    base: number;
    multiplier: number;
    min: number;
    max: number;
    phase: number;
    description?: string;
}
