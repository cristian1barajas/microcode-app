'use client'

import React, { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut as LogOutIcon, MoreVertical, Star, Heart, BookOpen, CheckCircle, Moon, Sun, ChevronDown, ChevronUp, X } from 'lucide-react'
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
import { cn } from "@/lib/utils"

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

const MaterialViewer: React.FC<{ material: Material, isDarkMode: boolean }> = ({ material, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className={`p-0 h-auto ${isDarkMode ? 'font-light' : 'font-normal'} text-xs text-left w-full justify-start ${firaCode.className}`}>
          <span className="truncate">{material.name}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className={cn(
        "p-0 w-full h-full max-w-full sm:max-w-[90%] sm:max-h-[90%]",
        "rounded-none border-0",
        "data-[state=open]:slide-in-from-bottom-full",
        "sm:data-[state=open]:slide-in-from-bottom-0"
      )}>
        <DialogHeader className="absolute top-0 left-0 right-0 z-10 flex flex-row items-center justify-between p-1 bg-white dark:bg-gray-800">
          <DialogTitle className={`${firaCode.className} ${isDarkMode ? 'font-light' : 'font-normal'} text-sm truncate flex-grow mr-2`}>
            {material.name}
          </DialogTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="flex-shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="w-full h-full pt-10">
          <iframe
            src={`/materials/${material.url}/index.html`}
            className="w-full h-full border-none"
            title={material.name}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ActivityCard: React.FC<{ 
  activity: Activity, 
  userProgress: {[key: string]: boolean}, 
  handleMaterialClick: (material: Material) => void,
  isDarkMode: boolean
}> = ({ activity, userProgress, handleMaterialClick, isDarkMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="mb-4 overflow-hidden transition-all duration-300 ease-in-out">
      <CardHeader 
        className="cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className={`text-sm ${isDarkMode ? 'font-light' : 'font-normal'} ${firaCode.className}`}>{activity.name}</CardTitle>
        {isExpanded ? <ChevronUp className="h-4 w-4 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 flex-shrink-0" />}
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <ul className="space-y-2">
            {activity.materials.map((material) => (
              <li key={material.id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                <div className="flex-grow mr-2 min-w-0">
                  <MaterialViewer material={material} isDarkMode={isDarkMode} />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`ml-2 flex-shrink-0 ${
                    userProgress[material.id] ? 'text-green-500' : 'text-gray-500'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMaterialClick(material);
                  }}
                >
                  {userProgress[material.id] ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <BookOpen className="h-3 w-3" />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
};

export default function HomePage() {
  const [userName, setUserName] = useState('');
  const [phases, setPhases] = useState<Phase[]>([]);
  const [userProgress, setUserProgress] = useState<{[key: string]: boolean}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();
  const isMobile = useMediaQuery({ query: '(max-width: 640px)' });

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
    <div className={`fixed top-0 left-0 right-0 z-50 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'} shadow-sm`}>
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className={`text-lg ${isDarkMode ? 'font-light' : 'font-normal'} ${inter.className}`}>
            ¡Hola {userName}!
          </h1>
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={toggleDarkMode}>
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOutIcon className="mr-2 h-3 w-3" />
                <span className={`text-xs ${isDarkMode ? 'font-light' : 'font-normal'}`}>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`relative min-h-screen ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-100 text-black'}`}>
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <Particle key={i} isDarkMode={isDarkMode} />
        ))}
      </div>
      <div className="relative">
        <AppBar />
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
                <Card key={phase.id} className={`overflow-hidden border border-gray-300 dark:border-gray-600 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
                  <CardHeader>
                    <CardTitle className={`text-lg ${isDarkMode ? 'font-light' : 'font-normal'} ${firaCode.className}`}>{phase.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {phase.activities.map((activity) => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        userProgress={userProgress}
                        handleMaterialClick={handleMaterialClick}
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
    </div>
  );
}