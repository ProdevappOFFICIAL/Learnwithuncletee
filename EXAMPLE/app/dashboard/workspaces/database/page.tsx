 "use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Database = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/workspaces/database/questions');
  }, [router]);

  return null;
};

export default Database;
