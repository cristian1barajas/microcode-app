'use client'

import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc, setDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ChevronRight, RotateCcw, Home, AlertCircle } from 'lucide-react';
import AppBar from '@/components/ui/AppBar';
import { Fira_Code } from 'next/font/google'
import { useRouter } from 'next/navigation';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const router = useRouter();

  const fetchQuizData = async () => {
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
          limit(1)
        );
        const attemptsSnapshot = await getDocs(attemptsQuery);
        setAttemptCount(attemptsSnapshot.size);
      }
    } catch (error) {
      console.error("Error fetching quiz data:", error);
      setError(error instanceof Error ? error.message : "Error al cargar el quiz. Por favor, intenta de nuevo más tarde.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuizData();
  }, [materialId, materialUrl]);

  const getRandomQuestions = (questions: Question[], n: number) => {
    return questions.sort(() => 0.5 - Math.random()).slice(0, n);
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
      await setDoc(resultRef, {
        userId: user.uid,
        materialId,
        score,
        answers: userAnswers,
        timestamp: new Date()
      });
      setAttemptCount(attemptCount + 1);
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
    setScore(null);
    setCurrentQuestionIndex(0);
    setUserAnswers(new Array(selectedQuestions.length).fill(''));
    fetchQuizData();
  };

  const handleReturnHome = () => {
    router.push('/home');
  };

  const renderContent = () => {
    if (loading) {
      return <div className="flex justify-center items-center h-full">Cargando quiz...</div>;
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
            {attemptCount >= 3 && (
              <p className="text-yellow-600 text-center mt-4">Has alcanzado el máximo de 3 intentos para este quiz. Por favor, revisa el material y vuelve más tarde.</p>
            )}
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
            <Button
              onClick={handleReturnHome}
              variant="ghost"
              size="icon"
              className="w-8 h-8 p-0"
            >
              <Home className="h-4 w-4" />
            </Button>
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
    </div>
  );
};

export default Quiz;