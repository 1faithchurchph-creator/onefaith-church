---
name: Home worship section SQL
description: SQL to set up the images storage bucket and Sunday Worship Service content keys
type: project
---

Setup for the "Sunday Worship Service" section (stored as `reference` for quick re-run in Supabase):

```sql
-- 1. Public storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage policies so the app can read/upload via the anon key
CREATE POLICY "public read images"
  ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "public upload images"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'images');
CREATE POLICY "public update images"
  ON storage.objects FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'images');
CREATE POLICY "public delete images"
  ON storage.objects FOR DELETE TO anon, authenticated
  USING (bucket_id = 'images');

-- 3. Home content rows for the worship section
INSERT INTO public.home_content (key, value) VALUES
  ('worship_title', 'Sunday Worship Service'),
  ('worship_image_left', ''),
  ('worship_image_right', ''),
  ('worship_map_coords', ''),
  ('worship_zoom_link', ''),
  ('worship_map_button', 'View Map & Directions'),
  ('worship_zoom_button', 'Join the Live Service')
ON CONFLICT (key) DO NOTHING;

-- 4. Home content rows for the testimonials + international/replay cards
-- (replay_youtube is the video below the Testimonials heading; testimonial_image_* were removed from the design)
INSERT INTO public.home_content (key, value) VALUES
  ('testimonials_title', 'Testimonials'),
  ('replay_youtube', ''),
  ('international_title', 'International Worship Service'),
  ('international_body', 'Los Angeles USA • Manila Philippines\nPhnom Penh Cambodia • Sydney Australia\nRe-experience our fourth international service\nChrist: Mission, Message, Mutuality, Ministry. God is moving!'),
  ('international_button', 'See Our Fourth International Worship Service'),
  ('replay_title', 'Replay Worship Services'),
  ('replay_body', 'Watch archived communion lesson replays and get re-inspired by past series.'),
  ('replay_button', 'Go to Prior Sunday Sermons and Lessons'),
  ('empower_title', 'Empower & Connect'),
  ('empower_body', 'Sometimes, life can make anyone feel powerless and disconnected. One Faith and Christ’s love empower and connect us through the work of the spirit. We need spiritual strength to meet the challenges that each state of life brings, so we host regular Faith Team meetings by life stage. Feel free to check one out!'),
  ('empower_button', 'Contact Us to Find a Small Group')
ON CONFLICT (key) DO NOTHING;

-- 5. Home content rows for the ministries carousel (4 rotating photos) + give video
INSERT INTO public.home_content (key, value) VALUES
  ('ministry_image_1', ''),
  ('ministry_image_2', ''),
  ('ministry_image_3', ''),
  ('ministry_image_4', ''),
  ('give_youtube', '')
ON CONFLICT (key) DO NOTHING;

-- 6. Home content rows for the navigation image (navbar_cover) + welcome tagline (with logo) + card titles/buttons + give button
INSERT INTO public.home_content (key, value) VALUES
  ('navbar_cover', ''),
  ('tagline_heading', 'Welcome to One Faith Church in Christ Philippines'),
  ('tagline_body', 'Come experience the faith and love of Jesus and the resurrection power of the Holy Spirit.'),
  ('tagline_image', ''),
  ('ministries_title', 'Ministries'),
  ('ministries_button', 'View Ministries'),
  ('events_title', 'Upcoming Events'),
  ('events_button', 'View Upcoming Events'),
  ('give_button', 'Click here to find ways to give')
ON CONFLICT (key) DO NOTHING;

-- 7. Cleanup: remove home_content rows no longer used by the app
-- (navbar_logo: navbar logo is fixed in code and not admin-editable)
DELETE FROM public.home_content WHERE key IN ('navbar_logo');
```
