import styles from "../styles/Auth.module.css";

const Auth = ({ supabase }) => {
  const signInWithGithub = async (evt) => {
    evt.preventDefault();
    supabase.auth.signInWithOAuth({
      provider: "github",
    });
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Supabase Chat</h1>
      <button className={styles.github} onClick={signInWithGithub}>
        Log in with GitHub
      </button>
    </div>
  );
};

export default Auth;
