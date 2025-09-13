import { TeamMember, KitTrackerEntry, Arrival, MemberStatus, KitStatus, AssignmentReason } from './types';

export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  { MemberID: "admin1", Name: "Admin Alex", username: "alex", password: "password", Role: "Captain", IsAdmin: true, PhoneNumber: "+971501111111", OwnsCar: true, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: true, Order: 1, CompletedInRound: false, Notes: "Team Captain" },
  { MemberID: "user1", Name: "User Ben", username: "ben", password: "password", Role: "Player", IsAdmin: false, PhoneNumber: "+971502222222", OwnsCar: true, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: true, Order: 2, CompletedInRound: false, Notes: "" },
  { MemberID: "user2", Name: "User Charlie", username: "charlie", password: "password", Role: "Player", IsAdmin: false, PhoneNumber: "+971503333333", OwnsCar: false, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: false, Order: 3, CompletedInRound: false, Notes: "Doesn't own a car" },
  { MemberID: "user3", Name: "User David", username: "david", password: "password", Role: "Player", IsAdmin: false, PhoneNumber: "+971504444444", OwnsCar: true, Status: MemberStatus.Injured, RotationEligible: "No", PenaltyEligible: true, Order: 4, CompletedInRound: false, Notes: "Sprained ankle" },
  { MemberID: "user4", Name: "User Eve", username: "eve", password: "password", Role: "Player", IsAdmin: false, PhoneNumber: "+971505555555", OwnsCar: true, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: true, Order: 5, CompletedInRound: true, Notes: "Completed last round" }
];

const today = new Date();
const todayStr = today.toISOString().split('T')[0];
const yesterday = new Date();
yesterday.setDate(today.getDate() - 7);
const yesterdayStr = yesterday.toISOString().split('T')[0];
const nextWeek = new Date();
nextWeek.setDate(today.getDate() + 7);
const nextWeekStr = nextWeek.toISOString().split('T')[0];

export const INITIAL_KIT_TRACKER: KitTrackerEntry[] = [
    { Date: yesterdayStr, DueDate: yesterdayStr, GroundLatLong: { lat: 25.0763, lng: 55.1886 }, GeoRadiusMeters: 250, CutoffTime: "22:45", ProvisionalAssignee: "user1", KitResponsible: "user1", TakenOnBehalfOf: "", Status: KitStatus.Completed, WeeksHeld: 1, Notes: "Last week's match", MatchOn: true, Reason: AssignmentReason.Rotation },
    { Date: todayStr, DueDate: todayStr, GroundLatLong: { lat: 25.0763, lng: 55.1886 }, GeoRadiusMeters: 250, CutoffTime: "22:45", ProvisionalAssignee: "user2", KitResponsible: "", TakenOnBehalfOf: "", Status: KitStatus.Upcoming, WeeksHeld: 0, Notes: "Today's big game!", MatchOn: false, Reason: AssignmentReason.Rotation },
    { Date: nextWeekStr, DueDate: nextWeekStr, GroundLatLong: { lat: 25.0763, lng: 55.1886 }, GeoRadiusMeters: 250, CutoffTime: "22:45", ProvisionalAssignee: "user3", KitResponsible: "", TakenOnBehalfOf: "", Status: KitStatus.Upcoming, WeeksHeld: 0, Notes: "Next week", MatchOn: false, Reason: AssignmentReason.Rotation },
];

export const INITIAL_ARRIVALS: Arrival[] = [
    { ArrivalID: "arr1", MatchDate: yesterdayStr, Member: "admin1", ArrivalTime: new Date(new Date(`${yesterdayStr}T22:30:00`).getTime()).toISOString(), CheckInLatLong: { lat: 25.0763, lng: 55.1886 } },
    { ArrivalID: "arr2", MatchDate: yesterdayStr, Member: "user1", ArrivalTime: new Date(new Date(`${yesterdayStr}T22:40:00`).getTime()).toISOString(), CheckInLatLong: { lat: 25.0763, lng: 55.1886 } },
    { ArrivalID: "arr3", MatchDate: todayStr, Member: "admin1", ArrivalTime: null, CheckInLatLong: null },
    { ArrivalID: "arr4", MatchDate: todayStr, Member: "user1", ArrivalTime: null, CheckInLatLong: null },
    { ArrivalID: "arr5", MatchDate: todayStr, Member: "user2", ArrivalTime: null, CheckInLatLong: null },
    { ArrivalID: "arr6", MatchDate: todayStr, Member: "user4", ArrivalTime: null, CheckInLatLong: null },
];