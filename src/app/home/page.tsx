'use client'

import React, { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut as LogOutIcon, MoreVertical, Moon, Sun } from 'lucide-react'
import { Fira_Code, Inter } from 'next/font/google'
import { collection, doc, getDoc, setDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { useMediaQuery } from 'react-responsive';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import ContentFrame from '@/components/ui/ContentFrame';
import ActivityCard from '@/components/ui/ActivityCard';
import AppBar from '@/components/ui/AppBar';

const firaCode = Fira_Code({ subsets: ['latin'] })
const inter = Inter({ subsets: ['latin'] })

interface Material {
  id: string;
  name: string;
  description: string;
  icon: string;
  url: string;
  type: 'embed' | 'external';
  order: number;
}

interface Activity {
  id: string;
  name: string;
  order: number;
  materials: Material[];
}

interface Phase {
  id: string;
  name: string;
  order: number;
  activities: Activity[];
}

const Particle = ({ isDarkMode }: { isDarkMode: boolean }) => {
  const [position, setPosition] = useState({ x: Math.random() * 100, y: Math.random() * 100 });

  useEffect(() => {
    const moveParticle = () => {
      setPosition({
        x: Math.random() * 100,
        y: Math.random() * 100
      });
    };

    const interval = setInterval(moveParticle, Math.random() * 3000 + 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className={`absolute rounded-full ${isDarkMode ? 'bg-blue-300' : 'bg-blue-400'}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: '1px',
        height: '1px',
        opacity: 1,
        transition: 'all 2s ease-in-out'
      }}
    />
  );
};

export default function HomePage() {
  const [userName, setUserName] = useState('');
  const [userFicha, setUserFicha] = useState('');
  const [phases, setPhases] = useState<Phase[]>([]);
  const [userProgress, setUserProgress] = useState<{[key: string]: boolean}>({});
  const [userLikes, setUserLikes] = useState<{[key: string]: boolean}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();
  const isMobile = useMediaQuery({ query: '(max-width: 640px)' });
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [isContentFrameOpen, setIsContentFrameOpen] = useState(false);

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

        await loadUserProgress(user.uid);
        await loadUserLikes(user.uid);
        await loadPhasesData();
      } else {
        router.push('/login');
      }
    });

    return () => {
      darkModeMediaQuery.removeEventListener('change', handleChange);
      unsubscribe();
    };
  }, [router]);

  const loadUserProgress = async (userId: string) => {
    try {
      const userProgressDoc = await getDoc(doc(db, 'userProgress', userId));
      if (userProgressDoc.exists()) {
        setUserProgress(userProgressDoc.data() as {[key: string]: boolean});
      } else {
        setUserProgress({});
      }
    } catch (error) {
      console.error("Error loading user progress:", error);
    }
  };

  const loadUserLikes = async (userId: string) => {
    try {
      const userLikesDoc = await getDoc(doc(db, 'userLikes', userId));
      if (userLikesDoc.exists()) {
        setUserLikes(userLikesDoc.data() as {[key: string]: boolean});
      } else {
        setUserLikes({});
      }
    } catch (error) {
      console.error("Error loading user likes:", error);
    }
  };

  const loadPhasesData = async () => {
    try {
      const phasesCollection = collection(db, 'phases');
      const phasesSnapshot = await getDocs(phasesCollection);
      const phasesData: Phase[] = [];

      for (const phaseDoc of phasesSnapshot.docs) {
        const phaseData = phaseDoc.data() as Phase;
        phaseData.id = phaseDoc.id;
        phaseData.activities = [];

        const activitiesCollection = collection(db, `phases/${phaseDoc.id}/activities`);
        const activitiesSnapshot = await getDocs(activitiesCollection);

        for (const activityDoc of activitiesSnapshot.docs) {
          const activityData = activityDoc.data() as Activity;
          activityData.id = activityDoc.id;
          activityData.materials = [];

          const materialsCollection = collection(db, `phases/${phaseDoc.id}/activities/${activityDoc.id}/materials`);
          const materialsSnapshot = await getDocs(query(materialsCollection, orderBy('order')));

          activityData.materials = materialsSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            description: doc.data().description,
            icon: doc.data().icon,
            url: doc.data().url,
            type: doc.data().type,
            order: doc.data().order
          } as Material));

          phaseData.activities.push(activityData);
        }

        phasesData.push(phaseData);
      }

      phasesData.sort((a, b) => (a.order || 0) - (b.order || 0));
      phasesData.forEach(phase => {
        phase.activities.sort((a, b) => (a.order || 0) - (b.order || 0));
      });

      setPhases(phasesData);
    } catch (error) {
      console.error("Error loading phases data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleMaterialClick = async (material: Material) => {
    const user = auth.currentUser;
    if (!user) return;

    const newProgress = { ...userProgress, [material.id]: !userProgress[material.id] };
    setUserProgress(newProgress);

    await setDoc(doc(db, 'userProgress', user.uid), newProgress, { merge: true });
  };

  const handleMaterialLike = async (material: Material) => {
    const user = auth.currentUser;
    if (!user) return;

    const newLikes = { ...userLikes, [material.id]: !userLikes[material.id] };
    setUserLikes(newLikes);

    await setDoc(doc(db, 'userLikes', user.uid), newLikes, { merge: true });
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleMaterialOpen = (material: Material) => {
    setSelectedMaterial(material);
    setIsContentFrameOpen(true);
  };

  const handleContentFrameClose = () => {
    setIsContentFrameOpen(false);
    setSelectedMaterial(null);
  };

  return (
    <div className={`relative min-h-screen ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-100 text-black'}`}>
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <Particle key={i} isDarkMode={isDarkMode} />
        ))}
      </div>
      <div className="relative">
      <AppBar 
          userName={userName}
          userFicha={userFicha}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          handleLogout={handleLogout}
        />
        <main className="container mx-auto px-4 pt-16">
          <h2 className={`text-2xl ${isDarkMode ? 'font-light' : 'font-normal'} mb-8 ${inter.className} text-center pt-4`}>
            Aprendizaje en{' '}
            <span className={`${firaCode.className} text-blue-600 dark:text-blue-400`}>
              MicroCodeApp
            </span>
          </h2>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
              {phases.map((phase) => (
                <Card key={phase.id} className={`overflow-hidden border border-gray-300 dark:border-gray-600 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'} shadow-lg`}>
                  <CardHeader>
                    <CardTitle className={`text-lg ${isDarkMode ? 'font-light' : 'font-normal'} ${firaCode.className}`}>{phase.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {phase.activities.map((activity) => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        userProgress={userProgress}
                        userLikes={userLikes}
                        handleMaterialClick={handleMaterialClick}
                        handleMaterialLike={handleMaterialLike}
                        handleMaterialOpen={handleMaterialOpen}
                        isDarkMode={isDarkMode}
                      />
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
      <ContentFrame
        isOpen={isContentFrameOpen}
        onClose={handleContentFrameClose}
        material={selectedMaterial}
      />
    </div>
  );
}