import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// iOS home-screen icon — same mark as /icon at Apple's 180px spec.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const americanCaptain = await readFile(
    join(process.cwd(), "app/fonts/American_Captain.ttf"),
  );
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B0B0D",
        }}
      >
        <div
          style={{
            color: "#F5F2EC",
            fontSize: 84,
            fontFamily: "AmericanCaptain",
            letterSpacing: 2,
            display: "flex",
          }}
        >
          PAR
        </div>
        <div
          style={{ width: 88, height: 9, background: "#E20602", marginTop: 2 }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "AmericanCaptain", data: americanCaptain, weight: 900, style: "normal" },
      ],
    },
  );
}
