'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Code as CodeIcon, UserPlus as UserPlusIcon, LogIn as LogInIcon } from 'lucide-react'
import { Fira_Code } from 'next/font/google'

const firaCode = Fira_Code({ subsets: ['latin'] })

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fichaSENA, setFichaSENA] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handleChange);

    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Iniciando sesión con:', { email, password, fichaSENA });
  };

  return (
    <div className={`flex items-center justify-center min-h-screen p-4 ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <Card className="w-full max-w-md shadow-lg dark:bg-gray-800">
        <CardContent className="flex flex-col items-center space-y-6 p-6">
          <CodeIcon className="w-16 h-16 text-primary" />
          <h1 className={`text-2xl font-bold text-center ${firaCode.className} dark:text-white`}>
            microCodeApp
          </h1>
          <form onSubmit={handleLogin} className="w-full space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="shadow-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
            <Input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="shadow-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
            <Input
              type="text"
              placeholder="Ficha SENA"
              value={fichaSENA}
              onChange={(e) => setFichaSENA(e.target.value)}
              required
              className="shadow-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
            <Button type="submit" className="w-full shadow-md hover:shadow-lg transition-shadow">
              <LogInIcon className="w-4 h-4 mr-2" />
              Iniciar sesión
            </Button>
          </form>
          <Button variant="outline" className="w-full shadow-md hover:shadow-lg transition-shadow dark:bg-gray-700 dark:text-white dark:border-gray-600">
            <UserPlusIcon className="w-4 h-4 mr-2" />
            Registrarse
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}