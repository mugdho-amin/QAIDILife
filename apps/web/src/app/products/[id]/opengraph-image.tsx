import { ImageResponse } from "next/og";
import { fetchProductForSeo } from "@/lib/server-product";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

/** Dynamic Open Graph image for product pages. */
export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await fetchProductForSeo(id);
  const title = product?.title_en ?? "QAIDILife";
  const price = product
    ? `BDT ${product.price.amount.toLocaleString("en-BD")}`
    : "Premium Essentials";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "linear-gradient(135deg, #f5f5f5 0%, #ffffff 60%)",
          color: "#000000",
          padding: "80px",
          position: "relative",
          fontFamily: "Arial",
        }}
      >
        {product?.primary_image ? (
          <img
            src={product.primary_image}
            alt={title}
            style={{
              position: "absolute",
              inset: "0",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.25,
            }}
          />
        ) : null}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ fontSize: 20, letterSpacing: "0.3em", opacity: 0.7 }}>
            QAIDILIFE
          </div>
          <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: "0.08em" }}>
            {title.toUpperCase()}
          </div>
          <div style={{ fontSize: 28, letterSpacing: "0.2em" }}>{price}</div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
