import React, { useEffect, useMemo, useState } from 'react';
import { TeamMember, MemberStatus } from '../types';

/** ===============================
 *  Domain types & enums
 *  =============================== */
enum PlayerRole {
  BATSMAN = 'Batsman',
  BOWLER = 'Bowler',
  ALL_ROUNDER = 'All-Rounder',
}

type TeamKey = 'A' | 'B';

type CategoryName =
  | 'Main (All-Rounder)'
  | 'Middle Order (Batsman)'
  | 'Middle Order (Bat) & Main (Bowling)'
  | 'RS (All-Rounder)'
  | 'RS (Bat) & Main (Bowl)'
  | 'RS (Bowl) & Main (Bat)'
  | 'RS (Batsman)'
  | 'RS (Bowl) & Middle Order (Bat)';

type CategoryConfig = {
  name: CategoryName;
  base: number;            // base value in $M
  multiplier: 1 | 2 | 3;   // whole-number multipliers
  min: number;             // min per team
  max: number;             // max per team
  phase: number;           // auction order (1 earliest)
};

interface Player {
  id: number;
  name: string;
  category: CategoryName;
  baseValue: number;   // $M
  role: PlayerRole;
  note?: string;
  sold?: boolean;
  team?: TeamKey;
  finalBid?: number;
}

interface Team {
  key: TeamKey;
  name: string;
  budget: number; // $M (remaining)
  players: Player[];
}

interface DWAuctionPlatformProps {
  teamMembers: TeamMember[];
}

/** ===============================
 *  Defaults (editable in Settings tab)
 *  =============================== */
const DEFAULT_SETTINGS = {
  increment: 1 as 1 | 2 | 3,
  secondsPerLot: 25,
  targetSquad: 14 as 12 | 13 | 14 | 15,
  pursePerTeam: 100,

  // Team names + Captain controls
  teamAName: 'Warriors',
  teamBName: 'Knights',

  captainAName: '',
  captainABase: 0,
  captainBName: '',
  captainBBase: 0,

  categories: [
    { name: 'Main (All-Rounder)',                   base: 7, multiplier: 2, min: 5, max: 6, phase: 8 },
    { name: 'Middle Order (Batsman)',               base: 3, multiplier: 2, min: 0, max: 1, phase: 1 },
    { name: 'Middle Order (Bat) & Main (Bowling)',  base: 4, multiplier: 2, min: 1, max: 1, phase: 2 },
    { name: 'RS (All-Rounder)',                     base: 2, multiplier: 2, min: 2, max: 2, phase: 6 },
    { name: 'RS (Bat) & Main (Bowl)',               base: 3, multiplier: 1, min: 1, max: 2, phase: 4 },
    { name: 'RS (Bowl) & Main (Bat)',               base: 3, multiplier: 1, min: 1, max: 2, phase: 5 },
    { name: 'RS (Batsman)',                         base: 2, multiplier: 1, min: 1, max: 2, phase: 3 },
    { name: 'RS (Bowl) & Middle Order (Bat)',       base: 3, multiplier: 1, min: 0, max: 1, phase: 7 },
  ] as CategoryConfig[],
};

const NEWLINE = '\n';
const fmt = (n: number) => `$${n}M`;

// Stable negative IDs to avoid clashes with derived players
const CAPTAIN_ID_A = -1;
const CAPTAIN_ID_B = -2;

