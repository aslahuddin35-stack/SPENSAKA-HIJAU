/**
 * E-VOTING SMPN 1 SUKAMULIA 2026/2027
 * Main Application Root
 * @license Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { School, Election, AuthSession } from './types';
import { db } from './services/db';

// Layout Components
import { Header } from './components/layout/Header';
import { Sidebar, AdminTab } from './components/layout/Sidebar';
import { SqlMigrationModal } from './components/common/SqlMigrationModal';

// Views
import { LoginView } from './views/auth/LoginView';
import { StudentVotingView } from './views/student/StudentVotingView';
import { AdminDashboardView } from './views/admin/AdminDashboardView';
import { AdminClassesView } from './views/admin/AdminClassesView';
import { AdminStudentsView } from './views/admin/AdminStudentsView';
import { AdminCandidatesView } from './views/admin/AdminCandidatesView';
import { AdminResultsView } from './views/admin/AdminResultsView';
import { AdminBeritaAcaraView } from './views/admin/AdminBeritaAcaraView';
import { AdminSettingsView } from './views/admin/AdminSettingsView';
import { LiveQuickCountView } from './views/admin/LiveQuickCountView';

const SESSION_KEY = 'evoting_active_session';

export default function App() {
  const [school, setSchool] = useState<School>(db.getSchool());
  const [election, setElection] = useState<Election>(db.getElection());
  const [session, setSession] = useState<AuthSession | null>(null);
  const [currentAdminTab, setCurrentAdminTab] = useState<AdminTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isQuickCountOpen, setIsQuickCountOpen] = useState(false);

  // Restore session from sessionStorage (safe per browser session)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed: AuthSession = JSON.parse(stored);
        if (parsed.expiresAt > Date.now()) {
          setSession(parsed);
        } else {
          sessionStorage.removeItem(SESSION_KEY);
        }
      }
    } catch (e) {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, []);

  const handleLoginSuccess = (newSession: AuthSession) => {
    setSession(newSession);
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    } catch (e) {
      // ignore
    }
  };

  const handleLogout = () => {
    setSession(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (e) {
      // ignore
    }
  };

  // If not logged in, show Login View
  if (!session) {
    return (
      <>
        <LoginView
          school={school}
          election={election}
          onLoginSuccess={handleLoginSuccess}
          onOpenSqlModal={() => setIsSqlModalOpen(true)}
        />
        <SqlMigrationModal
          isOpen={isSqlModalOpen}
          onClose={() => setIsSqlModalOpen(false)}
        />
      </>
    );
  }

  // If Student role, show Student Voting View
  if (session.role === 'student' && session.student) {
    return (
      <StudentVotingView
        student={session.student}
        school={school}
        election={election}
        onLogout={handleLogout}
      />
    );
  }

  // Admin Dashboard Layout
  return (
    <div className="flex h-screen bg-slate-100/70 overflow-hidden font-sans text-slate-800">
      {/* Sidebar Desktop & Mobile */}
      <Sidebar
        currentTab={currentAdminTab}
        onSelectTab={setCurrentAdminTab}
        onLogout={handleLogout}
        onOpenQuickCount={() => setIsQuickCountOpen(true)}
        school={school}
        election={election}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          school={school}
          election={election}
          session={session}
          onLogout={handleLogout}
          onOpenSqlModal={() => setIsSqlModalOpen(true)}
          onOpenQuickCount={() => setIsQuickCountOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* View Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {currentAdminTab === 'dashboard' && (
              <AdminDashboardView
                school={school}
                election={election}
                onNavigateTab={setCurrentAdminTab}
                onOpenSqlModal={() => setIsSqlModalOpen(true)}
              />
            )}

            {currentAdminTab === 'classes' && (
              <AdminClassesView />
            )}

            {currentAdminTab === 'students' && (
              <AdminStudentsView
                school={school}
                election={election}
              />
            )}

            {currentAdminTab === 'candidates' && (
              <AdminCandidatesView
                election={election}
              />
            )}

            {currentAdminTab === 'results' && (
              <AdminResultsView
                school={school}
                election={election}
                onNavigateTab={setCurrentAdminTab}
                onOpenQuickCount={() => setIsQuickCountOpen(true)}
              />
            )}

            {currentAdminTab === 'documents' && (
              <AdminBeritaAcaraView
                school={school}
                election={election}
              />
            )}

            {currentAdminTab === 'settings' && (
              <AdminSettingsView
                school={school}
                election={election}
                onUpdateSchool={setSchool}
                onUpdateElection={setElection}
                onOpenSqlModal={() => setIsSqlModalOpen(true)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Supabase SQL Migration Modal */}
      <SqlMigrationModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />

      {/* Live Quick Count Projector Full Screen View */}
      {isQuickCountOpen && (
        <LiveQuickCountView
          school={school}
          election={election}
          onExit={() => setIsQuickCountOpen(false)}
        />
      )}
    </div>
  );
}
