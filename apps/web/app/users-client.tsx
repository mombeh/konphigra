"use client";

import { Button } from "@repo/ui/button";
import styles from "./page.module.css";

export default function UsersClient({ users }: { users: any[] }) {
  return (
    <div className={styles.page}>
      <div>
        <h1>Users from SDK</h1>
        <pre>{JSON.stringify(users, null, 2)}</pre>
      </div>

      <Button appName="web" className={styles.secondary}>
        Open alert
      </Button>
    </div>
  );
}
