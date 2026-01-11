import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
module.exports = (phase: string, { defaultConfig }: { defaultConfig: NextConfig }): NextConfig => {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return {
      rewrites: () => [
        {
          source: "/RPC2",
          destination: "http://localhost:8888/RPC2",
        }
      ]
    }
  }

  return {
    output: "export"
  }
}
