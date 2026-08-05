'use client'

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Quiz from '@/components/ui/Quiz';

const QuizPageContent = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const materialId = params.materialId as string;
  const materialUrl = searchParams.get('url') as string;
  const [userName, setUserName] = useState('');
  const [userFicha, setUserFicha] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handleChange);

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const firstName = user.displayName?.split(' ')[0] || 'Usuario';
        setUserName(firstName);

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserFicha(userDoc.data().fichaSENA);
        }
      }
    });

    return () => {
      darkModeMediaQuery.removeEventListener('change', handleChange);
      unsubscribe();
    };
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      // Redirect to login page or handle logout as needed
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (!materialUrl) {
    return <div>Error: URL del material no proporcionada</div>;
  }

  return (
    <Quiz
      materialId={materialId}
      materialUrl={materialUrl}
      userName={userName}
      userFicha={userFicha}
      isDarkMode={isDarkMode}
      toggleDarkMode={toggleDarkMode}
      handleLogout={handleLogout}
    />
  );
};

// useSearchParams exige un límite de Suspense para el prerender en Next 15
const QuizPage = () => (
  <Suspense>
    <QuizPageContent />
  </Suspense>
);

export default QuizPage;