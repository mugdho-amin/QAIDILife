import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

/** Generate the default Open Graph image for QAIDILife. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#ffffff",
          color: "#000000",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "Arial",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: "0.1em" }}>
          QAIDILIFE
        </div>
        <div style={{ fontSize: 32, marginTop: 20 }}>
          Premium essentials for Bengali wardrobes.
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
