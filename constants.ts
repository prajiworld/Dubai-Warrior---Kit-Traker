import { TeamMember, KitTrackerEntry, Arrival, MemberStatus, KitStatus, AssignmentReason } from './types';

export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  { MemberID: "user1", Name: "Rajaram", username: "Rajaram", password: "pass123", Role: "Admin", IsAdmin: true, PhoneNumber: "+971504599540", OwnsCar: true, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: true, Order: 1, CompletedInRound: false, Notes: "" },
  { MemberID: "user2", Name: "Rajesh", username: "Rajesh", password: "pass123", Role: "Player", IsAdmin: false, PhoneNumber: "+971567144054", OwnsCar: true, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: true, Order: 2, CompletedInRound: false, Notes: "" },
  { MemberID: "user3", Name: "Safuvan", username: "Safuvan", password: "pass123", Role: "Player", IsAdmin: false, PhoneNumber: "+971559906662", OwnsCar: true, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: true, Order: 3, CompletedInRound: false, Notes: "" },
  { MemberID: "user4", Name: "Damu", username: "Damu", password: "pass123", Role: "Player", IsAdmin: false, PhoneNumber: "+971568137227", OwnsCar: true, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: true, Order: 4, CompletedInRound: false, Notes: "" },
  { MemberID: "user5", Name: "Sahim", username: "Sahim", password: "pass123", Role: "Player", IsAdmin: true, PhoneNumber: "+971507761743", OwnsCar: true, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: true, Order: 5, CompletedInRound: false, Notes: "" },
  { MemberID: "user6", Name: "Reneesh", username: "Reneesh", password: "pass123", Role: "Player", IsAdmin: false, PhoneNumber: "+971502457045", OwnsCar: true, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: true, Order: 6, CompletedInRound: false, Notes: "" },
  { MemberID: "user7", Name: "Prajith", username: "Prajith", password: "pass123", Role: "Player", IsAdmin: true, PhoneNumber: "+971559901570", OwnsCar: true, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: true, Order: 7, CompletedInRound: false, Notes: "" },
  { MemberID: "user8", Name: "Yogesh", username: "Yogesh", password: "pass123", Role: "Player", IsAdmin: false, PhoneNumber: "+971506487776", OwnsCar: true, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: true, Order: 8, CompletedInRound: false, Notes: "" },
  { MemberID: "user9", Name: "Wasim", username: "Wasim", password: "pass123", Role: "Player", IsAdmin: false, PhoneNumber: "+971581036912", OwnsCar: true, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: true, Order: 9, CompletedInRound: false, Notes: "" },
  { MemberID: "user10", Name: "Hussein", username: "Hussein", password: "pass123", Role: "Player", IsAdmin: false, PhoneNumber: "+971557125252", OwnsCar: true, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: true, Order: 10, CompletedInRound: false, Notes: "" },
  { MemberID: "user11", Name: "Basheer", username: "Basheer", password: "pass123", Role: "Player", IsAdmin: false, PhoneNumber: "+971565785811", OwnsCar: true, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: true, Order: 11, CompletedInRound: false, Notes: "" },
  { MemberID: "user12", Name: "Ramesh", username: "Ramesh", password: "pass123", Role: "Player", IsAdmin: false, PhoneNumber: "+971564183090", OwnsCar: true, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: true, Order: 12, CompletedInRound: false, Notes: "" },
  { MemberID: "user13", Name: "Ismail", username: "Ismail", password: "pass123", Role: "Player", IsAdmin: false, PhoneNumber: "+971502968699", OwnsCar: true, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: true, Order: 13, CompletedInRound: false, Notes: "" },
  { MemberID: "user14", Name: "Santosh", username: "Santosh", password: "pass123", Role: "Player", IsAdmin: false, PhoneNumber: "+971503573561", OwnsCar: true, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: true, Order: 14, CompletedInRound: false, Notes: "" },
  { MemberID: "user15", Name: "Vivek", username: "Vivek", password: "pass123", Role: "Player", IsAdmin: false, PhoneNumber: "+971522636788", OwnsCar: true, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: true, Order: 15, CompletedInRound: false, Notes: "" },
  { MemberID: "user16", Name: "Vibin", username: "Vibin", password: "pass123", Role: "Player", IsAdmin: false, PhoneNumber: "+971506911783", OwnsCar: true, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: true, Order: 16, CompletedInRound: false, Notes: "" },
  { MemberID: "user17", Name: "Tanveer", username: "Tanveer", password: "pass123", Role: "Player", IsAdmin: false, PhoneNumber: "+971566583447", OwnsCar: true, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: true, Order: 17, CompletedInRound: false, Notes: "" },
  { MemberID: "user18", Name: "Mahir", username: "Mahir", password: "pass123", Role: "Player", IsAdmin: false, PhoneNumber: "+971525914034", OwnsCar: true, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: true, Order: 18, CompletedInRound: false, Notes: "" },
  { MemberID: "user19", Name: "Kunhi", username: "Kunhi", password: "pass123", Role: "Player", IsAdmin: false, PhoneNumber: "+971508493458", OwnsCar: true, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: true, Order: 19, CompletedInRound: false, Notes: "" },
  { MemberID: "user20", Name: "Javeed", username: "Javeed", password: "pass123", Role: "Player", IsAdmin: true, PhoneNumber: "+971558707475", OwnsCar: true, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: true, Order: 20, CompletedInRound: false, Notes: "" },
  { MemberID: "user21", Name: "Sahir", username: "Sahir", password: "pass123", Role: "Player", IsAdmin: false, PhoneNumber: "+971561266531", OwnsCar: true, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: true, Order: 21, CompletedInRound: false, Notes: "" },
  { MemberID: "user22", Name: "Dr. Himayat", username: "Dr. Himayat", password: "pass123", Role: "Player", IsAdmin: false, PhoneNumber: "+971551044364", OwnsCar: true, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: true, Order: 22, CompletedInRound: false, Notes: "" },
  { MemberID: "user23", Name: "Geejo", username: "Geejo", password: "pass123", Role: "Player", IsAdmin: false, PhoneNumber: "+971528004152", OwnsCar: true, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: true, Order: 23, CompletedInRound: false, Notes: "" },
  { MemberID: "user24", Name: "Jojo", username: "Jojo", password: "pass123", Role: "Player", IsAdmin: false, PhoneNumber: "+971508547752", OwnsCar: true, Status: MemberStatus.Active, RotationEligible: "Yes", PenaltyEligible: true, Order: 24, CompletedInRound: false, Notes: "" },
  { MemberID: "user25", Name: "Sarang", username: "Sarang", password: "pass123", Role: "Player", IsAdmin: false, PhoneNumber: "+971567707646", OwnsCar: false, Status: MemberStatus.Active, RotationEligible: "No", PenaltyEligible: false, Order: 25, CompletedInRound: false, Notes: "" },
  { MemberID: "user26", Name: "Sooraj", username: "Sooraj", password: "pass123", Role: "Player", IsAdmin: false, PhoneNumber: "+971552086266", OwnsCar: false, Status: MemberStatus.Active, RotationEligible: "No", PenaltyEligible: false, Order: 26, CompletedInRound: false, Notes: "" },
  { MemberID: "user27", Name: "Adil Habeeb", username: "Adil Habeeb", password: "pass123", Role: "Player", IsAdmin: false, PhoneNumber: "+971555992766", OwnsCar: false, Status: MemberStatus.Active, RotationEligible: "No", PenaltyEligible: false, Order: 27, CompletedInRound: false, Notes: "" },
  { MemberID: "user28", Name: "Arun Nair", username: "Arun Nair", password: "pass123", Role: "Player", IsAdmin: false, PhoneNumber: "+971507496190", OwnsCar: false, Status: MemberStatus.Active, RotationEligible: "No", PenaltyEligible: false, Order: 28, CompletedInRound: false, Notes: "" },
  { MemberID: "user29", Name: "Duminda", username: "Duminda", password: "pass123", Role: "Player", IsAdmin: false, PhoneNumber: "+971588903441", OwnsCar: false, Status: MemberStatus.Active, RotationEligible: "No", PenaltyEligible: false, Order: 29, CompletedInRound: false, Notes: "" },
  { MemberID: "user30", Name: "Manoj", username: "Manoj", password: "pass123", Role: "Player", IsAdmin: false, PhoneNumber: "+971553409334", OwnsCar: false, Status: MemberStatus.Active, RotationEligible: "No", PenaltyEligible: false, Order: 30, CompletedInRound: false, Notes: "" }
];

