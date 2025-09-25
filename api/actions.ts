import { sql, db } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';
import type { TeamMember, KitTrackerEntry, Arrival } from '../types';
import { MemberStatus, KitStatus, AssignmentReason } from '../types';
import { getDistanceInMeters } from '../utils/helpers';

// This handler will act as a router for different backend actions
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { action, payload } = req.body;
    const client = await db.connect();

    try {
        await client.sql`BEGIN`;
        let result: any = { success: true };

        switch (action) {
            case 'SIGN_UP': {
                const { userData } = payload;
                const { rows: existing } = await client.sql`SELECT * FROM team_members WHERE lower(username) = lower(${userData.username.trim()})`;
                if (existing.length > 0) {
                    throw new Error("This username is already taken.");
                }
                const { rows: maxOrderRows } = await client.sql`SELECT MAX("Order") as max_order FROM team_members`;
                const maxOrder = maxOrderRows[0].max_order || 0;
                
                const newUser: TeamMember = {
                    ...userData,
                    MemberID: `user${Date.now()}`,
                    Role: 'Player', IsAdmin: false, OwnsCar: false, Status: MemberStatus.Active,
                    RotationEligible: 'No', PenaltyEligible: true, Order: maxOrder + 1,
                    CompletedInRound: false, Notes: 'New user',
                };

                await client.sql`INSERT INTO team_members ("MemberID", "Name", "username", "password", "PhoneNumber", "Role", "IsAdmin", "OwnsCar", "Status", "RotationEligible", "PenaltyEligible", "Order", "CompletedInRound", "Notes") VALUES (${newUser.MemberID}, ${newUser.Name}, ${newUser.username}, ${newUser.password}, ${newUser.PhoneNumber}, ${newUser.Role}, ${newUser.IsAdmin}, ${newUser.OwnsCar}, ${newUser.Status}, ${newUser.RotationEligible}, ${newUser.PenaltyEligible}, ${newUser.Order}, ${newUser.CompletedInRound}, ${newUser.Notes});`;
                delete newUser.password;
                result.user = newUser;
                break;
            }
             case 'UPDATE_PROFILE': {
                const { userId, updatedData } = payload;
                await client.sql`UPDATE team_members SET "PhoneNumber" = ${updatedData.PhoneNumber}, "OwnsCar" = ${updatedData.OwnsCar} WHERE "MemberID" = ${userId};`;
                break;
            }
            case 'CHANGE_PASSWORD': {
                const { userId, passwords } = payload;
                const { rows } = await client.sql`SELECT password FROM team_members WHERE "MemberID" = ${userId}`;
                if (rows.length === 0 || rows[0].password !== passwords.current) {
                    result = { success: false, message: 'Incorrect current password.' };
                } else {
                    await client.sql`UPDATE team_members SET "password" = ${passwords.new} WHERE "MemberID" = ${userId}`;
                    result = { success: true, message: 'Password updated successfully!' };
                }
                break;
            }
            case 'CHECK_IN': {
                const { userId, matchDate, coords } = payload;
                const { rows: matchRows } = await client.sql`SELECT "GroundLatLong", "GeoRadiusMeters" FROM kit_tracker_entries WHERE "Date" = ${matchDate}`;
                if (matchRows.length === 0) throw new Error("Match not found.");
                const match = matchRows[0];
                
                const distance = getDistanceInMeters(coords.lat, coords.lng, match.groundlatlong.lat, match.groundlatlong.lng);
                
                if (distance <= match.georadiusmeters) {
                    const now = new Date().toISOString();
                    const arrivalId = `arr-${userId}-${matchDate}`;
                    await client.sql`
                        INSERT INTO arrivals ("ArrivalID", "MatchDate", "Member", "ArrivalTime", "CheckInLatLong")
                        VALUES (${arrivalId}, ${matchDate}, ${userId}, ${now}, ${JSON.stringify(coords)})
                        ON CONFLICT ("ArrivalID") DO UPDATE SET "ArrivalTime" = ${now}, "CheckInLatLong" = ${JSON.stringify(coords)};
                    `;
                    result.message = `Checked in successfully at ${new Date(now).toLocaleTimeString()}`;
                } else {
                    result = { success: false, message: `You are ${Math.round(distance)} meters away from the ground. Please get closer.` };
                }
                break;
            }
            case 'CONFIRM_KIT_DUTY': {
                const { userId, matchDate } = payload;
                await client.sql`UPDATE kit_tracker_entries SET "KitResponsible" = ${userId} WHERE "Date" = ${matchDate} AND "ProvisionalAssignee" = ${userId};`;
                break;
            }
            case 'DECLINE_KIT_DUTY': {
                const { userId, userName, newAssigneeId, newAssigneeName, matchDate } = payload;
                await client.sql`UPDATE kit_tracker_entries SET "ProvisionalAssignee" = ${newAssigneeId}, "KitResponsible" = ${newAssigneeId}, "Reason" = ${AssignmentReason.Reassigned}, "Notes" = "Notes" || ' Duty declined by ${userName}, reassigned to ${newAssigneeName}.' WHERE "Date" = ${matchDate} AND "ProvisionalAssignee" = ${userId};`;
                break;
            }
            case 'ADD_TEAM_MEMBER': {
                const { memberData } = payload;
                const newMember: TeamMember = {
                    ...memberData,
                    MemberID: `user${Date.now()}`,
                    CompletedInRound: false,
                };
                await client.sql`INSERT INTO team_members ("MemberID", "Name", "username", "password", "Role", "IsAdmin", "PhoneNumber", "OwnsCar", "Status", "RotationEligible", "PenaltyEligible", "Order", "CompletedInRound", "Notes") VALUES (${newMember.MemberID}, ${newMember.Name}, ${newMember.username}, ${newMember.password}, ${newMember.Role}, ${newMember.IsAdmin}, ${newMember.PhoneNumber}, ${newMember.OwnsCar}, ${newMember.Status}, ${newMember.RotationEligible}, ${newMember.PenaltyEligible}, ${newMember.Order}, ${newMember.CompletedInRound}, ${newMember.Notes});`;
                break;
            }
            case 'UPDATE_TEAM_MEMBER': {
                const { member } = payload;
                await client.sql`UPDATE team_members SET "Name"=${member.Name}, "username"=${member.username}, "Role"=${member.Role}, "IsAdmin"=${member.IsAdmin}, "PhoneNumber"=${member.PhoneNumber}, "OwnsCar"=${member.OwnsCar}, "Status"=${member.Status}, "RotationEligible"=${member.RotationEligible}, "PenaltyEligible"=${member.PenaltyEligible}, "Order"=${member.Order}, "CompletedInRound"=${member.CompletedInRound}, "Notes"=${member.Notes} WHERE "MemberID"=${member.MemberID};`;
                if(member.password) { // only update password if provided
                    await client.sql`UPDATE team_members SET "password"=${member.password} WHERE "MemberID"=${member.MemberID};`;
                }
                break;
            }
            case 'DELETE_TEAM_MEMBER': {
                await client.sql`DELETE FROM team_members WHERE "MemberID" = ${payload.memberId};`;
                break;
            }
            case 'ADD_MATCH': {
                const { matchData } = payload;
                 const newMatch: KitTrackerEntry = {
                    ...matchData,
                    ProvisionalAssignee: '', KitResponsible: '', TakenOnBehalfOf: '',
                    Status: KitStatus.Scheduled, WeeksHeld: 0, MatchOn: false,
                    Reason: AssignmentReason.Rotation,
                };
                await client.sql`INSERT INTO kit_tracker_entries ("Date", "DueDate", "GroundLatLong", "GeoRadiusMeters", "CutoffTime", "Notes", "Status", "MatchOn", "Reason") VALUES (${newMatch.Date}, ${newMatch.DueDate}, ${JSON.stringify(newMatch.GroundLatLong)}, ${newMatch.GeoRadiusMeters}, ${newMatch.CutoffTime}, ${newMatch.Notes}, ${newMatch.Status}, ${newMatch.MatchOn}, ${newMatch.Reason});`;
                break;
            }
            case 'UPDATE_MATCH': {
                 const { match } = payload;
                 await client.sql`UPDATE kit_tracker_entries SET "DueDate"=${match.DueDate}, "GroundLatLong"=${JSON.stringify(match.GroundLatLong)}, "GeoRadiusMeters"=${match.GeoRadiusMeters}, "CutoffTime"=${match.CutoffTime}, "Notes"=${match.Notes}, "Status"=${match.Status} WHERE "Date"=${match.Date};`;
                 break;
            }
            case 'DELETE_MATCH': {
                await client.sql`DELETE FROM kit_tracker_entries WHERE "Date" = ${payload.date};`;
                await client.sql`DELETE FROM arrivals WHERE "MatchDate" = ${payload.date};`;
                break;
            }
             case 'ASSIGN_PLAYER_TO_MATCH': {
                const { memberId, matchDate } = payload;
                await client.sql`UPDATE kit_tracker_entries SET "ProvisionalAssignee" = '' WHERE "ProvisionalAssignee" = ${memberId};`;
                if (matchDate) {
                    await client.sql`UPDATE kit_tracker_entries SET "ProvisionalAssignee" = ${memberId}, "Reason" = ${AssignmentReason.Rotation} WHERE "Date" = ${matchDate};`;
                }
                break;
            }
            case 'CONFIRM_MATCH_STATUS': {
                const { matchDate, newStatus } = payload;
                const matchOn = newStatus === KitStatus.Upcoming;
                await client.sql`UPDATE kit_tracker_entries SET "Status" = ${newStatus}, "MatchOn" = ${matchOn} WHERE "Date" = ${matchDate};`;
                break;
            }
            case 'REASSIGN_KIT': {
                await client.sql`UPDATE kit_tracker_entries SET "KitResponsible" = ${payload.newMemberId}, "Reason" = ${AssignmentReason.Reassigned} WHERE "Date" = ${payload.matchDate};`;
                break;
            }
            case 'CONFIRM_HANDOVER': {
                const { matchDate } = payload;
                const { rows: matchRows } = await client.sql`SELECT "KitResponsible", "ProvisionalAssignee" FROM kit_tracker_entries WHERE "Date" = ${matchDate}`;
                if (matchRows.length > 0) {
                    const responsibleMemberId = matchRows[0].kitresponsible || matchRows[0].provisionalassignee;
                    await client.sql`UPDATE kit_tracker_entries SET "Status" = ${KitStatus.Completed} WHERE "Date" = ${matchDate};`;
                    await client.sql`UPDATE team_members SET "CompletedInRound" = TRUE WHERE "MemberID" = ${responsibleMemberId};`;
                    
                    const { rows: incompleteRows } = await client.sql`SELECT COUNT(*) FROM team_members WHERE "RotationEligible" = 'Yes' AND "Status" = 'Active' AND "CompletedInRound" = FALSE;`;
                    if (incompleteRows[0].count === '0') {
                        await client.sql`UPDATE team_members SET "CompletedInRound" = FALSE WHERE "RotationEligible" = 'Yes' AND "Status" = 'Active';`;
                    }
                }
                break;
            }
            case 'APPLY_LATE_PENALTY': {
                const { matchDate, penalizedMemberId } = payload;
                const { rows: nextMatchRows } = await client.sql`
                    SELECT "Date" FROM kit_tracker_entries 
                    WHERE "Date" > ${matchDate} AND "Status" = ${KitStatus.Scheduled}
                    ORDER BY "Date" ASC LIMIT 1;
                `;
                if (nextMatchRows.length > 0) {
                    const nextMatchDate = nextMatchRows[0].date;
                    await client.sql`
                        UPDATE kit_tracker_entries 
                        SET "ProvisionalAssignee" = ${penalizedMemberId}, 
                            "KitResponsible" = ${penalizedMemberId},
                            "Reason" = ${AssignmentReason.PenaltyLate}
                        WHERE "Date" = ${nextMatchDate};
                    `;
                } else {
                   console.log(`No upcoming match found to apply penalty for member ${penalizedMemberId}`);
                }
                break;
            }
            case 'BULK_ADD_MEMBERS': {
                const { data } = payload;
                let added = 0;
                let skipped = 0;
                for (const [index, row] of data.entries()) {
                    try {
                        if (!row.username || !row.password) {
                            skipped++; continue;
                        }
                        const { rows: existing } = await client.sql`SELECT "MemberID" FROM team_members WHERE lower(username) = lower(${row.username})`;
                        if (existing.length > 0) {
                            skipped++; continue;
                        }
                        const newMember: Omit<TeamMember, 'MemberID'|'CompletedInRound'> = {
                            Name: row.Name, username: row.username, password: row.password,
                            Role: row.Role || 'Player', IsAdmin: row.IsAdmin?.toLowerCase() === 'true',
                            PhoneNumber: row.PhoneNumber, OwnsCar: row.OwnsCar?.toLowerCase() === 'true',
                            Status: (row.Status as MemberStatus) || MemberStatus.Active,
                            RotationEligible: (row.RotationEligible as "Yes" | "No") || 'Yes',
                            PenaltyEligible: row.PenaltyEligible?.toLowerCase() !== 'false',
                            Order: parseInt(row.Order, 10) || 100, Notes: row.Notes || '',
                        };
                         await client.sql`INSERT INTO team_members ("MemberID", "Name", "username", "password", "Role", "IsAdmin", "PhoneNumber", "OwnsCar", "Status", "RotationEligible", "PenaltyEligible", "Order", "CompletedInRound", "Notes") VALUES (${`user${Date.now()}${index}`}, ${newMember.Name}, ${newMember.username}, ${newMember.password}, ${newMember.Role}, ${newMember.IsAdmin}, ${newMember.PhoneNumber}, ${newMember.OwnsCar}, ${newMember.Status}, ${newMember.RotationEligible}, ${newMember.PenaltyEligible}, ${newMember.Order}, FALSE, ${newMember.Notes});`;
                        added++;
                    } catch (e) {
                        console.error('Skipping member row due to error:', row, e);
                        skipped++;
                    }
                }
                result = { ...result, added, skipped };
                break;
            }
            case 'BULK_ADD_MATCHES': {
                const { data } = payload;
                let added = 0;
                let skipped = 0;
                for (const row of data) {
                    try {
                        if (!row.Date || !row.CutoffTime) {
                           skipped++; continue;
                        }
                        const { rows: existing } = await client.sql`SELECT "Date" FROM kit_tracker_entries WHERE "Date" = ${row.Date}`;
                        if (existing.length > 0) {
                            skipped++; continue;
                        }
                        const newMatch = {
                            Date: row.Date, DueDate: row.DueDate || row.Date,
                            GroundLatLong: { lat: parseFloat(row.Lat), lng: parseFloat(row.Lng) },
                            GeoRadiusMeters: parseInt(row.GeoRadiusMeters, 10),
                            CutoffTime: row.CutoffTime, Notes: row.Notes || '',
                            Status: KitStatus.Scheduled, MatchOn: false,
                            Reason: AssignmentReason.Rotation,
                        };
                        await client.sql`INSERT INTO kit_tracker_entries ("Date", "DueDate", "GroundLatLong", "GeoRadiusMeters", "CutoffTime", "Notes", "Status", "MatchOn", "Reason") VALUES (${newMatch.Date}, ${newMatch.DueDate}, ${JSON.stringify(newMatch.GroundLatLong)}, ${newMatch.GeoRadiusMeters}, ${newMatch.CutoffTime}, ${newMatch.Notes}, ${newMatch.Status}, ${newMatch.MatchOn}, ${newMatch.Reason});`;
                        added++;
                    } catch (e) {
                        console.error('Skipping match row due to error:', row, e);
                        skipped++;
                    }
                }
                result = { ...result, added, skipped };
                break;
            }
            default:
                throw new Error(`Action not recognized: ${action}`);
        }
        
        await client.sql`COMMIT`;
        res.status(200).json(result);

    } catch (error) {
        await client.sql`ROLLBACK`;
        console.error(`Error in action "${action}":`, error);
        res.status(500).json({ success: false, message: error.message, action });
    } finally {
        client.release();
    }
}