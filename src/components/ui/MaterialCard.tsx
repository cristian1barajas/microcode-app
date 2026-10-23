import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, CheckCircle as CheckCircleIcon, BookOpen } from 'lucide-react'
import { Code, Search, Terminal, Beaker, Database, Box, Layout, Puzzle, Globe, CheckSquare, PenTool, GitBranch, Server, Smartphone, Wrench, Coffee, Layers, Wifi, Shield, UploadCloud, FileText, Zap } from 'lucide-react';
import { Fira_Code } from 'next/font/google'
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
// lottie-web accede a `document` al importarse, por eso se carga sin SSR
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import loginAnimation from '@/components/ui/login-animation.json';

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
  onOpen,
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
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
    zap: Zap,
    'check-circle': CheckCircleIcon
  };

  const IconComponent = iconMap[material.icon] || Box;

  const handleQuiz = () => {
    setIsLoading(true);
    router.push(`/quiz/${material.id}?url=${material.url}`);
  };
  
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
            <CheckCircleIcon className="h-4 w-4" />
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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleQuiz}
            className="text-gray-500 p-1 flex-1"
            disabled={isLoading}
          >
            {isLoading ? (
              <Lottie 
                animationData={loginAnimation} 
                style={{ width: 16, height: 16 }} 
                loop={true}
              />
            ) : (
              <BookOpen className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MaterialCard;