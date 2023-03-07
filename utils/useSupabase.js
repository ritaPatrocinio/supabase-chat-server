import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_API_KEY
);

const useSupabase = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [session, setSession] = useState(supabase.auth.session);

  supabase.auth.onAuthStateChange(async (event, session) => {
    setSession(session);
  });

  useEffect(() => {
    const getCurrentUser = async () => {
      if (session?.user.id) {
        const { data: user } = await supabase
          .from("user")
          .select("*")
          .eq("id", session.user.id);

        if (user.length) {
          const currentUser = user[0];
          supabase
            .channel("custom-update-channel")
            .on(
              "postgres_changes",
              {
                event: "UPDATE",
                schema: "public",
                table: "user",
                filter: `id=eq.${currentUser.id}`,
              },
              (payload) => {
                console.log(
                  "🚀 ~ file: useSupabase.js:47 ~ getCurrentUser ~ payload:",
                  payload
                );
                setCurrentUser(payload.new);
              }
            )
            .subscribe();

          return currentUser;
        } else {
          return null;
        }
      }
    };
    getCurrentUser().then((user) => setCurrentUser(user));
  }, [session]);

  return { currentUser, session, supabase };
};

export default useSupabase;
