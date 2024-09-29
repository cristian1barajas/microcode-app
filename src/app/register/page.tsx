'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UserPlus as UserPlusIcon, LogIn as LogInIcon, CheckCircle as CheckCircleIcon } from 'lucide-react'
import { Inter, Fira_Code } from 'next/font/google'
import Link from 'next/link';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { doc, setDoc, getDoc } from 'firebase/firestore';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import loginAnimation from '@/components/ui/login-animation.json';

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

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fichaSENA, setFichaSENA] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigatingToLogin, setIsNavigatingToLogin] = useState(false);
  const router = useRouter();
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handleChange);

    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    if (lottieRef.current) {
      lottieRef.current.play();
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      if (lottieRef.current) {
        lottieRef.current.stop();
      }
      return;
    }

    try {
      // Verificar si la ficha existe
      const fichaDoc = await getDoc(doc(db, 'fichas', fichaSENA));
      if (!fichaDoc.exists()) {
        setError('La ficha SENA ingresada no es válida');
        setIsLoading(false);
        if (lottieRef.current) {
          lottieRef.current.stop();
        }
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });

      // Guardar la información del usuario incluyendo la ficha
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        email,
        fichaSENA,
        createdAt: new Date()
      });

      console.log('Usuario registrado con ficha SENA:', fichaSENA);
      setIsModalOpen(true);
    } catch (error) {
      setError('Error al registrar el usuario. Por favor, inténtalo de nuevo.');
      console.error('Error de registro:', error);
    } finally {
      setIsLoading(false);
      if (lottieRef.current) {
        lottieRef.current.stop();
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    router.push('/home');
  };

  const handleNavigateToLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigatingToLogin(true);
    if (lottieRef.current) {
      lottieRef.current.play();
    }
    setTimeout(() => {
      router.push('/login');
    }, 1000); // Delay navigation to show animation
  };

  return (
    <div className={`relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {[...Array(20)].map((_, i) => (
        <Particle key={i} isDarkMode={isDarkMode} />
      ))}
      <div className="w-full max-w-xs z-10">
        <Card className="border border-gray-300 dark:border-gray-600 shadow-lg dark:bg-gray-800">
          <CardContent className="p-5">
            <div className="flex flex-col items-center">
              <Lottie 
                lottieRef={lottieRef}
                animationData={loginAnimation} 
                style={{ width: 80, height: 80 }} 
                autoplay={false}
                loop={true}
              />
              <h1 className={`text-xl font-light text-center mt-2 ${inter.className} dark:text-white`}>
                Registro en{' '}
                <span className={`${firaCode.className} text-blue-600 dark:text-blue-400`}>
                  MicroCodeApp
                </span>
              </h1>
            </div>
            {error && <p className="text-red-500 text-xs mt-2 mb-4">{error}</p>}
            <form onSubmit={handleRegister} className="space-y-3 mt-4">
              <Input
                id="name"
                type="text"
                placeholder="Nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={`w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${inter.className} placeholder:text-xs`}
              />
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
                id="confirmPassword"
                type="password"
                placeholder="Confirmar Contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                disabled={isLoading}
              >
                {isLoading ? (
                  <span>Registrando...</span>
                ) : (
                  <>
                    <UserPlusIcon className="w-4 h-4 mr-2" />
                    Registrarse
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="mt-4 text-center">
          <p className={`text-xs text-gray-600 dark:text-gray-400 ${inter.className}`}>
            ¿Ya tienes una cuenta?{' '}
            <Button
              onClick={handleNavigateToLogin}
              variant="link"
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium p-0"
              disabled={isNavigatingToLogin}
            >
              <LogInIcon className="w-3 h-3 inline-block mr-1" />
              {isNavigatingToLogin ? 'Redirigiendo...' : 'Iniciar sesión'}
            </Button>
          </p>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center text-xl font-semibold mb-2">
              <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
              Registro Exitoso
            </DialogTitle>
            <DialogDescription className="text-center text-sm">
              Tu cuenta ha sido creada correctamente. ¡Bienvenido a MicroCodeApp!
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-center">
            <Button onClick={handleCloseModal} className="bg-green-700 hover:bg-green-800 text-white text-sm">
              Continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}