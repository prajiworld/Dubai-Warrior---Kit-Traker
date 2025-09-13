// Haversine formula to calculate distance between two lat/lng points
export function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // in metres
  return d;
}

export const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

export const formatTime = (timeString: string | null) => {
    if (!timeString) return "N/A";
    return new Date(timeString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};


export const MEMBER_CSV_TEMPLATE = `Name,username,password,Role,IsAdmin,PhoneNumber,OwnsCar,Status,RotationEligible,PenaltyEligible,Order,Notes
Ben Kenobi,ben_csv,pass123,Player,FALSE,+971501234567,TRUE,Active,Yes,TRUE,10,From CSV
Charlie Daniels,charlie_csv,pass123,Player,FALSE,+971507654321,FALSE,Active,Yes,FALSE,11,From CSV`;

export const MATCH_CSV_TEMPLATE = `Date,DueDate,Lat,Lng,GeoRadiusMeters,CutoffTime,Notes
${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]},${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]},25.0763,55.1886,250,22:45,Friendly Match from CSV`;

export function downloadFile(content: string, fileName: string, contentType: string) {
  const a = document.createElement("a");
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}