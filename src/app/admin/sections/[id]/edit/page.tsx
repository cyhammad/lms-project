import { apiServer } from '@/lib/api-server';
import type { Class, Section } from '@/types';
import EditSectionClient from './client';
import { notFound } from 'next/navigation';

async function getData(sectionId: string) {
  try {
    const [sectionRes, classesRes] = await Promise.all([
      apiServer<{ section: Section }>(`/sections/${sectionId}`),
      apiServer<{ classes: Class[] }>('/classes?limit=1000'),
    ]);

    if (!sectionRes || !sectionRes.section) {
      return null;
    }

    return {
      section: sectionRes.section,
      classes: classesRes.classes || [],
    };
  } catch (error) {
    console.error('Failed to fetch data for edit section:', error);
    return null;
  }
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditSectionPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getData(id);

  if (!data) {
    notFound();
  }

  const { section, classes } = data;

  return <EditSectionClient section={section} classes={classes} />;
}

