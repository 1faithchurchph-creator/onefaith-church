
  CREATE TABLE public."1faithauth" (                                                                                                                             
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),                                                                                                    
    username      VARCHAR UNIQUE NOT NULL,                                                                                                                       
    password      VARCHAR NOT NULL,                                                                                                                              
    created_at    TIMESTAMPTZ DEFAULT now(),
    display_name  VARCHAR NOT NULL,
    is_admin      BOOLEAN DEFAULT false
  );

    INSERT INTO public."1faithauth" (username, password, display_name, is_admin)
  VALUES (
    'vincent',
    '$2b$10$jbYLbBzwdBMFz3HXMXGiL.MWoqN6j0ahxN.StcXdkgn1ZLZfjMHfi',
    'Admin',
    true
  );