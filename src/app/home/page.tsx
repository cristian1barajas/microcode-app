'use client'

import React, { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LogOut as LogOutIcon } from 'lucide-react'
import { Fira_Code, Inter } from 'next/font/google'

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

export default function HomePage() {
  const [userName, setUserName] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handleChange);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserName(user.displayName || 'Usuario');
      } else {
        router.push('/login');
      }
    });

    return () => {
      darkModeMediaQuery.removeEventListener('change', handleChange);
      unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className={`relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {[...Array(20)].map((_, i) => (
        <Particle key={i} isDarkMode={isDarkMode} />
      ))}
      <div className="w-full max-w-md z-10">
        <Card className="border-0 shadow-lg dark:bg-gray-800">
          <CardContent className="p-8">
            <h1 className={`text-3xl font-bold text-center mb-6 ${firaCode.className} dark:text-white`}>
              Bienvenido, {userName}!
            </h1>
            <p className={`text-center mb-8 ${inter.className} text-gray-600 dark:text-gray-300`}>
              Has iniciado sesión correctamente en microCodeApp.
            </p>
            <Button 
              onClick={handleLogout}
              className={`w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300 ease-in-out ${inter.className}`}
            >
              <LogOutIcon className="w-4 h-4 mr-2" />
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}