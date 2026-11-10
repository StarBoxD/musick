import {
  evaluateAudiusTrack,
  sanitizeAudiusTrackToSong,
  isValidStreamUrl,
  type AudiusTrack,
} from "../../lib/music/license-filter";

export type LicenseTestResult = {
  id: number;
  scenario: string;
  expected: string;
  actual: string;
  passed: boolean;
  details?: unknown;
};

export function runLicenseScenarios(): LicenseTestResult[] {
  const results: LicenseTestResult[] = [];
  const recordTest = (
    id: number,
    scenario: string,
    expected: string,
    actual: string,
    condition: boolean,
    details?: unknown
  ) => {
    results.push({ id, scenario, expected, actual, passed: condition, details });
  };

  // Senaryo 1: Geçerli lisanslı parça
  const track1: AudiusTrack = {
    id: "trk-valid-01",
    title: "Duman - Senden Daha Güzel",
    duration: 215,
    is_streamable: true,
    is_available: true,
    is_delete: false,
    is_unlisted: false,
    is_stream_gated: false,
    access: { stream: true },
    license: "All Rights Reserved",
    permalink: "/duman/senden-daha-guzel",
    user: { name: "Duman" },
    genre: "Rock",
  };
  const decision1 = evaluateAudiusTrack(track1);
  const song1 = sanitizeAudiusTrackToSong(track1);
  recordTest(
    1,
    "Geçerli lisanslı parça",
    "allowed: true, status: VERIFIED, Song oluşturulur",
    `allowed: ${decision1.allowed}, status: ${decision1.allowed ? decision1.licenseStatus : "none"}, songId: ${song1?.trackId}`,
    decision1.allowed === true &&
      decision1.licenseStatus === "VERIFIED" &&
      song1 !== null &&
      song1.license === "All Rights Reserved",
    { decision1, song1 }
  );

  // Senaryo 2: Lisans bilgisi eksik parça (Safe Default: LICENSE_UNVERIFIED)
  const track2: AudiusTrack = {
    ...track1,
    id: "trk-missing-lic-02",
    title: "Ezhel - Geceler",
    duration: 223,
    license: null,
    permalink: "/ezhel/geceler",
    user: { name: "Ezhel" },
    genre: "Hip-Hop",
  };
  const decision2 = evaluateAudiusTrack(track2);
  const song2 = sanitizeAudiusTrackToSong(track2);
  recordTest(
    2,
    "Lisans bilgisi eksik parça (Safe Default: LICENSE_UNVERIFIED)",
    "allowed: true, status: LICENSE_UNVERIFIED, Telifsiz veya lisanslı etiketlenmez",
    `allowed: ${decision2.allowed}, status: ${decision2.allowed ? decision2.licenseStatus : "none"}, label: ${decision2.allowed ? decision2.licenseLabel : "none"}`,
    decision2.allowed === true &&
      decision2.licenseStatus === "LICENSE_UNVERIFIED" &&
      song2 !== null &&
      song2.license.includes("Doğrulanmamış") &&
      !song2.license.includes("All Rights Reserved"),
    { decision2, song2 }
  );

  // Senaryo 3: Bilinmeyen lisans türü
  const track3: AudiusTrack = {
    ...track1,
    id: "trk-unknown-lic-03",
    title: "Bilinmeyen Lisanslı Şarkı",
    duration: 195,
    license: "Custom-Proprietary-Unrecognized-Tag-123",
    user: { name: "Sanatçı" },
  };
  const decision3 = evaluateAudiusTrack(track3);
  const song3 = sanitizeAudiusTrackToSong(track3);
  recordTest(
    3,
    "Bilinmeyen lisans türü",
    "allowed: true, status: LICENSE_UNVERIFIED, otomatik geçerli lisans sayılmaz",
    `allowed: ${decision3.allowed}, status: ${decision3.allowed ? decision3.licenseStatus : "none"}, label: ${decision3.allowed ? decision3.licenseLabel : "none"}`,
    decision3.allowed === true &&
      decision3.licenseStatus === "LICENSE_UNVERIFIED" &&
      song3 !== null &&
      song3.license.includes("Doğrulanmamış Lisans"),
    { decision3, song3 }
  );

  // Senaryo 4: Stream erişimi kapalı parça
  const track4: AudiusTrack = {
    id: "trk-stream-disabled-04",
    title: "Akışı Kapalı Şarkı",
    duration: 210,
    is_streamable: false,
    is_available: true,
    license: "All Rights Reserved",
  };
  const decision4 = evaluateAudiusTrack(track4);
  const song4 = sanitizeAudiusTrackToSong(track4);
  recordTest(
    4,
    "Stream erişimi kapalı parça",
    "allowed: false, reason: NOT_STREAMABLE, song: null",
    `allowed: ${decision4.allowed}, reason: ${decision4.allowed ? "none" : decision4.reason}`,
    !decision4.allowed && decision4.reason === "NOT_STREAMABLE" && song4 === null,
    { decision4 }
  );

  // Senaryo 5: Gated parça
  const track5: AudiusTrack = {
    id: "trk-gated-05",
    title: "NFT Gated Track",
    duration: 200,
    is_streamable: true,
    is_available: true,
    is_stream_gated: true,
    stream_conditions: { nft_contract: "0xdeadbeef" },
    access: { stream: false },
    license: "All Rights Reserved",
  };
  const decision5 = evaluateAudiusTrack(track5);
  const song5 = sanitizeAudiusTrackToSong(track5);
  recordTest(
    5,
    "Gated parça (Erişim izni olmayan)",
    "allowed: false, reason: STREAM_GATED, song: null",
    `allowed: ${decision5.allowed}, reason: ${decision5.allowed ? "none" : decision5.reason}`,
    !decision5.allowed && decision5.reason === "STREAM_GATED" && song5 === null,
    { decision5 }
  );

  // Senaryo 6: Silinmiş parça
  const track6: AudiusTrack = {
    id: "trk-deleted-06",
    title: "Silinmiş Parça",
    duration: 180,
    is_streamable: true,
    is_available: true,
    is_delete: true,
    license: "CC BY 4.0",
  };
  const decision6 = evaluateAudiusTrack(track6);
  const song6 = sanitizeAudiusTrackToSong(track6);
  recordTest(
    6,
    "Silinmiş parça",
    "allowed: false, reason: DELETED, song: null",
    `allowed: ${decision6.allowed}, reason: ${decision6.allowed ? "none" : decision6.reason}`,
    !decision6.allowed && decision6.reason === "DELETED" && song6 === null,
    { decision6 }
  );

  return results;
}
