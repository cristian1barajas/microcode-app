'use client'

import React, { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Fira_Code, Inter } from 'next/font/google'
import { collection, doc, getDoc, setDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { useMediaQuery } from 'react-responsive';
import ContentFrame from '@/components/ui/ContentFrame';
import ActivityCard from '@/components/ui/ActivityCard';
import AppBar from '@/components/ui/AppBar';
import Lottie from 'lottie-react';
import loginAnimation from '@/components/ui/login-animation.json';
import EvidenciasTimeline from '@/components/ui/EvidenciasTimeline';

const firaCode = Fira_Code({ subsets: ['latin'] })

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
  isActivitiesLoaded?: boolean;
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
  const [isPrefetching, setIsPrefetching] = useState(false);
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

        // Carga inicial rápida: fases + actividades (ligero)
        await loadPhasesOnly();

        // Precarga en background: SOLO materiales (lo pesado, no bloquea UI)
        prefetchAllActivitiesAndMaterials();
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

  // Carga las fases Y actividades (sin materiales) para renderizado inicial rápido
  const loadPhasesOnly = async () => {
    try {
      const phasesCollection = collection(db, 'phases');
      const phasesSnapshot = await getDocs(phasesCollection);

      // Cargar fases y actividades en paralelo
      const phasesPromises = phasesSnapshot.docs.map(async (phaseDoc) => {
        const phaseData = {
          id: phaseDoc.id,
          name: phaseDoc.data().name,
          order: phaseDoc.data().order,
          activities: [] as Activity[],
          isActivitiesLoaded: false
        };

        // Cargar actividades de esta fase (sin materiales)
        const activitiesSnapshot = await getDocs(
          collection(db, `phases/${phaseDoc.id}/activities`)
        );

        phaseData.activities = activitiesSnapshot.docs.map(activityDoc => ({
          id: activityDoc.id,
          name: activityDoc.data().name,
          order: activityDoc.data().order,
          materials: [] // Sin materiales aún
        } as Activity));

        phaseData.activities.sort((a, b) => (a.order || 0) - (b.order || 0));

        return phaseData;
      });

      const phasesData = await Promise.all(phasesPromises);
      phasesData.sort((a, b) => (a.order || 0) - (b.order || 0));
      setPhases(phasesData);

    } catch (error) {
      console.error("Error loading phases:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Precarga en background SOLO los materiales (lo pesado) en paralelo
  const prefetchAllActivitiesAndMaterials = async () => {
    try {
      setIsPrefetching(true);

      // Obtener las fases actuales del estado
      setPhases(prevPhases => {
        // Crear promesas para cargar materiales de todas las actividades en paralelo
        const allMaterialsPromises: Promise<{
          phaseId: string;
          activityId: string;
          materials: Material[];
        }>[] = [];

        prevPhases.forEach(phase => {
          phase.activities.forEach(activity => {
            const promise = getDocs(
              query(
                collection(db, `phases/${phase.id}/activities/${activity.id}/materials`),
                orderBy('order')
              )
            ).then(materialsSnapshot => ({
              phaseId: phase.id,
              activityId: activity.id,
              materials: materialsSnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                description: doc.data().description,
                icon: doc.data().icon,
                url: doc.data().url,
                type: doc.data().type,
                order: doc.data().order
              } as Material))
            }));

            allMaterialsPromises.push(promise);
          });
        });

        // Ejecutar todas las promesas en paralelo y actualizar estado cuando terminen
        Promise.all(allMaterialsPromises).then(allMaterialsData => {

          // Actualizar el estado con los materiales
          setPhases(currentPhases =>
            currentPhases.map(phase => ({
              ...phase,
              activities: phase.activities.map(activity => {
                const materialsData = allMaterialsData.find(
                  m => m.phaseId === phase.id && m.activityId === activity.id
                );
                return materialsData
                  ? { ...activity, materials: materialsData.materials }
                  : activity;
              }),
              isActivitiesLoaded: true
            }))
          );

          setIsPrefetching(false);
        }).catch(error => {
          setIsPrefetching(false);
        });

        return prevPhases; // No modificar aún
      });
    } catch (error) {
      setIsPrefetching(false);
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
    <div className={`flex flex-col min-h-screen ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-100 text-black'}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <Particle key={i} isDarkMode={isDarkMode} />
        ))}
      </div>
      <AppBar 
        userName={userName}
        userFicha={userFicha}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        handleLogout={handleLogout}
      />
      <main className="flex-grow container mx-auto px-4 pt-16 pb-8">
        <div className="mb-2">
          <EvidenciasTimeline isDarkMode={isDarkMode}/>
        </div>

        {isPrefetching && (
          <div className="mb-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mr-2"></div>
            Cargando materiales en segundo plano...
          </div>
        )}

        <h2 className={`text-2xl ${isDarkMode ? 'font-light' : 'font-normal'} mb-4 ${firaCode.className} text-left pt-4`}>
          Aprendizaje
        </h2>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Lottie animationData={loginAnimation} style={{ width: 100, height: 100 }} />
            <p className={`${firaCode.className} mt-4 text-lg`}>Cargando contenido...</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 mb-6">
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
      <ContentFrame
        isOpen={isContentFrameOpen}
        onClose={handleContentFrameClose}
        material={selectedMaterial}
      />
    </div>
  );
}