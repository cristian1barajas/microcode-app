'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UserPlus as UserPlusIcon, LogIn as LogInIcon, CheckCircle as CheckCircleIcon } from 'lucide-react'
import { Fira_Code, Inter } from 'next/font/google'
import Link from 'next/link';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

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

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fichaSENA, setFichaSENA] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

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

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      console.log('Usuario registrado con ficha SENA:', fichaSENA);
      setIsModalOpen(true);
    } catch (error) {
      setError('Error al registrar el usuario. Por favor, inténtalo de nuevo.');
      console.error('Error de registro:', error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    router.push('/home');
  };

  return (
    <div className={`relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {[...Array(20)].map((_, i) => (
        <Particle key={i} isDarkMode={isDarkMode} />
      ))}
      <div className="w-full max-w-md z-10">
        <Card className="border-0 shadow-lg dark:bg-gray-800">
          <CardContent className="p-8">
            <h1 className={`text-2xl font-semibold text-center mb-6 ${firaCode.className} dark:text-white`}>
              Registro en microCodeApp
            </h1>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <form onSubmit={handleRegister} className="space-y-4">
              <Input
                id="name"
                type="text"
                placeholder="Nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white ${inter.className}`}
              />
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white ${inter.className}`}
              />
              <Input
                id="password"
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white ${inter.className}`}
              />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirmar Contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white ${inter.className}`}
              />
              <Input
                id="fichaSENA"
                type="text"
                placeholder="Ficha SENA"
                value={fichaSENA}
                onChange={(e) => setFichaSENA(e.target.value)}
                required
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white ${inter.className}`}
              />
              <Button 
                type="submit" 
                className={`w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300 ease-in-out ${inter.className}`}
              >
                <UserPlusIcon className="w-4 h-4 mr-2" />
                Registrarse
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="mt-6 text-center">
          <p className={`text-sm text-gray-600 dark:text-gray-400 ${inter.className}`}>
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
              <LogInIcon className="w-4 h-4 inline-block mr-1" />
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center text-2xl font-semibold mb-2">
              <CheckCircleIcon className="w-6 h-6 text-green-500 mr-2" />
              Registro Exitoso
            </DialogTitle>
            <DialogDescription className="text-center">
              Tu cuenta ha sido creada correctamente. ¡Bienvenido a microCodeApp!
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-center">
            <Button onClick={handleCloseModal} className="bg-violet-600 hover:bg-violet-700 text-white">
              Continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}