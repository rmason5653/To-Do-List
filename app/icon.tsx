import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// App icon, generated at build from the brand kit: PAR in American Captain
// (display punch — an icon is pure punch territory) on midnight, with the
// signature red proof underline.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default async function Icon() {
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
            fontSize: 240,
            fontFamily: "AmericanCaptain",
            letterSpacing: 5,
            display: "flex",
          }}
        >
          PAR
        </div>
        <div
          style={{
            width: 250,
            height: 24,
            background: "#E20602",
            marginTop: 4,
          }}
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
