import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { MyHomePage } from './pages/MyHomePage';
import { RetrofitPlanPage } from './pages/RetrofitPlanPage';
import { WhatIfPage } from './pages/WhatIfPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { AssumptionsPage } from './pages/AssumptionsPage';
import { MemoryPage } from './pages/MemoryPage';
import { AssessmentResult, PropertyProfile } from './types';
import { DEMO_PROPERTIES, getDemoProperty } from './engine/demoProperties';
import { runFullAssessment } from './engine/scoring';

const DEMO_IDS = DEMO_PROPERTIES.map((p) => p.property_id);

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('my-home');
  const [propertyId, setPropertyId] = useState<string>('P10001');
  const [isDark, setIsDark] = useState<boolean>(false);

  // Initialize with immediate synchronous assessment to eliminate blank screens
  const [assessment, setAssessment] = useState<AssessmentResult>(() =>
    runFullAssessment(getDemoProperty('P10001'))
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync dark theme class on document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Load active property assessment
  const fetchAssessment = (id: string) => {
    fetch(`/api/properties/${id}/assess`)
      .then((res) => {
        if (!res.ok) throw new Error('API returned ' + res.status);
        return res.json();
      })
      .then((data: AssessmentResult) => {
        if (data && data.score) {
          setAssessment(data);
        }
      })
      .catch((err) => {
        console.warn('Network API fetch failed; using local evaluation engine:', err);
        const fallbackProp = getDemoProperty(id);
        setAssessment(runFullAssessment(fallbackProp));
      });
  };

  useEffect(() => {
    const fallback = getDemoProperty(propertyId);
    setAssessment(runFullAssessment(fallback));
    fetchAssessment(propertyId);
  }, [propertyId]);

  // Handle custom what-if scenario or edited property
  const handleUpdateScenario = (
    selectedMeasures: string[],
    editedProfile?: Partial<PropertyProfile>
  ) => {
    fetch(`/api/properties/${propertyId}/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selected_measures: selectedMeasures,
        edited_profile: editedProfile,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Scenario API error');
        return res.json();
      })
      .then((data: AssessmentResult) => {
        if (data && data.score) {
          setAssessment(data);
        }
      })
      .catch((err) => {
        console.warn('Scenario server error; running local scenario simulation:', err);
        const currentProp = assessment.profile;
        const mergedProfile = { ...currentProp, ...(editedProfile || {}) };
        const local = runFullAssessment(mergedProfile);
        setAssessment(local);
      });
  };

  const handleSelectPropertyFromPortfolio = (id: string) => {
    setPropertyId(id);
    setCurrentPage('my-home');
  };

  return (
    <div className="h-screen w-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 antialiased overflow-hidden">
      {/* Pinned Left Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />

      {/* Main Content Area with Fixed Header & Smooth Internal Scroll */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          currentPage={currentPage}
          propertyId={propertyId}
          onSelectProperty={(id) => setPropertyId(id)}
          availableIds={DEMO_IDS}
          isDark={isDark}
          onToggleTheme={() => setIsDark(!isDark)}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          {currentPage === 'about' && (
            <HomePage onNavigate={(page) => setCurrentPage(page)} />
          )}

          {currentPage === 'my-home' && (
            <MyHomePage
              assessment={assessment}
              onNavigate={(page) => setCurrentPage(page)}
              onUpdateScenario={handleUpdateScenario}
              isLoading={isLoading}
            />
          )}

          {currentPage === 'plan' && (
            <RetrofitPlanPage
              assessment={assessment}
              isLoading={isLoading}
            />
          )}

          {currentPage === 'whatif' && (
            <WhatIfPage
              assessment={assessment}
              onUpdateScenario={handleUpdateScenario}
              isLoading={isLoading}
            />
          )}

          {currentPage === 'portfolio' && (
            <PortfolioPage
              onSelectProperty={handleSelectPropertyFromPortfolio}
            />
          )}

          {currentPage === 'assumptions' && <AssumptionsPage />}

          {currentPage === 'memory' && (
            <MemoryPage
              assessment={assessment}
              onRefreshAssessment={() => fetchAssessment(propertyId)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
