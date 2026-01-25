import type { UnsplashPhoto } from "@/db/types";

const UNSPLASH_ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_URL = "https://api.unsplash.com";

export async function getRandomPhoto(): Promise<UnsplashPhoto> {
  if (!UNSPLASH_ACCESS_KEY) {
    throw new Error("EXPO_PUBLIC_UNSPLASH_ACCESS_KEY is not configured");
  }

  const response = await fetch(
    `${UNSPLASH_API_URL}/photos/random?orientation=landscape`,
    {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Unsplash API error: ${response.status}`);
  }

  const data = await response.json();
  return data as UnsplashPhoto;
}

export function getOptimizedImageUrl(
  photo: UnsplashPhoto,
  width: number = 800
): string {
  // Use Unsplash's dynamic resizing
  return `${photo.urls.raw}&w=${width}&fit=crop&q=80`;
}

export function getPhotoAttribution(photo: UnsplashPhoto): string {
  return `Photo by ${photo.user.name} on Unsplash`;
}
