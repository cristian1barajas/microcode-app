import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button"

interface ContentFrameProps {
  isOpen: boolean;
  onClose: () => void;
  material: {
    name: string;
    url: string;
    type: 'embed' | 'external';
  } | null;
}

const ContentFrame: React.FC<ContentFrameProps> = ({ isOpen, onClose, material }) => {
  if (!material) return null;

  const getFormattedUrl = (url: string, type: 'embed' | 'external') => {
    if (type === 'embed') {
      return `/materials/${url}/index.html`;
    } else {
      return url;
    }
  };

  const formattedUrl = getFormattedUrl(material.url, material.type);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[90vw] sm:max-h-[90vh] h-full p-0 overflow-hidden">
        <DialogHeader className="absolute top-0 left-0 right-0 z-10 flex flex-row items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-t-lg">
          <DialogTitle className="text-sm truncate flex-grow mr-2">{material.name}</DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="w-full h-full pt-12 rounded-lg overflow-hidden">
          <iframe
            src={formattedUrl}
            className="w-full h-full border-none rounded-b-lg"
            title={material.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContentFrame;