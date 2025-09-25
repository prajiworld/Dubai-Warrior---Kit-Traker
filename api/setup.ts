import { sql, db } from '@vercel/postgres';
import { INITIAL_TEAM_MEMBERS, INITIAL_KIT_TRACKER, INITIAL_ARRIVALS } from '../constants';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const client = await db.connect();
    try {
        await client.sql`BEGIN`;

        // Create Tables
        await client.sql`
            CREATE TABLE IF NOT EXISTS team_members (
                "MemberID" TEXT PRIMARY KEY,
                "Name" TEXT NOT NULL,
                "username" TEXT NOT NULL UNIQUE,
                "password" TEXT NOT NULL,
                "Role" TEXT,
                "IsAdmin" BOOLEAN,
                "PhoneNumber" TEXT,
                "OwnsCar" BOOLEAN,
                "Status" TEXT,
                "RotationEligible" TEXT,
                "PenaltyEligible" BOOLEAN,
                "Order" INTEGER,
                "CompletedInRound" BOOLEAN,
                "Notes" TEXT
            );
        `;

        await client.sql`
            CREATE TABLE IF NOT EXISTS kit_tracker_entries (
                "Date" TEXT PRIMARY KEY,
                "DueDate" TEXT,
                "GroundLatLong" JSONB,
                "GeoRadiusMeters" INTEGER,
                "CutoffTime" TEXT,
                "ProvisionalAssignee" TEXT,
                "KitResponsible" TEXT,
                "TakenOnBehalfOf" TEXT,
                "Status" TEXT,
                "WeeksHeld" INTEGER,
                "Notes" TEXT,
                "MatchOn" BOOLEAN,
                "Reason" TEXT,
                "DeferredMemberID" TEXT
            );
        `;

        await client.sql`
            CREATE TABLE IF NOT EXISTS arrivals (
                "ArrivalID" TEXT PRIMARY KEY,
                "MatchDate" TEXT,
                "Member" TEXT,
                "ArrivalTime" TEXT,
                "CheckInLatLong" JSONB
            );
        `;
        
        // Seed Data if tables are empty
        const { rows: memberCount } = await client.sql`SELECT COUNT(*) FROM team_members`;
        if (memberCount[0].count === '0') {
            for (const member of INITIAL_TEAM_MEMBERS) {
                await client.sql`
                    INSERT INTO team_members ("MemberID", "Name", "username", "password", "Role", "IsAdmin", "PhoneNumber", "OwnsCar", "Status", "RotationEligible", "PenaltyEligible", "Order", "CompletedInRound", "Notes")
                    VALUES (${member.MemberID}, ${member.Name}, ${member.username}, ${member.password}, ${member.Role}, ${member.IsAdmin}, ${member.PhoneNumber}, ${member.OwnsCar}, ${member.Status}, ${member.RotationEligible}, ${member.PenaltyEligible}, ${member.Order}, ${member.CompletedInRound}, ${member.Notes});
                `;
            }
        }
        
        const { rows: kitCount } = await client.sql`SELECT COUNT(*) FROM kit_tracker_entries`;
        if (kitCount[0].count === '0') {
            for (const entry of INITIAL_KIT_TRACKER) {
                 await client.sql`
                    INSERT INTO kit_tracker_entries ("Date", "DueDate", "GroundLatLong", "GeoRadiusMeters", "CutoffTime", "ProvisionalAssignee", "KitResponsible", "TakenOnBehalfOf", "Status", "WeeksHeld", "Notes", "MatchOn", "Reason", "DeferredMemberID")
                    VALUES (${entry.Date}, ${entry.DueDate}, ${JSON.stringify(entry.GroundLatLong)}, ${entry.GeoRadiusMeters}, ${entry.CutoffTime}, ${entry.ProvisionalAssignee}, ${entry.KitResponsible}, ${entry.TakenOnBehalfOf}, ${entry.Status}, ${entry.WeeksHeld}, ${entry.Notes}, ${entry.MatchOn}, ${entry.Reason}, ${entry.DeferredMemberID});
                `;
            }
        }

        const { rows: arrivalCount } = await client.sql`SELECT COUNT(*) FROM arrivals`;
        if (arrivalCount[0].count === '0') {
            for (const arrival of INITIAL_ARRIVALS) {
                await client.sql`
                    INSERT INTO arrivals ("ArrivalID", "MatchDate", "Member", "ArrivalTime", "CheckInLatLong")
                    VALUES (${arrival.ArrivalID}, ${arrival.MatchDate}, ${arrival.Member}, ${arrival.ArrivalTime}, ${arrival.CheckInLatLong ? JSON.stringify(arrival.CheckInLatLong) : null});
                `;
            }
        }

        await client.sql`COMMIT`;
        return res.status(200).json({ message: 'Database setup complete.' });
    } catch (error) {
        await client.sql`ROLLBACK`;
        console.error('Database setup failed:', error);
        return res.status(500).json({ message: 'Database setup failed.', error });
    } finally {
        client.release();
    }
}
