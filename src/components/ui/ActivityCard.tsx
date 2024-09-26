import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronUp, ChevronDown } from 'lucide-react'
import { Fira_Code } from 'next/font/google'
import MaterialCard from './MaterialCard';

const firaCode = Fira_Code({ subsets: ['latin'] })

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

interface ActivityCardProps {
  activity: Activity;
  userProgress: {[key: string]: boolean};
  userLikes: {[key: string]: boolean};
  handleMaterialClick: (material: Material) => void;
  handleMaterialLike: (material: Material) => void;
  handleMaterialOpen: (material: Material) => void;
  isDarkMode: boolean;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ 
  activity, 
  userProgress, 
  userLikes, 
  handleMaterialClick, 
  handleMaterialLike, 
  handleMaterialOpen, 
  isDarkMode 
}) => {
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

export default ActivityCard;