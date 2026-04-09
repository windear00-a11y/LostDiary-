'use client';

import React, { useEffect, useState } from 'react';
import { chapterService, Chapter } from '@/lib/services/chapter-service';
import { authService } from '@/lib/services/auth-service';
import { BookRenderer } from './BookRenderer';

export const LifeBookView = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChapters = async () => {
    setLoading(true);
    try {
      const user = await authService.getUser();
      if (user) {
        const data = await chapterService.fetchChapters(user.id);
        setChapters(data);
      }
    } catch (error) {
      console.error("Failed to load chapters", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChapters();
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-gray-400">Loading your story...</div>;
  }

  return <BookRenderer chapters={chapters} />;
};
