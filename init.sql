CREATE TABLE public.audiobooks (
    id serial PRIMARY KEY NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    subtitle text,
    author text,
    year smallint,
    encodedby text,
    copyright text,
    cover text,
    duration real,
    file text,
    audible_removed boolean DEFAULT false NOT NULL
);

