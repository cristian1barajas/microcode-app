'use client'

import React from 'react';
import { Button } from "@/components/ui/button"
import { LogOut as LogOutIcon, MoreVertical, Moon, Sun } from 'lucide-react'
import { Fira_Code } from 'next/font/google'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const firaCode = Fira_Code({ subsets: ['latin'] })

interface AppBarProps {
  userName: string;
  userFicha: string;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  handleLogout: () => void;
}

const AppBar: React.FC<AppBarProps> = ({ userName, userFicha, isDarkMode, toggleDarkMode, handleLogout }) => {
  return (
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
};

export default AppBar;