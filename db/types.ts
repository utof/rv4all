export interface Session {
  id: string;
  user_id: string | null;
  device_id: string | null;
  image_url: string;
  unsplash_photo_id: string;
  created_at: string;
  reveal_time: string;
}

export interface Submission {
  id: string;
  session_id: string;
  user_response: string;
  submitted_at: string;
}

export interface SessionWithSubmission extends Session {
  submissions: Submission[];
}

export interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  description: string | null;
  user: {
    name: string;
    username: string;
  };
  links: {
    html: string;
  };
}
