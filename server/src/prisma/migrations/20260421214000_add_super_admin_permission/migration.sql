DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'UserPermission'
          AND e.enumlabel = 'SUPER_ADMIN'
    ) THEN
        ALTER TYPE "UserPermission" ADD VALUE 'SUPER_ADMIN';
    END IF;
END$$;
