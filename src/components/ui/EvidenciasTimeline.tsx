import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Upload, Check, Plus, X, Clock } from 'lucide-react';
import { collection, query, orderBy, getDocs, doc, updateDoc, addDoc, deleteDoc, where, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Fira_Code } from 'next/font/google';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Timestamp } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const firaCode = Fira_Code({ subsets: ['latin'] });

interface Evidencia {
  id: string;
  codigo: string;
  detalle: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  tipo: string;
  mes: string;
  semana: number;
  isUploaded?: boolean;
}

interface Task {
  id: string;
  evidenciaId: string;
  userId: string;
  description: string;
  reminderDate: Date | null;
  reminderTime: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface EvidenciasTimelineProps {
  isDarkMode: boolean;
}

interface TimeSelectProps {
  value: string;
  onChange: (value: string) => void;
  isDarkMode: boolean;
}

const TimeSelect: React.FC<TimeSelectProps> = ({ value, onChange, isDarkMode }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const [selectedHour, selectedMinute] = value ? value.split(':') : ['00', '00'];

  const handleHourChange = (newHour: string) => {
    onChange(`${newHour}:${selectedMinute}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    onChange(`${selectedHour}:${newMinute}`);
  };

  return (
    <div className="flex space-x-2">
      <Select value={selectedHour} onValueChange={handleHourChange}>
        <SelectTrigger className={`w-[80px] ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : ''}`}>
          <SelectValue placeholder="Hora" />
        </SelectTrigger>
        <SelectContent className={`${isDarkMode ? 'bg-gray-800 text-white' : ''}`}>
          {hours.map((hour) => (
            <SelectItem key={hour} value={hour} className={`px-4 py-2 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-100'}`}>
              {hour}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={selectedMinute} onValueChange={handleMinuteChange}>
        <SelectTrigger className={`w-[80px] ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : ''}`}>
          <SelectValue placeholder="Minuto" />
        </SelectTrigger>
        <SelectContent className={`${isDarkMode ? 'bg-gray-800 text-white' : ''}`}>
          {minutes.map((minute) => (
            <SelectItem key={minute} value={minute} className={`px-4 py-2 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-100'}`}>
              {minute}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default function EvidenciasTimeline({ isDarkMode }: EvidenciasTimelineProps) {
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date(2024, 11, 5));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvidencia, setSelectedEvidencia] = useState<Evidencia | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [reminderDate, setReminderDate] = useState<Date | undefined>(undefined);
  const [reminderTime, setReminderTime] = useState<string>('');
  const [isGrupoExperimental, setIsGrupoExperimental] = useState<boolean | null>(null);
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [userFicha, setUserFicha] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvidencias = async () => {
      const q = query(collection(db, 'evidencias'), orderBy('fecha_inicio'));
      const querySnapshot = await getDocs(q);
      const fetchedEvidencias = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fecha_inicio: doc.data().fecha_inicio.toDate(),
        fecha_fin: doc.data().fecha_fin.toDate(),
      } as Evidencia));
      setEvidencias(fetchedEvidencias);
    };

    fetchEvidencias();
  }, [toast]);

  useEffect(() => {
    console.log("useEffect for checkUserGroup is running");
    const checkUserGroup = async () => {
      console.log("checkUserGroup function started");
      const user = auth.currentUser;
      console.log("Current user:", user);
      if (user) {
        try {
          console.log("Fetching user document");
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("User data:", userData);
            if (userData && userData.fichaSENA) {
              setUserFicha(userData.fichaSENA);
              console.log("Fetching ficha document");
              const fichaDoc = await getDoc(doc(db, 'fichas', userData.fichaSENA));
              if (fichaDoc.exists()) {
                const fichaData = fichaDoc.data();
                console.log("Ficha data:", fichaData);
                setIsGrupoExperimental(fichaData.grupoExperimental || false);
                console.log(`User Ficha: ${userData.fichaSENA}, Is Experimental: ${fichaData.grupoExperimental}`);
              } else {
                console.log(`Ficha document does not exist for ficha: ${userData.fichaSENA}`);
                setIsGrupoExperimental(false);
              }
            } else {
              console.log('User document does not contain fichaSENA information');
              setIsGrupoExperimental(false);
            }
          } else {
            console.log('User document does not exist');
            setIsGrupoExperimental(false);
          }
        } catch (error) {
          console.error("Error fetching user or ficha data:", error);
          setIsGrupoExperimental(false);
          toast({
            title: "Error",
            description: "No se pudo verificar el grupo del usuario. Por favor, intenta de nuevo.",
            variant: "destructive",
          });
        }
      } else {
        console.log('No authenticated user');
        setIsGrupoExperimental(false);
      }
    };

    checkUserGroup();
  }, [toast]);

  useEffect(() => {
    if (evidencias.length > 0) {
      scrollToCurrentDate();
    }
  }, [evidencias, currentDate]);

  const handlePlanificar = (evidencia: Evidencia) => {
    if (!isGrupoExperimental) return;
    setSelectedEvidencia(evidencia);
    setIsModalOpen(true);
    fetchTasks(evidencia.id);
  };

  const fetchTasks = async (evidenciaId: string) => {
    if (!auth.currentUser) {
      console.error("Usuario no autenticado");
      return;
    }
  
    try {
      const q = query(
        collection(db, 'tasks'),
        where('evidenciaId', '==', evidenciaId),
        where('userId', '==', auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const fetchedTasks = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          evidenciaId: data.evidenciaId,
          userId: data.userId,
          description: data.description,
          reminderDate: data.reminderDate?.toDate() || null,
          reminderTime: data.reminderTime || null,
          createdAt: data.createdAt?.toDate() || null,
          updatedAt: data.updatedAt?.toDate() || null,
        } as Task;
      });
      setTasks(fetchedTasks);
    } catch (error) {
      console.error("Error al obtener las tareas:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las tareas. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleAddTask = async () => {
    if (!isGrupoExperimental) return;
    if (newTask.trim() && reminderDate && reminderTime && selectedEvidencia && auth.currentUser) {
      try {
        const reminderDateTime = new Date(reminderDate);
        const [hours, minutes] = reminderTime.split(':').map(Number);
        reminderDateTime.setHours(hours, minutes);

        const taskRef = await addDoc(collection(db, 'tasks'), {
          evidenciaId: selectedEvidencia.id,
          userId: auth.currentUser.uid,
          description: newTask.trim(),
          reminderDate: Timestamp.fromDate(reminderDateTime),
          reminderTime,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
  
        const newTaskObj: Task = {
          id: taskRef.id,
          evidenciaId: selectedEvidencia.id,
          userId: auth.currentUser.uid,
          description: newTask.trim(),
          reminderDate: reminderDateTime,
          reminderTime,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
  
        setTasks([...tasks, newTaskObj]);
        setNewTask('');
        setReminderDate(undefined);
        setReminderTime('');
  
        toast({
          title: "Tarea añadida",
          description: "La tarea ha sido añadida exitosamente.",
        });
      } catch (error) {
        console.error("Error al añadir la tarea:", error);
        toast({
          title: "Error",
          description: "No se pudo añadir la tarea. Por favor, intenta de nuevo.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!isGrupoExperimental) return;
    await deleteDoc(doc(db, 'tasks', taskId));
    setTasks(tasks.filter(task => task.id !== taskId));

    toast({
      title: "Tarea eliminada",
      description: "La tarea ha sido eliminada exitosamente.",
    });
  };

  const handleToggleUpload = async (evidenciaId: string, isUploaded: boolean) => {
    if (!isGrupoExperimental) return;
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para realizar esta acción.",
        variant: "destructive",
      });
      return;
    }

    try {
      const evidenciaRef = doc(db, 'evidencias', evidenciaId);
      await updateDoc(evidenciaRef, {
        isUploaded: !isUploaded,
      });

      setEvidencias(prevEvidencias =>
        prevEvidencias.map(ev =>
          ev.id === evidenciaId ? { ...ev, isUploaded: !isUploaded } : ev
        )
      );

      toast({
        title: "Actualización exitosa",
        description: `La evidencia ha sido marcada como ${!isUploaded ? 'subida' : 'no subida'}.`,
      });
    } catch (error) {
      console.error("Error al actualizar el estado de la evidencia:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la evidencia.",
        variant: "destructive",
      });
    }
  };

  const renderTimeline = () => {
    return (
      <div className="relative h-20 mb-4">
        <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
        {evidencias.map((evidencia, index) => (
          <React.Fragment key={evidencia.id}>
            <div
                className={`absolute bottom-0 w-1 h-12 ${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'}`}
                style={{ left: `${index * 272 + 64}px` }}
            />
            <div
                className={`absolute bottom-0 w-1 h-12 ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'}`}
                style={{ left: `${index * 272 + 208}px` }}
            />
            <div className={`absolute top-14 left-1/2 transform -translate-x-1/2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} whitespace-nowrap`} style={{ left: `${index * 272 + 136}px` }}>
              {evidencia.fecha_inicio.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })} - {evidencia.fecha_fin.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  };

  const scrollToCurrentDate = () => {
    if (containerRef.current) {
      const currentIndex = evidencias.findIndex(ev => 
        ev.fecha_inicio <= currentDate && ev.fecha_fin >= currentDate
      );
      if (currentIndex !== -1) {
        const scrollPosition = currentIndex * 272;
        containerRef.current.scrollTo({
          left: scrollPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  const formatCurrentDate = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleString('es-ES', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  return (
    <div className={`w-full p-1 ${firaCode.className}`}>
      <h2 className={`text-2xl ${isDarkMode ? 'font-light' : 'font-normal'} mb-4`}>Planificación</h2>
      <div className="flex justify-between items-center">
        <Button 
        onClick={scrollToCurrentDate} 
        variant="outline"
        className={`${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
        >
          Hoy
        </Button>
        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {formatCurrentDate(currentDate)}
        </div>
      </div>
      <div className="relative overflow-x-auto" ref={containerRef}>
        <div style={{ width: `${evidencias.length * 272}px` }}>
          {renderTimeline()}
          <div className="flex flex-nowrap space-x-4 pb-4">
            {evidencias.map((evidencia) => (
              <Card 
                key={evidencia.id}
                className={`flex-shrink-0 w-64 h-64 transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl border flex flex-col ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className={`text-xs truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{evidencia.codigo}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow overflow-y-auto">
                  <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{evidencia.detalle}</p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Inicio: {evidencia.fecha_inicio.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Fin: {evidencia.fecha_fin.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </CardContent>
                {isGrupoExperimental && (
                  <CardFooter className="flex flex-col space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`w-full ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : ''}`}
                      onClick={() => handlePlanificar(evidencia)}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Planificar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`w-full ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : ''}`}
                      onClick={() => handleToggleUpload(evidencia.id, evidencia.isUploaded || false)}
                    >
                      {evidencia.isUploaded ? (
                        <Check className="mr-2 h-4 w-4" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      {evidencia.isUploaded ? 'Subida' : 'Marcar'}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>

      {isGrupoExperimental && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className={`sm:max-w-[600px] max-h-[90vh] overflow-y-auto ${firaCode.className} ${
            isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'
          }`}aria-describedby="dialog-description">
            <DialogHeader>
              <DialogTitle className={isDarkMode ? 'text-gray-200' : ''}>Planificar Evidencia: {selectedEvidencia?.codigo}</DialogTitle>
              <DialogDescription id="dialog-description">
                Planifica tareas para la evidencia seleccionada. Puedes añadir nuevas tareas y ver las tareas existentes.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <p><strong>Descripción:</strong> {selectedEvidencia?.detalle}</p>
                <p><strong>Inicio:</strong> {selectedEvidencia?.fecha_inicio.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Fin:</strong> {selectedEvidencia?.fecha_fin.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="task" className={`sm:text-right ${isDarkMode ? 'text-gray-300' : ''}`}>
                  Tarea
                </Label>
                <div className="col-span-1 sm:col-span-3 flex items-center">
                  <Input
                    id="task"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    className={`w-full ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : ''}`}
                    placeholder="Descripción de la tarea"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="reminder" className={`sm:text-right ${isDarkMode ? 'text-gray-300' : ''}`}>
                  Fecha
                </Label>
                <div className="col-span-1 sm:col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="reminder"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !reminderDate && "text-muted-foreground",
                          isDarkMode && "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {reminderDate ? format(reminderDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className={`w-auto p-0 ${isDarkMode ? 'bg-gray-800' : ''}`}>
                      <CalendarComponent
                        mode="single"
                        selected={reminderDate}
                        onSelect={setReminderDate}
                        initialFocus
                        className={isDarkMode ? 'bg-gray-800 text-white' : ''}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className={`sm:text-right ${isDarkMode ? 'text-gray-300' : ''}`}>
                  Hora
                </Label>
                <div className="col-span-1 sm:col-span-3 flex items-center">
                  <TimeSelect
                    value={reminderTime}
                    onChange={setReminderTime}
                    isDarkMode={isDarkMode}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddTask} className={isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : ''}>Añadir Tarea</Button>
            </DialogFooter>
            <div className="mt-4">
              <h4 className={`mb-2 font-semibold ${isDarkMode ? 'text-gray-200' : ''}`}>Tareas Planificadas:</h4>
              <ul>
                {tasks.map((task) => (
                  <li key={task.id} className={`flex justify-between items-center mb-2 ${isDarkMode ? 'text-gray-300' : ''}`}>
                    <span>
                      {task.description} - {task.reminderDate?.toLocaleDateString() || 'Fecha no establecida'} 
                      {task.reminderTime ? ` ${task.reminderTime}` : ''}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                      className={isDarkMode ? 'hover:bg-gray-700' : ''}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}