/** ——— celebration confetti (lightweight, CSS only) ——— */
const ConfettiBurst: React.FC = () => {
  const pieces = Array.from({ length: 36 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-120%) rotate(0deg); opacity: 1; }
          100% { transform: translateY(120vh) rotate(720deg); opacity: 0.9; }
        }
      `}</style>
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const duration = 2.2 + Math.random() * 1.4;
        const size = 6 + Math.random() * 10;
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              top: '-10px',
              left: `${left}%`,
              width: `${size}px`,
              height: `${size * 0.6}px`,
              background:
                'linear-gradient(135deg, #FDE68A, #F59E0B, #34D399, #60A5FA, #F472B6)',
              borderRadius: '2px',
              transform: 'translateY(-100%)',
              animation: `confetti-fall ${duration}s ease-in forwards`,
              animationDelay: `${delay}s`,
              opacity: 0.95,
            }}
          />
        );
      })}
    </div>
  );
};

/** ===============================
 *  Component
 *  =============================== */
const DWAuctionPlatform: React.FC<DWAuctionPlatformProps> = ({ teamMembers }) => {
  /** ---------- settings ---------- */
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const phaseOrder = useMemo(
    () => [...settings.categories].sort((a, b) => a.phase - b.phase).map((c) => c.name),
    [settings]
  );
  const catBase = useMemo(
    () =>
      Object.fromEntries(settings.categories.map((c) => [c.name, c.base])) as Record<
        CategoryName,
        number
      >,
    [settings]
  );
  const catMin = useMemo(
    () =>
      Object.fromEntries(settings.categories.map((c) => [c.name, c.min])) as Record<
        CategoryName,
        number
      >,
    [settings]
  );
  const catMax = useMemo(
    () =>
      Object.fromEntries(settings.categories.map((c) => [c.name, c.max])) as Record<
        CategoryName,
        number
      >,
    [settings]
  );

  /** ---------- master data helpers (for dropdowns) ---------- */
  const activeMembers = useMemo(
    () => teamMembers.filter((m) => m.Status === MemberStatus.Active),
    [teamMembers]
  );
  const captainOptions = useMemo(
    () => activeMembers.map((m) => m.Name).sort((a, b) => a.localeCompare(b)),
    [activeMembers]
  );

  /** ---------- players derived from roster ---------- */
  const derivedPlayers = useMemo<Player[]>(() => {
    const active = activeMembers;
    return active
      .map((member, idx) => {
        const category = ((member.DWCategory as CategoryName) || 'RS (Batsman)') as CategoryName;
        const baseValue = catBase[category] ?? 2;
        const role: PlayerRole =
          category.includes('All-Rounder')
            ? PlayerRole.ALL_ROUNDER
            : category.includes('Bowl')
            ? PlayerRole.BOWLER
            : PlayerRole.BATSMAN;
        return { id: idx + 1, name: member.Name, category, baseValue, role };
      })
      .sort((a, b) => phaseOrder.indexOf(a.category) - phaseOrder.indexOf(b.category));
  }, [activeMembers, catBase, phaseOrder]);

  /** ---------- state ---------- */
  const [players, setPlayers] = useState<Player[]>([]);
  const [lotIndex, setLotIndex] = useState(0);
  const [stage, setStage] = useState<'idle' | 'category' | 'player' | 'result'>('idle');
  const [revealCategory, setRevealCategory] = useState<CategoryName | null>(null);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);

  const [currentBid, setCurrentBid] = useState<number | null>(null);
  const [leader, setLeader] = useState<TeamKey | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(settings.secondsPerLot);
  const [isRunning, setIsRunning] = useState(false);

  const [teams, setTeams] = useState<Record<TeamKey, Team>>({
    A: { key: 'A', name: settings.teamAName, budget: settings.pursePerTeam, players: [] },
    B: { key: 'B', name: settings.teamBName, budget: settings.pursePerTeam, players: [] },
  });

  const [soldPlayers, setSoldPlayers] = useState<Player[]>([]);
  const [alert, setAlert] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'auction' | 'settings'>('auction');
  const [showAuctionModal, setShowAuctionModal] = useState(false); // full-screen popup

  // New: sale result snapshot for the modal result screen
  const [saleResult, setSaleResult] = useState<{
    status: 'sold' | 'unsold';
    playerName: string;
    teamName?: string;
    price?: number;
  } | null>(null);

  /** ---------- hydrate ---------- */
  useEffect(() => {
    setPlayers(derivedPlayers);
    setLotIndex(0);
    setStage('idle');
    setLeader(null);
    setSecondsLeft(settings.secondsPerLot);
    setIsRunning(false);
    setCurrentBid(derivedPlayers[0]?.baseValue ?? null);

    // sync purses when purse setting changes (do not wipe rosters)
    setTeams((prev) => ({
      A: { ...prev.A, budget: settings.pursePerTeam, players: prev.A.players },
      B: { ...prev.B, budget: settings.pursePerTeam, players: prev.B.players },
    }));
  }, [derivedPlayers, settings.pursePerTeam, settings.secondsPerLot]);

  // Keep team names in sync with settings edits
  useEffect(() => {
    setTeams((prev) => ({
      A: { ...prev.A, name: settings.teamAName },
      B: { ...prev.B, name: settings.teamBName },
    }));
  }, [settings.teamAName, settings.teamBName]);

  const currentPlayer = players[lotIndex];

  /** ---------- reflect base edits to unsold ---------- */
  useEffect(() => {
    setPlayers((prev) =>
      prev.map((p) => (p.sold ? p : { ...p, baseValue: catBase[p.category] ?? p.baseValue }))
    );
    if (stage !== 'player' && currentPlayer) {
      setCurrentBid(catBase[currentPlayer.category] ?? currentPlayer.baseValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catBase]);

  /** ---------- timer ---------- */
  useEffect(() => {
    if (!isRunning || stage !== 'player' || !currentPlayer || secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [isRunning, stage, currentPlayer, secondsLeft]);
  useEffect(() => {
    if (secondsLeft === 0) handleSellOrUnsold();
  }, [secondsLeft]);

  /** ---------- helpers ---------- */
  const countByCategory = (list: Player[]) =>
    list.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] ?? 0) + 1;
      return acc;
    }, {});

  const applyPhaseOrder = (list: Player[]) =>
    [...list].sort(
      (a, b) => phaseOrder.indexOf(a.category) - phaseOrder.indexOf(b.category)
    );

  const teamCounts = (t: TeamKey) => countByCategory(teams[t].players);
  const canBuyCategory = (t: TeamKey, cat: CategoryName) => (teamCounts(t)[cat] ?? 0) < catMax[cat];

  const wouldViolateMinimums = (t: TeamKey, cat: CategoryName) => {
    const roster = teams[t].players;
    const counts = { ...teamCounts(t), [cat]: (teamCounts(t)[cat] ?? 0) + 1 };
    let unmet = 0;
    settings.categories.forEach((c) => {
      const cur = counts[c.name] ?? 0;
      unmet += Math.max(0, c.min - cur);
    });
    const remainingSlotsAfter = Math.max(0, settings.targetSquad - (roster.length + 1));
    return remainingSlotsAfter < unmet;
  };

  const pulse = (msg: string) => {
    setAlert(msg);
    setTimeout(() => setAlert(null), 2200);
  };

  /** ---------- actions ---------- */
  const placeBid = (teamKey: TeamKey) => {
    if (!currentPlayer || currentBid == null || stage !== 'player') return;

    const t = teams[teamKey];
    const nextBid = Math.max(currentBid, currentPlayer.baseValue) + settings.increment;

    if (nextBid > t.budget) return pulse(`${t.name} doesn't have enough budget for ${fmt(nextBid)}.`);
    if (!canBuyCategory(teamKey, currentPlayer.category))
      return pulse(`${t.name} has reached max for ${currentPlayer.category}.`);
    if (wouldViolateMinimums(teamKey, currentPlayer.category))
      return pulse(`Buying now would break ${t.name}'s minimum quotas.`);

    setCurrentBid(nextBid);
    setLeader(teamKey);
    setSecondsLeft(settings.secondsPerLot); // reset shot clock
  };

  // NEW: proceed step after showing result screen
  const proceedToNextLot = () => {
    setLeader(null);
    setIsRunning(false);
    setSecondsLeft(settings.secondsPerLot);
    setSaleResult(null);

    const nextIndex = lotIndex + 1;
    if (nextIndex < players.length) {
      setLotIndex(nextIndex);
      setStage('idle');
      setCurrentBid(players[nextIndex].baseValue);
    } else {
      setStage('idle');
      pulse('Auction complete! 🎉');
    }
  };

  const handleSellOrUnsold = () => {
    if (!currentPlayer) return;

    if (leader && currentBid != null) {
      const winner = leader;
      const price = currentBid;

      setTeams((prev) => ({
        ...prev,
        [winner]: {
          ...prev[winner],
          budget: prev[winner].budget - price,
          players: [
            ...prev[winner].players,
            { ...currentPlayer, sold: true, team: winner, finalBid: price },
          ],
        },
      }));
      setSoldPlayers((prev) => [
        ...prev,
        { ...currentPlayer, sold: true, team: winner, finalBid: price },
      ]);

      // Alert (existing), plus show Result screen in modal
      pulse(`SOLD: ${currentPlayer.name} to ${teams[winner].name} for ${fmt(price)}.`);
      setSaleResult({
        status: 'sold',
        playerName: currentPlayer.name,
        teamName: teams[winner].name,
        price,
      });
      setStage('result'); // stay in modal with celebration
    } else {
      pulse(`UNSOLD: ${currentPlayer.name}.`);

      // Mark as unsold in local "players" list (optional semantics)
      setPlayers((prev) =>
        prev.map((p, i) => (i === lotIndex ? { ...p, sold: false } : p))
      );

      setSaleResult({
        status: 'unsold',
        playerName: currentPlayer.name,
      });
      setStage('result'); // show UNSOLD message instead of blank
    }
  };

  const randomizeCategory = () => {
    const remaining = players.slice(lotIndex);
    if (remaining.length === 0) return pulse('No players remaining.');
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    const idx = players.indexOf(pick);

    setPendingIndex(idx);
    setRevealCategory(pick.category);
    setStage('category');
    setIsRunning(false);
    setShowAuctionModal(true); // open full-screen popup
  };

  const revealName = () => {
    if (pendingIndex == null) return;
    const selected = players[pendingIndex];

    setPlayers((prev) => {
      const arr = [...prev];
      const [sel] = arr.splice(pendingIndex, 1);
      arr.splice(lotIndex, 0, sel);
      return arr;
    });

    setCurrentBid(selected.baseValue);
    setLeader(null);
    setSecondsLeft(settings.secondsPerLot);
    setStage('player');
    setIsRunning(true);
    setRevealCategory(null);
    setPendingIndex(null);
  };

  const exportCSV = () => {
    const header = ['Player', 'Category', 'Team', 'FinalBid', 'Note'].join(',');
    const body = soldPlayers.map((p) =>
      [p.name, p.category, p.team ?? '', p.finalBid ?? '', (p.note ?? '').replaceAll(',', ';')].join(',')
    );
    const csv = [header, ...body].join(NEWLINE);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dubai-warriors-auction.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  /** ---------- Captain helpers ---------- */
  const getCaptainForTeam = (key: TeamKey, list: Player[]) =>
    list.find((p) => p.note === 'Captain' && p.team === key);

  const makeCaptainPlayer = (key: TeamKey, name: string, base: number): Player => ({
    id: key === 'A' ? CAPTAIN_ID_A : CAPTAIN_ID_B,
    name,
    category: 'Main (All-Rounder)',
    baseValue: base,
    role: PlayerRole.ALL_ROUNDER,
    sold: true,
    team: key,
    finalBid: base,
    note: 'Captain',
  });

  const applyCaptainUpdate = (key: TeamKey) => {
    const capName = key === 'A' ? settings.captainAName.trim() : settings.captainBName.trim();
    const capBaseRaw = key === 'A' ? settings.captainABase : settings.captainBBase;
    const capBase = Math.max(0, Math.floor(Number(capBaseRaw) || 0));

    if (!capName) {
      pulse('Please select a Captain name.');
      return;
    }

    setTeams((prev) => {
      const t = prev[key];
      const existingCaptain = getCaptainForTeam(key, t.players);
      const prevCost = existingCaptain?.finalBid ?? 0;
      const refund = prevCost; // refund previous captain cost first
      const tentativeBudget = t.budget + refund;

      if (capBase > tentativeBudget) {
        pulse(`${t.name} does not have enough budget for captain ${fmt(capBase)}.`);
        return prev; // no change
      }

      const newBudget = tentativeBudget - capBase;
      const newCaptain = makeCaptainPlayer(key, capName, capBase);

      // Replace captain if exists; else push
      const nextPlayers = existingCaptain
        ? t.players.map((p) => (p.note === 'Captain' && p.team === key ? newCaptain : p))
        : [...t.players, newCaptain];

      const updated: Record<TeamKey, Team> = {
        ...prev,
        [key]: {
          ...t,
          budget: newBudget,
          players: nextPlayers,
        },
      };

      // Keep Sold Players list consistent
      setSoldPlayers((prevSold) => {
        const existingSoldCap = prevSold.find((p) => p.note === 'Captain' && p.team === key);
        const capEntry = makeCaptainPlayer(key, capName, capBase);
        return existingSoldCap
          ? prevSold.map((p) => (p.note === 'Captain' && p.team === key ? capEntry : p))
          : [...prevSold, capEntry];
      });

      pulse(`Captain set for Team ${key}: ${capName} at ${fmt(capBase)}.`);
      return updated;
    });
  };

  /** ---------- derived for UI ---------- */
  const upcomingCounts = useMemo(() => {
    const remaining = players.slice(lotIndex).filter((p) => !p.sold);
    const counts = countByCategory(remaining);
    settings.categories.forEach((c) => {
      if (!(c.name in counts)) counts[c.name] = 0;
    });
    return counts;
  }, [players, lotIndex, settings.categories]);

  /** ===============================
   *  UI
   *  =============================== */
  return (
    <div className="bg-gray-900 text-white min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Dubai Warriors — Auction for the Finals</h1>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm">
            Export CSV
          </button>
          <button onClick={() => window.location.reload()} className="border border-gray-600 px-4 py-2 rounded-lg text-sm">
            Reset
          </button>
        </div>
      </div>

      {/* TOP TABS */}
      <div className="mb-6 border-b border-gray-800">
        <nav className="flex gap-6">
          {(['auction', 'settings'] as const).map((tabKey) => {
            const active = activeTab === tabKey;
            const label = tabKey === 'auction' ? 'Auction' : 'Settings';
            return (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                className={`relative pb-3 text-sm font-semibold transition-colors ${
                  active ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {label}
                <span
                  className={`absolute left-0 -bottom-[1px] h-[3px] rounded-full bg-yellow-400 transition-all duration-300 ease-out ${
                    active ? 'w-full opacity-100' : 'w-0 opacity-0'
                  }`}
                />
              </button>
            );
          })}
        </nav>
      </div>

      {/* Team summaries directly under tabs (NOW includes Team Squad) */}
      <div className="grid md:grid-cols-2 gap-4">
        {(['A', 'B'] as TeamKey[]).map((key) => {
          const t = teams[key];
          const spent = t.players.reduce((s, p) => s + (p.finalBid ?? 0), 0);
          const slotsLeft = Math.max(0, settings.targetSquad - t.players.length);
          const avgPerSlot = slotsLeft ? Math.floor(t.budget / slotsLeft) : 0;
          return (
            <div key={t.key} className="rounded-xl border border-gray-700 bg-gray-800 p-4">
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold">{t.name} (Team {t.key})</div>
                <div className="text-sm text-gray-300">
                  Players {t.players.length}/{settings.targetSquad}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                <div>
                  <div className="text-gray-400">Purse (Remaining)</div>
                  <div className="font-semibold">{fmt(t.budget)}</div>
                </div>
                <div>
                  <div className="text-gray-400">Spent</div>
                  <div className="font-semibold">{fmt(spent)}</div>
                </div>
                <div>
                  <div className="text-gray-400">Avg/Slot Left</div>
                  <div className="font-semibold">{fmt(avgPerSlot)}</div>
                </div>
              </div>

              {/* Moved here: Team Squad list */}
              <div className="mt-4">
                <div className="text-xs text-gray-400 mb-1">Team Squad</div>
                <div className="flex flex-wrap gap-2">
                  {t.players.length === 0 && (
                    <span className="text-gray-500 text-xs">No players yet.</span>
                  )}
                  {t.players.map((p) => (
                    <span key={p.id} className="border border-gray-600 text-xs rounded px-2 py-1">
                      {p.name}{p.note === 'Captain' ? ' (C)' : ''} • {fmt(p.finalBid ?? 0)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Team Details Box (Roster removed here; Quotas retained) */}
      <div className="mt-6 rounded-xl border border-gray-700 bg-gray-800 p-4">
        <h2 className="text-xl font-bold mb-4">Team Details</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {(['A', 'B'] as TeamKey[]).map((key) => {
            const team = teams[key];
            const spent = team.players.reduce((s, p) => s + (p.finalBid ?? 0), 0);
            const counts = countByCategory(team.players);
            return (
              <div key={team.key} className="rounded-lg border border-gray-700 p-3 bg-gray-900">
                <h3 className="font-bold text-lg mb-1">
                  {team.name} (Team {team.key})
                </h3>
                <p className="text-sm mb-2">
                  Remaining: <span className="text-yellow-400">{fmt(team.budget)}</span> • Spent: {fmt(spent)} • Players: {team.players.length}/{settings.targetSquad}
                </p>

                <div className="mt-2 text-xs text-gray-300">
                  <div className="font-semibold mb-1">Quotas</div>
                  <div className="space-y-1 max-h-40 overflow-auto pr-1">
                    {settings.categories.map((c) => {
                      const cur = counts[c.name] ?? 0;
                      const color =
                        cur < c.min ? 'text-amber-400' : cur > c.max ? 'text-red-400' : 'text-emerald-400';
                      return (
                        <div key={c.name} className="flex justify-between">
                          <span className="truncate mr-2">{c.name}</span>
                          <span className={`font-semibold ${color}`}>
                            {cur} / {c.min} ({c.max})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Roster block was here – intentionally removed per request */}
              </div>
            );
          })}
        </div>

        {/* Centered Randomize Category Button (only here) */}
        <div className="mt-8 flex justify-center">
          <div className="text-center">
            <h3 className="text-lg text-gray-300 mb-3">Ready to draw the next category?</h3>
            <button
              onClick={randomizeCategory}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded text-lg"
            >
              Randomize Category
            </button>
          </div>
        </div>
      </div>

      {alert && (
        <div className="mt-4 rounded-lg border border-amber-400 bg-amber-100/10 p-3 text-amber-300 text-sm">
          {alert}
        </div>
      )}

      {/* MAIN CONTENT by Tab */}
      {activeTab === 'auction' ? (
        // AUCTION TAB — left column only (Upcoming Categories + Sold Players)
        <div className="mt-6 grid grid-cols-1 gap-4">
          <div className="space-y-4">
            {/* Upcoming Categories */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Upcoming Categories</h2>
                <button
                  className="text-sm border border-gray-600 px-3 py-1 rounded hover:bg-gray-700"
                  onClick={() => setPlayers((p) => applyPhaseOrder(p))}
                >
                  Apply Phase Order
                </button>
              </div>
              <div className="space-y-2 text-sm">
                {Object.entries(upcomingCounts)
                  .sort(
                    (a, b) =>
                      phaseOrder.indexOf(a[0] as CategoryName) - phaseOrder.indexOf(b[0] as CategoryName)
                  )
                  .map(([category, count]) => (
                    <div
                      key={category}
                      className="flex justify-between items-center bg-gray-700 p-2 rounded-lg"
                    >
                      <span className="font-semibold">{category}</span>
                      <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {count as number}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Sold Players */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Sold Players</h2>
              <div className="space-y-2 text-sm">
                {soldPlayers.length === 0 && (
                  <div className="text-gray-400">No players sold yet.</div>
                )}
                {soldPlayers.map((p) => (
                  <div key={p.id} className="bg-gray-700 p-2 rounded-lg">
                    <p className="font-bold">{p.name}{p.note === 'Captain' ? ' (C)' : ''}</p>
                    <p className="text-gray-300">{p.category}{p.note === 'Captain' ? ' • Captain' : ''}</p>
                    <p>
                      Sold to Team {p.team}{' '}
                      for <span className="text-green-400 font-bold">{fmt(p.finalBid ?? 0)}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SETTINGS TAB (enhanced) */
        <div className="mt-6 bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">Settings</h2>

          {/* Team Names */}
          <div className="grid md:grid-cols-2 gap-3 mb-6">
            <LabeledText
              label="Team A Name"
              value={settings.teamAName}
              onChange={(v) => setSettings((s) => ({ ...s, teamAName: v }))}
            />
            <LabeledText
              label="Team B Name"
              value={settings.teamBName}
              onChange={(v) => setSettings((s) => ({ ...s, teamBName: v }))}
            />
          </div>

          {/* Basics */}
          <div className="grid md:grid-cols-4 gap-3">
            <LabeledNumber
              label="Increment ($M)"
              value={settings.increment}
              onChange={(v) =>
                setSettings((s) => ({ ...s, increment: Math.max(1, Math.floor(v)) as 1 | 2 | 3 }))
              }
            />
            <LabeledNumber
              label="Seconds per Player"
              value={settings.secondsPerLot}
              onChange={(v) => setSettings((s) => ({ ...s, secondsPerLot: Math.max(5, Math.floor(v)) }))}
            />
            <LabeledNumber
              label="Target Squad Size"
              value={settings.targetSquad}
              onChange={(v) =>
                setSettings((s) => ({
                  ...s,
                  targetSquad: Math.max(12, Math.min(15, Math.floor(v))) as 12 | 13 | 14 | 15,
                }))
              }
            />
            <LabeledNumber
              label="Purse per Team ($M)"
              value={settings.pursePerTeam}
              onChange={(v) => setSettings((s) => ({ ...s, pursePerTeam: Math.max(1, Math.floor(v)) }))}
            />
          </div>

          {/* Captain Controls (Names from Master Data) */}
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-3">Captains</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Team A Captain */}
              <div className="border border-gray-700 rounded-lg p-3 bg-gray-900">
                <div className="font-semibold mb-2">Team A — {teams.A.name}</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <LabeledSelect
                    label="Captain Name"
                    value={settings.captainAName}
                    options={captainOptions}
                    onChange={(v) => setSettings((s) => ({ ...s, captainAName: v }))}
                  />
                  <LabeledNumber
                    label="Captain Base ($M)"
                    value={settings.captainABase}
                    onChange={(v) => setSettings((s) => ({ ...s, captainABase: Math.max(0, Math.floor(v)) }))}
                  />
                  <div className="flex items-end">
                    <button
                      onClick={() => applyCaptainUpdate('A')}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-3 h-9 rounded"
                    >
                      Apply Captain A
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Applying will refund any previous captain amount to Team A’s purse, then deduct the new base and update the roster.
                </p>
              </div>

              {/* Team B Captain */}
              <div className="border border-gray-700 rounded-lg p-3 bg-gray-900">
                <div className="font-semibold mb-2">Team B — {teams.B.name}</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <LabeledSelect
                    label="Captain Name"
                    value={settings.captainBName}
                    options={captainOptions}
                    onChange={(v) => setSettings((s) => ({ ...s, captainBName: v }))}
                  />
                  <LabeledNumber
                    label="Captain Base ($M)"
                    value={settings.captainBBase}
                    onChange={(v) => setSettings((s) => ({ ...s, captainBBase: Math.max(0, Math.floor(v)) }))}
                  />
                  <div className="flex items-end">
                    <button
                      onClick={() => applyCaptainUpdate('B')}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-3 h-9 rounded"
                    >
                      Apply Captain B
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Applying will refund any previous captain amount to Team B’s purse, then deduct the new base and update the roster.
                </p>
              </div>
            </div>
          </div>

          {/* Editable Category Base Values */}
          <div className="mt-8">
            <div className="text-sm text-gray-300 mb-2">
              Edit Base Values by Category (affects all unsold players in that category)
            </div>
            <div className="overflow-auto border border-gray-700 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left bg-gray-700">
                    <th className="p-2">Category</th>
                    <th className="p-2">Base ($M)</th>
                    <th className="p-2">Min</th>
                    <th className="p-2">Max</th>
                    <th className="p-2">Phase</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.categories.map((c, idx) => (
                    <tr key={c.name} className="border-t border-gray-700">
                      <td className="p-2">{c.name}</td>
                      <td className="p-2">
                        <input
                          type="number"
                          className="h-8 w-24 rounded bg-gray-900 border border-gray-700 px-2"
                          value={c.base}
                          onChange={(e) =>
                            setSettings((s) => {
                              const next = [...s.categories];
                              next[idx] = { ...next[idx], base: Math.max(0, Math.floor(Number(e.target.value) || 0)) };
                              return { ...s, categories: next };
                            })
                          }
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          className="h-8 w-20 rounded bg-gray-900 border border-gray-700 px-2"
                          value={c.min}
                          onChange={(e) =>
                            setSettings((s) => {
                              const next = [...s.categories];
                              next[idx] = { ...next[idx], min: Math.max(0, Math.floor(Number(e.target.value) || 0)) };
                              return { ...s, categories: next };
                            })
                          }
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          className="h-8 w-20 rounded bg-gray-900 border border-gray-700 px-2"
                          value={c.max}
                          onChange={(e) =>
                            setSettings((s) => {
                              const next = [...s.categories];
                              next[idx] = { ...next[idx], max: Math.max(0, Math.floor(Number(e.target.value) || 0)) };
                              return { ...s, categories: next };
                            })
                          }
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          className="h-8 w-20 rounded bg-gray-900 border border-gray-700 px-2"
                          value={c.phase}
                          onChange={(e) =>
                            setSettings((s) => {
                              const next = [...s.categories];
                              next[idx] = { ...next[idx], phase: Math.max(1, Math.floor(Number(e.target.value) || 1)) };
                              return { ...s, categories: next.sort((a, b) => a.phase - b.phase) };
                            })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-xs text-gray-400 mt-2">
              Note: Changing a Base value updates <b>all unsold players</b> in that category and the current lot (if not sold yet).
            </div>
          </div>
        </div>
      )}

      {/* Full-screen Auction Popup */}
      {showAuctionModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowAuctionModal(false)} />
          <div className="relative z-10 w-full h-full p-4 flex items-center justify-center">
            <div className="w-full h-full bg-gray-900 border border-gray-700 rounded-xl p-6 overflow-auto relative">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Live Draw & Bidding</h2>
                <button onClick={() => setShowAuctionModal(false)} className="border border-gray-600 px-3 py-1 rounded">
                  Close
                </button>
              </div>

              {stage === 'category' && (
                <div className="text-center mt-10">
                  <p className="text-sm text-gray-400 mb-2">Category Drawn</p>
                  <h2 className="text-5xl font-extrabold mb-6">{revealCategory}</h2>
                  <button
                    onClick={revealName}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded text-xl"
                  >
                    Show Name
                  </button>
                </div>
              )}

              {stage === 'player' && currentPlayer && (
                <div className="max-w-3xl mx-auto">
                  <h1 className="text-5xl font-extrabold text-yellow-400 mb-2 text-center">{currentPlayer.name}</h1>
                  <p className="text-lg text-gray-300 mb-4 text-center">
                    {currentPlayer.category} | Base Value: {fmt(currentPlayer.baseValue)}
                  </p>

                  <div className="my-8 text-center">
                    <p className="text-2xl mb-2">Current Bid</p>
                    <p className="text-6xl font-bold">{fmt(currentBid ?? currentPlayer.baseValue)}</p>
                    <p className="text-lg mt-2">
                      Highest Bidder:{' '}
                      <span className="text-green-400 font-bold">
                        {leader ? (leader === 'A' ? teams.A.name : teams.B.name) : 'None'}
                      </span>
                    </p>
                    <div className="mt-4 text-sm text-gray-300">
                      Time Left: <span className="font-bold">{secondsLeft}s</span>
                    </div>
                    <div className="w-full bg-gray-700 h-2 rounded mt-2">
                      <div
                        className="bg-green-500 h-2 rounded"
                        style={{ width: `${(secondsLeft / settings.secondsPerLot) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                    <button onClick={() => placeBid('A')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded">
                      Bid {teams.A.name}
                    </button>
                    <button onClick={() => placeBid('B')} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded">
                      Bid {teams.B.name}
                    </button>
                  </div>

                  <div className="max-w-md mx-auto">
                    <button
                      onClick={handleSellOrUnsold}
                      className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-2xl"
                    >
                      {leader
                        ? `SELL TO ${leader === 'A' ? teams.A.name.toUpperCase() : teams.B.name.toUpperCase()}`
                        : 'MARK UNSOLD'}
                    </button>
                    <button
                      onClick={() => setIsRunning((v) => !v)}
                      className="mt-3 w-full border border-gray-500 px-4 py-2 rounded"
                    >
                      {isRunning ? 'Pause' : 'Resume'}
                    </button>
                  </div>
                </div>
              )}

              {/* NEW: Result screen (Sold / Unsold) */}
              {stage === 'result' && saleResult && (
                <div className="relative max-w-3xl mx-auto mt-12 text-center">
                  {saleResult.status === 'sold' && <ConfettiBurst />}
                  <div
                    className={`rounded-2xl p-8 border ${
                      saleResult.status === 'sold'
                        ? 'border-emerald-400 bg-emerald-500/10'
                        : 'border-amber-400 bg-amber-500/10'
                    }`}
                  >
                    <div className="text-6xl mb-4">
                      {saleResult.status === 'sold' ? '🎉' : '🛎️'}
                    </div>
                    <h3 className="text-3xl font-extrabold mb-2">
                      {saleResult.status === 'sold' ? 'PLAYER SOLD' : 'PLAYER UNSOLD'}
                    </h3>
                    <p className="text-xl text-gray-200">
                      {saleResult.status === 'sold' ? (
                        <>
                          {saleResult.playerName} to <span className="font-bold text-emerald-300">{saleResult.teamName}</span> at{' '}
                          <span className="font-bold text-emerald-300">{fmt(saleResult.price ?? 0)}</span>
                        </>
                      ) : (
                        <>
                          {saleResult.playerName} — <span className="font-bold text-amber-300">UNSOLD</span>
                        </>
                      )}
                    </p>
                    <button
                      onClick={proceedToNextLot}
                      className="mt-6 bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 py-3 rounded"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/** small helpers */
function LabeledNumber({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-gray-300">{label}</span>
      <input
        type="number"
        className="h-9 rounded bg-gray-900 border border-gray-700 px-2"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function LabeledText({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-gray-300">{label}</span>
      <input
        type="text"
        className="h-9 rounded bg-gray-900 border border-gray-700 px-2"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function LabeledSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-gray-300">{label}</span>
      <select
        className="h-9 rounded bg-gray-900 border border-gray-700 px-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— Select —</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

export default DWAuctionPlatform;
