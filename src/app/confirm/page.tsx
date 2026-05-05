import Image from "next/image"
import styles from "../styles/page.module.css"
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function ConfirmPage() {
    const cookieStore = await cookies()
    const pending = cookieStore.get('signup-pending')
    
    if (!pending) {
        redirect('/')
      }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
      <h2>Confirm your sign up</h2>
        An email has been sent to your sign up address. 
        <a href='/dashboard'>dash it</a>
      </main>
    </div>
  );
}