import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

/** Default Open Graph image for the admin console. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0A0A0A",
          color: "#F7F5F2",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "Arial",
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: "0.2em" }}>
          QAIDILIFE ADMIN
        </div>
        <div style={{ fontSize: 28, marginTop: 20, opacity: 0.8 }}>
          Operations console
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
