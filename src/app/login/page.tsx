'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UserPlus as UserPlusIcon, LogIn as LogInIcon } from 'lucide-react'
import { Inter, Fira_Code } from 'next/font/google'
import Lottie from 'lottie-react';
import loginAnimation from './login-animation.json';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';

const inter = Inter({ subsets: ['latin'] })
const firaCode = Fira_Code({ subsets: ['latin'] })

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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fichaSENA, setFichaSENA] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handleChange);

    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      //await signInWithEmailAndPassword(auth, email, password);
      // Verificar la ficha del usuario
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists() && userDoc.data().fichaSENA === fichaSENA) {
        router.push('/home');
      } else {
        setError('La ficha SENA no coincide con la registrada para este usuario.');
        await auth.signOut();
      }
    } catch (error) {
      setError('Error al iniciar sesión. Por favor, verifica tus credenciales.');
    }
  };

  return (
    <div className={`relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {[...Array(20)].map((_, i) => (
        <Particle key={i} isDarkMode={isDarkMode} />
      ))}
      <div className="w-full max-w-xs z-10">
        <Card className="border border-gray-300 dark:border-gray-600 shadow-lg dark:bg-gray-800">
          <CardContent className="p-5">
            <div className="flex justify-center mb-6">
              <Lottie animationData={loginAnimation} style={{ width: 100, height: 100 }} />
            </div>
            <h1 className={`text-xl font-light text-center mb-4 ${inter.className} dark:text-white`}>
              Iniciar sesión en{' '}
              <span className={`${firaCode.className} text-blue-600 dark:text-blue-400`}>
                MicroCodeApp
              </span>
            </h1>
            {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
            <form onSubmit={handleLogin} className="space-y-3">
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${inter.className} placeholder:text-xs`}
              />
              <Input
                id="password"
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${inter.className} placeholder:text-xs`}
              />
              <Input
                id="fichaSENA"
                type="text"
                placeholder="Ficha SENA"
                value={fichaSENA}
                onChange={(e) => setFichaSENA(e.target.value)}
                required
                className={`w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${inter.className} placeholder:text-xs`}
              />
              <Button 
                type="submit" 
                className={`w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-1.5 px-4 rounded-md transition duration-300 ease-in-out text-sm ${inter.className}`}
              >
                <LogInIcon className="w-4 h-4 mr-2" />
                Iniciar sesión
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="mt-4 text-center">
          <p className={`text-xs text-gray-600 dark:text-gray-400 ${inter.className}`}>
            ¿No tienes una cuenta?{' '}
            <Link href="/register" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
              <UserPlusIcon className="w-3 h-3 inline-block mr-1" />
              Registrarse
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}