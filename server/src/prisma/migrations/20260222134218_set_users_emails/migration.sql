-- This is an empty migration.
update "User"
set email = concat(
    nickname, '@example.com')
where 
    email is null;