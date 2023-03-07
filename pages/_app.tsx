import "@/styles/globals.css";
import type { AppProps } from "next/app";
import useSupabase from "../utils/useSupabase";

export default function App({ Component, pageProps }: AppProps) {
  const { currentUser, session, supabase } = useSupabase();

  return (
    <Component
      currentUser={currentUser}
      session={session}
      supabase={supabase}
      {...pageProps}
    />
  );
}
