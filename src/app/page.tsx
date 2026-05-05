import Image from "next/image";
import styles from "../app/styles/page.module.css"

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <a href='/dashboard'>dash it</a>
      </main>
    </div>
  );
}
