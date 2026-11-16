SET local check_function_bodies = off;

CREATE TABLE "public"."posts" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "post"       text,
  "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "url"        text                     NOT NULL DEFAULT ''::text,
  "status"     text                     NOT NULL DEFAULT 'pending'::text,
  CONSTRAINT "posts_pkey" PRIMARY KEY (id),
  CONSTRAINT "posts_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'processed'::text]))),
  "uid"        uuid                     NOT NULL DEFAULT auth.uid()
);

ALTER TABLE "public"."posts"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."profile" (
  "id"          uuid                        NOT NULL,
  "email"       text                        NOT NULL,
  "status"      text                        NOT NULL DEFAULT 'inactive'::text,
  "valid_until" timestamp without time zone,
  CONSTRAINT "profile_email_key" UNIQUE (email),
  CONSTRAINT "profile_pkey" PRIMARY KEY (id),
  CONSTRAINT "profile_status_check" CHECK ((status = ANY (ARRAY['inactive'::text, 'active'::text])))
);

ALTER TABLE "public"."profile"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."summaries" (
  "post_id"    uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "email"      text                     NOT NULL,
  "url_id"     uuid                     NOT NULL,
  "post"       text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "summaries_pkey" PRIMARY KEY (post_id)
);

ALTER TABLE "public"."summaries"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."urls" (
  "url_id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "url"    text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending'::text,
  "email"  text NOT NULL,
  CONSTRAINT "unique_email_url" UNIQUE (email, url),
  CONSTRAINT "urls_pkey" PRIMARY KEY (url_id),
  CONSTRAINT "urls_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'processed'::text])))
);

ALTER TABLE "public"."urls"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
BEGIN
  INSERT INTO public.profile (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
  RETURNS event_trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog'
  AS $function$
DECLARE
  cmd record;
  tbl name;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        SELECT c.relname INTO tbl FROM pg_catalog.pg_class c WHERE c.oid = cmd.objid;
        EXECUTE format('alter table if exists %I.%I enable row level security', cmd.schema_name, tbl);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

ALTER TABLE "public"."profile"
  ADD CONSTRAINT "profile_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."summaries"
  ADD CONSTRAINT "summaries_email_fkey" FOREIGN KEY (email) REFERENCES public.profile(email) ON DELETE CASCADE;

ALTER TABLE "public"."urls"
  ADD CONSTRAINT "urls_email_fkey" FOREIGN KEY (email) REFERENCES public.profile(email) ON DELETE CASCADE;

ALTER TABLE "public"."summaries"
  ADD CONSTRAINT "summaries_url_id_fkey" FOREIGN KEY (url_id) REFERENCES public.urls(url_id) ON DELETE CASCADE;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "Users can read own profile" ON "public"."profile"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = id));

CREATE EVENT TRIGGER "ensure_rls"
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION "public"."rls_auto_enable"();

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."posts" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."posts" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."posts" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."posts" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profile" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."profile" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profile" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profile" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."summaries" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."summaries" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."summaries" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."summaries" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."urls" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."urls" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."urls" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."urls" TO "service_role";

ALTER TABLE "public"."posts"
  ADD CONSTRAINT "posts_uid_fkey" FOREIGN KEY (uid) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE POLICY "Allow authenticated users to insert their own posts" ON "public"."posts"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((auth.uid() = uid));

CREATE POLICY "Allow users to view only their own posts" ON "public"."posts"
  FOR SELECT
  TO "authenticated"
  USING ((auth.uid() = uid));

CREATE POLICY "Enable update for users based on uid" ON "public"."posts"
  FOR UPDATE
  TO PUBLIC
  USING ((auth.uid() = uid))
  WITH CHECK ((auth.uid() = uid));

CREATE POLICY "Users can delete their own posts" ON "public"."posts"
  FOR DELETE
  TO "authenticated"
  USING ((auth.uid() = uid));

