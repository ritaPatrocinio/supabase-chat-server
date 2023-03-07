import Head from "next/head";
import styles from "@/styles/Home.module.css";
import { useEffect, useState } from "react";
import Auth from "../components/Auth";
import Chat from "../components/Chat";

export default function Home({ currentUser, session, supabase }: any) {
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    setLoggedIn(!!session);
  }, [session]);

  return (
    <>
      <Head>
        <title>Supabase Chat App</title>
      </Head>
      <main className={styles.main}>
        {loggedIn ? (
          <Chat
            currentUser={currentUser}
            supabase={supabase}
            session={session}
          />
        ) : (
          <Auth supabase={supabase} />
        )}
      </main>
    </>
  );
}
