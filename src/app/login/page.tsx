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
  const [courseId, setCourseId] = useState('');
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
    console.log('Iniciando sesión con:', { email, password, courseId });
  };

  return (
    <div className={`flex items-center justify-center min-h-screen p-4 ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <Card className="w-full max-w-md shadow-lg dark:bg-gray-800">
        <CardContent className="flex flex-col items-center space-y-4 sm:space-y-6 p-4 sm:p-6">
          <CodeIcon className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />
          <h1 className={`text-xl sm:text-2xl font-bold text-center ${firaCode.className} dark:text-white`}>
            microCodeApp
          </h1>
          <h2 className="text-lg sm:text-xl font-semibold dark:text-gray-200">Inicie sesión</h2>
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">Ingrese los detalles de su cuenta</p>
          <form onSubmit={handleLogin} className="w-full space-y-3 sm:space-y-4">
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
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="shadow-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
            <Input
              type="text"
              placeholder="Course ID"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
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