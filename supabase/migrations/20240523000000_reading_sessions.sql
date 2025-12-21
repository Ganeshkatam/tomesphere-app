-- Create reading_sessions table
create table if not exists reading_sessions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) not null,
    book_id uuid references books(id) not null,
    started_at timestamp with time zone default timezone('utc'::text, now()) not null,
    ended_at timestamp with time zone,
    duration_seconds integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table reading_sessions enable row level security;

-- Policies
create policy "Users can view their own reading sessions"
    on reading_sessions for select
    using (auth.uid() = user_id);

create policy "Users can insert their own reading sessions"
    on reading_sessions for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own reading sessions"
    on reading_sessions for update
    using (auth.uid() = user_id);

-- Admins can view all sessions (Policy depends on how admin role is defined, assuming existence of admin check function or role)
-- Simplistic admin policy if 'admin' claim exists:
create policy "Admins can view all reading sessions"
    on reading_sessions for select
    using (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );
