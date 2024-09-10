'use client'

import React, { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { LogOut as LogOutIcon, ChevronLeft, MoreVertical, Star, Heart, BookOpen, CheckCircle, Moon, Sun } from 'lucide-react'
import { Fira_Code, Inter } from 'next/font/google'
import { collection, doc, getDoc, setDoc, getDocs, query, orderBy } from 'firebase/firestore';
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
  order: number;
  materials: Material[];
}

interface Phase {
  id: string;
  name: string;
  order: number;
  activities: Activity[];
}

const MaterialViewer: React.FC<{ material: Material }> = ({ material }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="p-0 h-auto font-normal">{material.name}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[90%] sm:max-h-[90%]">
        <DialogHeader>
          <DialogTitle>{material.name}</DialogTitle>
        </DialogHeader>
        <iframe
          src={`/materials/${material.url}/index.html`}
          className="w-full h-[80vh]"
          title={material.name}
        />
      </DialogContent>
    </Dialog>
  );
};

export default function HomePage() {
  const [userName, setUserName] = useState('');
  const [phases, setPhases] = useState<Phase[]>([]);
  const [userProgress, setUserProgress] = useState<{[key: string]: boolean}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
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
        phaseData.activities = [];

        const activitiesCollection = collection(db, `phases/${phaseDoc.id}/activities`);
        const activitiesSnapshot = await getDocs(activitiesCollection);

        for (const activityDoc of activitiesSnapshot.docs) {
          const activityData = activityDoc.data() as Activity;
          activityData.id = activityDoc.id;
          activityData.materials = [];

          const materialsCollection = collection(db, `phases/${phaseDoc.id}/activities/${activityDoc.id}/materials`);
          const materialsSnapshot = await getDocs(materialsCollection);

          activityData.materials = materialsSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            completed: false,
            url: doc.data().url,
            type: doc.data().type
          } as Material));

          phaseData.activities.push(activityData);
        }

        phasesData.push(phaseData);
      }

      // Sort phases and activities
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

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const AppBar = () => (
    <div className={`flex items-center justify-between p-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'} shadow-sm`}>
      <div className="flex items-center">
        <ChevronLeft className="h-6 w-6 mr-2" />
        <h1 className={`text-xl font-semibold ${firaCode.className}`}>
          ¡Hola {userName}!
        </h1>
      </div>
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleLogout}>
              <LogOutIcon className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-100 text-black'}`}>
      <AppBar />
      <main className="container mx-auto p-4">
        <h2 className={`text-3xl font-bold mb-6 ${firaCode.className}`}>Aprendizaje</h2>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {phases.map((phase) => (
              <Card key={phase.id} className={`overflow-hidden ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
                <CardHeader>
                  <CardTitle>{phase.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {phase.activities.map((activity) => (
                      <AccordionItem key={activity.id} value={activity.id}>
                        <AccordionTrigger className="text-sm">{activity.name}</AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2">
                            {activity.materials.map((material) => (
                              <li key={material.id} className="flex items-center justify-between">
                                <MaterialViewer material={material} />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`ml-2 ${
                                    userProgress[material.id] ? 'text-green-500' : 'text-gray-500'
                                  }`}
                                  onClick={() => handleMaterialClick(material)}
                                >
                                  {userProgress[material.id] ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <BookOpen className="h-4 w-4" />
                                  )}
                                </Button>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm">Ir</Button>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon">
                      <Star className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}