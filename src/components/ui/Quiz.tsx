'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { collection, doc, getDoc, setDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ChevronRight, RotateCcw, Home, AlertCircle, Clock, Lock, BarChart } from 'lucide-react';
import AppBar from '@/components/ui/AppBar';
import { Fira_Code } from 'next/font/google'
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { LottieRefCurrentProps } from 'lottie-react';
// lottie-web accede a `document` al importarse, por eso se carga sin SSR
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import loginAnimation from './login-animation.json';

const firaCode = Fira_Code({ subsets: ['latin'] })

interface Question {
  question: string;
  options: string[];
  correct_answer: string;
}

interface QuizData {
  material_name: string;
  questions: Question[];
}

interface QuizResult {
  score: number;
  timestamp: Date;
}

interface QuizProps {
  materialId: string;
  materialUrl: string;
  userName: string;
  userFicha: string;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  handleLogout: () => void;
}

const Quiz: React.FC<QuizProps> = ({ 
  materialId, 
  materialUrl, 
  userName, 
  userFicha, 
  isDarkMode, 
  toggleDarkMode, 
  handleLogout 
}) => {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isTimeUpModalOpen, setIsTimeUpModalOpen] = useState(false);
  const [isHomeLoading, setIsHomeLoading] = useState(false);
  const router = useRouter();
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const fetchQuizData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const quizDoc = await getDoc(doc(db, 'quizzes', materialUrl));
      
      if (quizDoc.exists()) {
        const data = quizDoc.data() as QuizData;
        setQuizData(data);
        const selected = getRandomQuestions(data.questions, 5);
        setSelectedQuestions(selected);
        setUserAnswers(new Array(selected.length).fill(''));
      } else {
        throw new Error("Quiz not found for this material");
      }

      const user = auth.currentUser;
      if (user) {
        const attemptsQuery = query(
          collection(db, 'quizResults'),
          where('userId', '==', user.uid),
          where('materialId', '==', materialId),
          orderBy('timestamp', 'desc'),
          limit(3)
        );
        const attemptsSnapshot = await getDocs(attemptsQuery);
        const results: QuizResult[] = [];
        attemptsSnapshot.forEach((doc) => {
          const data = doc.data();
          results.push({
            score: data.score,
            timestamp: data.timestamp.toDate(),
          });
        });
        setQuizResults(results.reverse()); // Reverse the order to show oldest first
        setAttemptCount(results.length);
      }
    } catch (error) {
      console.error("Error fetching quiz data:", error);
      setError(error instanceof Error ? error.message : "Error al cargar el quiz. Por favor, intenta de nuevo más tarde.");
    }
    setLoading(false);
    setTimeLeft(300); // Reset timer when fetching new quiz data
  }, [materialId, materialUrl]);

  useEffect(() => {
    fetchQuizData();
  }, [fetchQuizData]);

  useEffect(() => {
    if (attemptCount < 3) {
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            setIsTimeUpModalOpen(true);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [attemptCount]);

  const getRandomQuestions = (questions: Question[], n: number) => {
    const shuffledQuestions = shuffleArray(questions);
    return shuffledQuestions.slice(0, n).map(q => ({
      ...q,
      options: shuffleArray(q.options)
    }));
  };

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (userAnswers.some(answer => answer === '')) {
      setIsValidationModalOpen(true);
      return;
    }

    let correct = 0;
    selectedQuestions.forEach((q, i) => {
      if (q.correct_answer === userAnswers[i]) correct++;
    });
    
    const score = (correct / selectedQuestions.length) * 100;
    setScore(score);

    const user = auth.currentUser;
    if (user) {
      const resultRef = doc(collection(db, 'quizResults'));
      const newResult: QuizResult = {
        score,
        timestamp: new Date(),
      };
      await setDoc(resultRef, {
        userId: user.uid,
        materialId,
        ...newResult,
        answers: userAnswers,
      });
      setQuizResults([...quizResults, newResult]);
      setAttemptCount(prevCount => prevCount + 1);
    }
  };

  const handleNextQuestion = () => {
    if (userAnswers[currentQuestionIndex] === '') {
      setIsValidationModalOpen(true);
      return;
    }

    if (currentQuestionIndex < selectedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handleRetry = () => {
    if (attemptCount < 3) {
      setScore(null);
      setCurrentQuestionIndex(0);
      setUserAnswers(new Array(selectedQuestions.length).fill(''));
      fetchQuizData();
    }
  };

  const handleReturnHome = () => {
    setIsHomeLoading(true);
    if (lottieRef.current) {
      lottieRef.current.play();
    }
    setTimeout(() => {
      router.push('/home');
    }, 1000); // Delay navigation to show animation
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const renderAttemptsSummary = () => {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className={`text-3xl ${isDarkMode ? 'font-light' : 'font-normal'}`}>Resumen de Intentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center">
            <BarChart className="h-16 w-16 text-blue-500 mb-4" />
            <p className="text-xl text-center">Has completado tus 3 intentos para este quiz.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizResults.map((result, index) => (
              <div key={index} className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className="font-semibold">Intento {index + 1}</p>
                <p>Puntuación: {result.score.toFixed(2)}%</p>
                <p>Fecha: {result.timestamp.toLocaleDateString()}</p>
                <p>Hora: {result.timestamp.toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <Button onClick={handleReturnHome} size="lg" className="w-full max-w-md">
              <Home className="mr-2 h-5 w-5" /> Volver al inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <Lottie animationData={loginAnimation} style={{ width: 100, height: 100 }} />
          <p className="mt-4 text-lg">Cargando quiz...</p>
        </div>
      );
    }

    if (error) {
      return (
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle className={`${isDarkMode ? 'font-light' : 'font-normal'}`}>Error al cargar el quiz</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      );
    }

    if (attemptCount >= 3) {
      return renderAttemptsSummary();
    }

    if (score !== null) {
      return (
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle className={`text-3xl ${isDarkMode ? 'font-light' : 'font-normal'}`}>Resultado del Quiz</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-5xl font-bold mb-2">{score.toFixed(2)}%</p>
              <p className="text-xl">Tu puntuación</p>
            </div>
            {score >= 80 ? (
              <p className="text-2xl text-green-600 text-center">¡Excelente trabajo! Has aprobado el quiz.</p>
            ) : (
              <p className="text-2xl text-red-600 text-center">Sigue estudiando y vuelve a intentarlo.</p>
            )}
            <div className="flex justify-center">
              <Button onClick={handleRetry} size="lg" className="w-full max-w-md" disabled={attemptCount >= 3}>
                <RotateCcw className="mr-2 h-5 w-5" /> Volver a intentar
              </Button>
            </div>
            <p className="text-center mt-4">
              Intentos restantes: {Math.max(0, 3 - attemptCount)}
            </p>
          </CardContent>
        </Card>
      );
    }

    if (!quizData || selectedQuestions.length === 0) {
      return <div className="flex justify-center items-center h-full">No se pudo cargar el quiz. Por favor, intenta de nuevo más tarde.</div>;
    }

    const currentQuestion = selectedQuestions[currentQuestionIndex];

    return (
      <Card className={`w-full shadow-xl ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
        <CardHeader className="border-b border-gray-700">
          <CardTitle className={`text-2xl ${isDarkMode ? 'font-light' : 'font-normal'}`}>{quizData.material_name}</CardTitle>
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-gray-400">Intento {attemptCount + 1} de 3</p>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className={`text-sm font-medium ${timeLeft <= 60 ? 'text-red-500' : 'text-gray-400'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <Button
                onClick={handleReturnHome}
                variant="ghost"
                size="icon"
                className="w-8 h-8 p-0"
                disabled={isHomeLoading}
              >
                {isHomeLoading ? (
                  <Lottie 
                    lottieRef={lottieRef}
                    animationData={loginAnimation} 
                    style={{ width: 24, height: 24 }} 
                    loop={true}
                  />
                ) : (
                  <Home className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">{currentQuestion.question}</h3>
            <RadioGroup 
              value={userAnswers[currentQuestionIndex]} 
              onValueChange={handleAnswerSelect}
              className="space-y-2"
            >
              {currentQuestion.options.map((option, j) => (
                <div key={j} className={`flex items-center space-x-2 p-3 rounded-lg transition-colors duration-200 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                  <RadioGroupItem value={option} id={`question-${currentQuestionIndex}-option-${j}`} />
                  <Label htmlFor={`question-${currentQuestionIndex}-option-${j}`} className="flex-grow cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="flex justify-between items-center mt-6">
            <span className="text-sm font-medium text-gray-400">
              {currentQuestionIndex + 1} de {selectedQuestions.length}
            </span>
            <Button 
              onClick={handleNextQuestion}
              variant="default"
              className={`shadow-sm ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
            >
              {currentQuestionIndex === selectedQuestions.length - 1 ? 'Finalizar' : 'Siguiente'} <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`min-h-screen ${firaCode.className} ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-white text-black'}`}>
      <AppBar
        userName={userName}
        userFicha={userFicha}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        handleLogout={handleLogout}
      />
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-4xl px-4 py-8 mt-16">
          {renderContent()}
        </div>
      </div>
      <Dialog open={isValidationModalOpen} onOpenChange={setIsValidationModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respuesta requerida</DialogTitle>
            <DialogDescription>
              Por favor, selecciona una respuesta antes de continuar.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center text-yellow-500">
            <AlertCircle className="h-16 w-16" />
          </div>
          <DialogFooter>
            <Button onClick={() => setIsValidationModalOpen(false)}>Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isTimeUpModalOpen} onOpenChange={setIsTimeUpModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¡Tiempo agotado!</DialogTitle>
            <DialogDescription>
              Se ha agotado el tiempo para completar el quiz. No te preocupes, este intento no contará para tu límite de 3 intentos.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center text-red-500">
            <Clock className="h-16 w-16" />
          </div>
          <DialogFooter>
            <Button onClick={() => {
              setIsTimeUpModalOpen(false);
              handleRetry();
            }}>Intentar de nuevo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Quiz;