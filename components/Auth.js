import React from "react";
import styles from "../styles/Auth.module.css";
const Auth = ({ supabase }) => {
  const signInWithGithub = () => {
    supabase.auth.signIn({
      provider: "github",
    });
  };
  return (
    <div className={styles.container}>
      <button className={styles.github} onClick={signInWithGithub}>
        Login with github
      </button>
    </div>
  );
};

export default Auth;