const newMatches: Omit<KitTrackerEntry, 'ProvisionalAssignee' | 'KitResponsible' | 'TakenOnBehalfOf' | 'WeeksHeld' | 'Reason' | 'DeferredMemberID' | 'Notes'>[] = [
    { Date: '2025-12-27', DueDate: '2025-12-27', GroundLatLong: { lat: 25.0763, lng: 55.1886 }, GeoRadiusMeters: 250, CutoffTime: '22:45', Status: KitStatus.Scheduled, MatchOn: false },
    { Date: '2025-12-20', DueDate: '2025-12-20', GroundLatLong: { lat: 25.0763, lng: 55.1886 }, GeoRadiusMeters: 250, CutoffTime: '22:45', Status: KitStatus.Scheduled, MatchOn: false },
    { Date: '2025-12-13', DueDate: '2025-12-13', GroundLatLong: { lat: 25.0763, lng: 55.1886 }, GeoRadiusMeters: 250, CutoffTime: '22:45', Status: KitStatus.Scheduled, MatchOn: false },
    { Date: '2025-12-06', DueDate: '2025-12-06', GroundLatLong: { lat: 25.0763, lng: 55.1886 }, GeoRadiusMeters: 250, CutoffTime: '22:45', Status: KitStatus.Scheduled, MatchOn: false },
    { Date: '2025-11-29', DueDate: '2025-11-29', GroundLatLong: { lat: 25.0763, lng: 55.1886 }, GeoRadiusMeters: 250, CutoffTime: '22:45', Status: KitStatus.Scheduled, MatchOn: false },
    { Date: '2025-11-22', DueDate: '2025-11-22', GroundLatLong: { lat: 25.0763, lng: 55.1886 }, GeoRadiusMeters: 250, CutoffTime: '22:45', Status: KitStatus.Scheduled, MatchOn: false },
    { Date: '2025-11-15', DueDate: '2025-11-15', GroundLatLong: { lat: 25.0763, lng: 55.1886 }, GeoRadiusMeters: 250, CutoffTime: '22:45', Status: KitStatus.Scheduled, MatchOn: false },
    { Date: '2025-11-08', DueDate: '2025-11-08', GroundLatLong: { lat: 25.0763, lng: 55.1886 }, GeoRadiusMeters: 250, CutoffTime: '22:45', Status: KitStatus.Scheduled, MatchOn: false },
    { Date: '2025-11-01', DueDate: '2025-11-01', GroundLatLong: { lat: 25.0763, lng: 55.1886 }, GeoRadiusMeters: 250, CutoffTime: '22:45', Status: KitStatus.Scheduled, MatchOn: false },
    { Date: '2025-10-25', DueDate: '2025-10-25', GroundLatLong: { lat: 25.0763, lng: 55.1886 }, GeoRadiusMeters: 250, CutoffTime: '22:45', Status: KitStatus.Scheduled, MatchOn: false },
    { Date: '2025-10-18', DueDate: '2025-10-18', GroundLatLong: { lat: 25.0763, lng: 55.1886 }, GeoRadiusMeters: 250, CutoffTime: '22:45', Status: KitStatus.Scheduled, MatchOn: false },
    { Date: '2025-10-11', DueDate: '2025-10-11', GroundLatLong: { lat: 25.0763, lng: 55.1886 }, GeoRadiusMeters: 250, CutoffTime: '22:45', Status: KitStatus.Scheduled, MatchOn: false },
    { Date: '2025-10-04', DueDate: '2025-10-04', GroundLatLong: { lat: 25.0763, lng: 55.1886 }, GeoRadiusMeters: 250, CutoffTime: '22:45', Status: KitStatus.Scheduled, MatchOn: false },
    { Date: '2025-09-27', DueDate: '2025-09-27', GroundLatLong: { lat: 25.0763, lng: 55.1886 }, GeoRadiusMeters: 250, CutoffTime: '22:45', Status: KitStatus.Scheduled, MatchOn: false },
    { Date: '2025-09-20', DueDate: '2025-09-20', GroundLatLong: { lat: 25.0763, lng: 55.1886 }, GeoRadiusMeters: 250, CutoffTime: '22:45', Status: KitStatus.Scheduled, MatchOn: false },
    { Date: '2025-09-13', DueDate: '2025-09-13', GroundLatLong: { lat: 25.0763, lng: 55.1886 }, GeoRadiusMeters: 250, CutoffTime: '22:45', Status: KitStatus.Upcoming, MatchOn: true },
];

export const INITIAL_KIT_TRACKER: KitTrackerEntry[] = newMatches.map(match => ({
    ...match,
    ProvisionalAssignee: '',
    KitResponsible: '',
    TakenOnBehalfOf: '',
    WeeksHeld: 0,
    Notes: '',
    Reason: AssignmentReason.Rotation,
}));

export const INITIAL_ARRIVALS: Arrival[] = [];

const activeMembers = INITIAL_TEAM_MEMBERS.filter(m => m.Status === MemberStatus.Active);
INITIAL_KIT_TRACKER.forEach(match => {
    activeMembers.forEach(member => {
        INITIAL_ARRIVALS.push({
            ArrivalID: `arr-${member.MemberID}-${match.Date}`,
            MatchDate: match.Date,
            Member: member.MemberID,
            ArrivalTime: null,
            CheckInLatLong: null,
        });
    });
});
