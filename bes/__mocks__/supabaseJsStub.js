// "mantik" sınamalarında EXPO_PUBLIC_SUPABASE_* hiç tanımlı değildir, yani
// `communityAvailable` her zaman `false`tur ve gerçek `createClient` asla
// çağrılmaz (bkz. `src/features/community/client.ts`) — bu sahte modül
// yalnız `import` zincirinin ts-jest altında çökmemesi için var.
module.exports = { createClient: () => ({}) };
