import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProviders, FocusShell, Shell } from './Shell';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { CurriculumPage } from '@/features/learn/CurriculumPage';
import { ChapterPage } from '@/features/learn/ChapterPage';
import { LessonPage } from '@/features/learn/LessonPage';
import { AssessmentPage } from '@/features/learn/AssessmentPage';
import { LabPage } from '@/features/lab/LabPage';
import { PracticePage } from '@/features/practice/PracticePage';
import { QuizPage } from '@/features/practice/QuizPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { AboutPage } from '@/features/about/AboutPage';

export function AppRouter() {
  return (
    <HashRouter>
      <AppProviders>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<DashboardPage />} />
            <Route path="learn" element={<CurriculumPage />} />
            <Route path="learn/:chapterId" element={<ChapterPage />} />
            <Route path="lab" element={<LabPage />} />
            <Route path="lab/:tool" element={<LabPage />} />
            <Route path="practice" element={<PracticePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="about" element={<AboutPage />} />
          </Route>
          <Route element={<FocusShell />}>
            <Route path="learn/:chapterId/assessment" element={<AssessmentPage />} />
            <Route path="learn/:chapterId/:lessonId" element={<LessonPage />} />
            <Route path="practice/quiz" element={<QuizPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppProviders>
    </HashRouter>
  );
}
