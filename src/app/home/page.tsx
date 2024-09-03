'use client'

import React, { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { LogOut as LogOutIcon, BookOpen, CheckCircle, Menu as MenuIcon } from 'lucide-react'
import { Fira_Code, Inter } from 'next/font/google'
import { collection, doc, getDoc, setDoc, getDocs } from 'firebase/firestore';
import { useMediaQuery } from 'react-responsive';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const firaCode = Fira_Code({ subsets: ['latin'] })
const inter = Inter({ subsets: ['latin'] })

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
      className={`absolute w-1 h-1 rounded-full ${isDarkMode ? 'bg-blue-300' : 'bg-violet-300'} opacity-50`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transition: 'all 2s ease-in-out'
      }}
    />
  );
};

const Loader = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-violet-500"></div>
  </div>
);

interface Material {
  id: string;
  name: string;
  completed: boolean;
  url: string;
  type: 'embed' | 'external';
}

interface Activity {
  id: string;
  name: string;
  materials: Material[];
}

interface Phase {
  id: string;
  name: string;
  activities: Activity[];
}

const MaterialViewer: React.FC<{ material: Material }> = ({ material }) => {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="link">{material.name}</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[90%] sm:max-h-[90%]">
          <DialogHeader>
            <DialogTitle>{material.name}</DialogTitle>
          </DialogHeader>
          <iframe
            src={`/materials/Introduccion_a_la_algoritmia/index.html`}
            className="w-full h-[80vh]"
            title={material.name}
          />
        </DialogContent>
      </Dialog>
    );
  };

export default function HomePage() {
  const [userName, setUserName] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [userProgress, setUserProgress] = useState<{[key: string]: boolean}>({});
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handleChange);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const firstName = user.displayName?.split(' ')[0] || 'Usuario';
        setUserName(firstName);
        loadUserProgress(user.uid);
        loadPhasesData();
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

  const loadPhasesData = async () => {
    try {
      const phasesCollection = collection(db, 'phases');
      const phasesSnapshot = await getDocs(phasesCollection);
      const phasesData: Phase[] = [];

      for (const phaseDoc of phasesSnapshot.docs) {
        const phaseData = phaseDoc.data() as Phase;
        phaseData.id = phaseDoc.id;

        const activitiesCollection = collection(db, `phases/${phaseDoc.id}/activities`);
        const activitiesSnapshot = await getDocs(activitiesCollection);
        phaseData.activities = [];

        for (const activityDoc of activitiesSnapshot.docs) {
          const activityData = activityDoc.data() as Activity;
          activityData.id = activityDoc.id;

          const materialsCollection = collection(db, `phases/${phaseDoc.id}/activities/${activityDoc.id}/materials`);
          const materialsSnapshot = await getDocs(materialsCollection);
          activityData.materials = materialsSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            completed: false,
            url: doc.data().url || '',
            type: doc.data().type || 'embed'
          } as Material));

          phaseData.activities.push(activityData);
        }

        phasesData.push(phaseData);
      }

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

  const Header = () => (
    <div className={`flex ${isMobile ? 'flex-col items-start' : 'justify-between items-center'} mb-6`}>
      <h1 className={`text-3xl font-bold ${firaCode.className} dark:text-white mb-4 md:mb-0`}>
        Bienvenido, {userName}!
      </h1>
      {isMobile ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MenuIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleLogout}>
              <LogOutIcon className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button 
          onClick={handleLogout}
          variant="outline"
          className={`bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300 ease-in-out ${inter.className}`}
        >
          <LogOutIcon className="w-4 h-4 mr-2" />
          Cerrar sesión
        </Button>
      )}
    </div>
  );

  return (
    <div className={`relative min-h-screen p-4 overflow-hidden ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {[...Array(20)].map((_, i) => (
        <Particle key={i} isDarkMode={isDarkMode} />
      ))}
      <div className="max-w-4xl mx-auto z-10">
        <Card className="border-0 shadow-lg dark:bg-gray-800 mb-6">
          <CardContent className="p-8">
            <Header />
            <p className={`${inter.className} text-gray-600 dark:text-gray-300 mb-8`}>
              Explora los materiales de formación disponibles:
            </p>
            {isLoading ? (
              <Loader />
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {phases.map((phase) => (
                  <AccordionItem key={phase.id} value={phase.id}>
                    <AccordionTrigger className={`text-lg font-semibold ${firaCode.className}`}>
                      {phase.name}
                    </AccordionTrigger>
                    <AccordionContent>
                      <Accordion type="single" collapsible className="w-full pl-4">
                        {phase.activities.map((activity) => (
                          <AccordionItem key={activity.id} value={activity.id}>
                            <AccordionTrigger className={`text-md ${inter.className}`}>
                              {activity.name}
                            </AccordionTrigger>
                            <AccordionContent>
                              <ul className="space-y-2">
                                {activity.materials.map((material) => (
                                  <li key={material.id} className="flex items-center">
                                    <MaterialViewer material={material} />
                                    <Button
                                      variant="ghost"
                                      className={`ml-2 ${
                                        userProgress[material.id] ? 'text-green-500' : 'text-gray-700 dark:text-gray-300'
                                      }`}
                                      onClick={() => handleMaterialClick(material)}
                                    >
                                      {userProgress[material.id] ? (
                                        <CheckCircle className="w-5 h-5" />
                                      ) : (
                                        <BookOpen className="w-5 h-5" />
                                      )}
                                    </Button>
                                  </li>
                                ))}
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}