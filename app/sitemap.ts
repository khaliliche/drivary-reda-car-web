import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://drivarycar.com";

  return [
    {
      url: base,
      lastModified: new Date(),
    },
    {
      url: `${base}/vehicules`,
      lastModified: new Date(),
    },
    {
      url: `${base}/conditions-generales`,
      lastModified: new Date(),
    },
  ];
}

