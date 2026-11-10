import fs from "fs";
import path from "path";
import * as esbuild from "esbuild";
import { getHarnessEntryCode } from "./harness-entry-code";

const SUPABASE_CLIENT_SHIM = `
  export function createClient() {
    const state = window.__VYBE_TEST_STATE__ || {};
    const defaultSongs = state.songs || [];
    const playlists = [
      { id: "pl-1", name: "Gece Sürüşü", created_at: "2026-11-10T10:00:00Z" },
      { id: "pl-2", name: "Anadolu Rock Klasikleri", created_at: "2026-11-09T10:00:00Z" },
    ];
    const makeBuilder = (table) => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        order: () => {
          if (table === "favorites") {
            return Promise.resolve({
              data: defaultSongs.slice(0, 3).map((s) => ({
                song: s,
                track_id: s.trackId,
                created_at: "2026-11-10T10:00:00Z",
              })),
              error: null,
            });
          }
          if (table === "playlists") {
            return Promise.resolve({ data: playlists, error: null });
          }
          if (table === "playlist_tracks") {
            return Promise.resolve({
              data: defaultSongs.slice(0, 3).map((s) => ({
                song: s,
                created_at: "2026-11-10T10:00:00Z",
              })),
              error: null,
            });
          }
          return Promise.resolve({ data: [], error: null });
        },
        insert: (payload) => ({
          select: () => ({
            single: () =>
              Promise.resolve({
                data: {
                  id: "pl-new",
                  name: payload?.name || "Yeni Liste",
                  created_at: new Date().toISOString(),
                },
                error: null,
              }),
          }),
          then: (cb) => Promise.resolve({ data: null, error: null }).then(cb),
        }),
        update: () => chain,
        delete: () => chain,
        upsert: () => Promise.resolve({ data: null, error: null }),
        single: () => Promise.resolve({ data: playlists[0], error: null }),
        then: (cb) => Promise.resolve({ data: [], error: null }).then(cb),
      };
      return chain;
    };
    return {
      auth: {
        getUser: async () => ({ data: { user: { id: "usr-vybe-test" } }, error: null }),
        signOut: async () => ({ error: null }),
      },
      from: (table) => makeBuilder(table),
    };
  }
`;

export async function buildReactMountBundle(): Promise<string> {
  const shimPlugin: esbuild.Plugin = {
    name: "vybe-next-supabase-shims",
    setup(build) {
      build.onResolve({ filter: /^next\/link$/ }, () => ({
        path: "next-link-shim",
        namespace: "shim",
      }));
      build.onLoad({ filter: /^next-link-shim$/, namespace: "shim" }, () => ({
        contents: `
          import React from "react";
          export default function Link({ href, children, ...rest }) {
            return React.createElement("a", { href, ...rest }, children);
          }
        `,
        loader: "tsx",
        resolveDir: process.cwd(),
      }));

      build.onResolve({ filter: /^next\/navigation$/ }, () => ({
        path: "next-nav-shim",
        namespace: "shim",
      }));
      build.onLoad({ filter: /^next-nav-shim$/, namespace: "shim" }, () => ({
        contents: `
          export function useRouter() {
            return { push: () => {}, refresh: () => {}, replace: () => {} };
          }
        `,
        loader: "ts",
        resolveDir: process.cwd(),
      }));

      build.onResolve({ filter: /^@\/lib\/supabase\/client$/ }, () => ({
        path: "supabase-client-shim",
        namespace: "shim",
      }));
      build.onLoad({ filter: /^supabase-client-shim$/, namespace: "shim" }, () => ({
        resolveDir: process.cwd(),
        contents: SUPABASE_CLIENT_SHIM,
        loader: "ts",
      }));

      build.onResolve({ filter: /^@\// }, (args) => {
        const sub = args.path.slice(2);
        const candidates = [
          path.resolve(process.cwd(), sub + ".tsx"),
          path.resolve(process.cwd(), sub + ".ts"),
          path.resolve(process.cwd(), sub, "index.tsx"),
          path.resolve(process.cwd(), sub, "index.ts"),
        ];
        for (const c of candidates) {
          if (fs.existsSync(c)) return { path: c };
        }
        return { path: path.resolve(process.cwd(), sub) };
      });
    },
  };

  const result = await esbuild.build({
    stdin: {
      contents: getHarnessEntryCode(),
      resolveDir: process.cwd(),
      sourcefile: "harness-entry.tsx",
      loader: "tsx",
    },
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    target: ["chrome110"],
    jsx: "automatic",
    plugins: [shimPlugin],
    define: {
      "process.env.NODE_ENV": '"development"',
    },
  });

  return result.outputFiles[0].text;
}
