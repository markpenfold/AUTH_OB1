
import styles from "../styles/page.module.css"

export default function AuthError() {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
         <h1>uh oh, Auth Code Error!</h1>
          <a href='/'>Home</a>
        </main>
      </div>
    );
  }