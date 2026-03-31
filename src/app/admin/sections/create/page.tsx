import { apiServer } from '@/lib/api-server';
import { Class } from '@/types';
import CreateSectionClient from './client';

async function getClasses() {
  try {
    const data = await apiServer<{ classes: Class[] }>('/classes?limit=1000');
    return data.classes;
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    return [];
  }
}

export default async function CreateSectionPage() {
  const classes = await getClasses();
  return <CreateSectionClient classes={classes} />;
}
