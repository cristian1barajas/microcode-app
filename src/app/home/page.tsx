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
import { Code, Search, Terminal, Beaker, Database, Box, Layout, Puzzle, Globe, CheckSquare, PenTool, GitBranch, Server, Smartphone, Wrench, Coffee, Layers, Wifi, Shield, UploadCloud, FileText } from 'lucide-react';
import ContentFrame from '@/components/ui/ContentFrame';

const firaCode = Fira_Code({ subsets: ['latin'] })
const inter = Inter({ subsets: ['latin'] })

interface Material {
  id: string;
  name: string;
  description: string;
  icon: string;
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

interface Material {
  id: string;
  name: string;
  description: string;
  icon: string;
  url: string;
  type: 'embed' | 'external';
}

interface MaterialCardProps {
  material: Material;
  isDarkMode: boolean;
  isCompleted: boolean;
  isLiked: boolean;
  onComplete: () => void;
  onLike: () => void;
  onOpen: (material: Material) => void;
}

const MaterialCard: React.FC<MaterialCardProps> = ({ 
  material, 
  isDarkMode, 
  isCompleted, 
  isLiked, 
  onComplete, 
  onLike, 
  onOpen 
}) => {
  const iconMap: { [key: string]: React.ElementType } = {
    code: Code,
    search: Search,
    terminal: Terminal,
    flask: Beaker,
    database: Database,
    box: Box,
    layout: Layout,
    puzzle: Puzzle,
    globe: Globe,
    'check-square': CheckSquare,
    'pen-tool': PenTool,
    'git-branch': GitBranch,
    server: Server,
    smartphone: Smartphone,
    tool: Wrench,
    coffee: Coffee,
    layers: Layers,
    wifi: Wifi,
    shield: Shield,
    'upload-cloud': UploadCloud,
    'file-text': FileText,
  };

  // Obtener el componente de ícono basado en el nombre del ícono del material
  const IconComponent = iconMap[material.icon] || Box; // Usar Box como respaldo
  
  return (
    <Card className={`w-full sm:w-80 md:w-72 lg:w-64 xl:w-72 flex flex-col h-[300px] sm:h-[290px] md:h-[280px] lg:h-[300px] ${isDarkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white border-gray-300'} shadow-lg hover:shadow-xl transition-shadow duration-300 border`}>
      <CardHeader className="p-4">
        <CardTitle className={`text-sm ${isDarkMode ? 'font-light' : 'font-normal'} ${firaCode.className}`}>
          {material.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between p-4 pt-0">
        <div className="flex flex-col items-center justify-between flex-grow">
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center mb-4 line-clamp-3 sm:line-clamp-4 md:line-clamp-3`}>
            {material.description}
          </p>
          <div className="flex justify-center items-center flex-grow">
            <Card className={`w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} shadow-lg`}>
              <IconComponent className={`w-10 h-10 sm:w-12 sm:h-12 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
            </Card>
          </div>
        </div>
        <div className="flex items-center justify-between w-full mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onComplete}
            className={`${isCompleted ? 'text-green-500' : 'text-gray-500'} p-1 flex-1`}
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => onOpen(material)}
            className="text-xs px-2 py-1 flex-1 mx-1 bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            Ir
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLike}
            className={`${isLiked ? 'text-red-500' : 'text-gray-500'} p-1 flex-1`}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const ActivityCard: React.FC<{ 
  activity: Activity, 
  userProgress: {[key: string]: boolean}, 
  userLikes: {[key: string]: boolean},
  handleMaterialClick: (material: Material) => void,
  handleMaterialLike: (material: Material) => void,
  handleMaterialOpen: (material: Material) => void,
  isDarkMode: boolean
}> = ({ activity, userProgress, userLikes, handleMaterialClick, handleMaterialLike, handleMaterialOpen, isDarkMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className={`mb-4 overflow-hidden transition-all duration-300 ease-in-out ${isDarkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white border-gray-300'} shadow-lg hover:shadow-xl border`}>
      <CardHeader 
        className="cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className={`text-sm ${isDarkMode ? 'font-light' : 'font-normal'} ${firaCode.className}`}>{activity.name}</CardTitle>
        {isExpanded ? <ChevronUp className="h-4 w-4 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 flex-shrink-0" />}
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="overflow-x-auto">
            <div className="flex flex-nowrap space-x-4 pb-4">
              {activity.materials.map((material) => (
                <div key={material.id} className="flex-shrink-0 w-full sm:w-auto h-full">
                  <MaterialCard
                    material={material}
                    isDarkMode={isDarkMode}
                    isCompleted={userProgress[material.id] || false}
                    isLiked={userLikes[material.id] || false}
                    onComplete={() => handleMaterialClick(material)}
                    onLike={() => handleMaterialLike(material)}
                    onOpen={() => handleMaterialOpen(material)}
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
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
          const materialsSnapshot = await getDocs(materialsCollection);

          activityData.materials = materialsSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            description: doc.data().description,
            icon: doc.data().icon,
            url: doc.data().url,
            type: doc.data().type
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

  const AppBar = () => (
    <div className={`fixed top-0 left-0 right-0 z-50 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'} shadow-sm`}>
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className={`text-lg ${isDarkMode ? 'font-light' : 'font-normal'} ${firaCode.className}`}>
            ¡Hola {userName}!
          </h1>
        </div>
        <div className="flex items-center">
          <span className={`ml-2 text-sm ${firaCode.className} text-blue-600 dark:text-blue-400`}>
            {userFicha}
          </span>
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