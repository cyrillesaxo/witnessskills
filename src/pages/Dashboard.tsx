import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { BookOpen, User, LogOut, Award } from 'lucide-react';

export default function Dashboard() {
  const { user, signOut } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50">
              <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                                <Award className="w-6 h-6 text-indigo-600" />
                                          <h1 className="text-xl font-bold text-gray-900">WitnessSkills</h1>
                                                  </div>
                                                          <div className="flex items-center gap-4">
                                                                    <span className="text-sm text-gray-600">{user?.email}</span>
                                                                              <button onClick={signOut} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                                                                                          <LogOut className="w-4 h-4" />
                                                                                                      Sign out
                                                                                                                </button>
                                                                                                                        </div>
                                                                                                                              </header>
                                                                                                                                    <main className="max-w-4xl mx-auto px-6 py-10">
                                                                                                                                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
                                                                                                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                                                                                                              <Link to="/skills" className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                                                                                                                                                                          <div className="flex items-center gap-3 mb-3">
                                                                                                                                                                                        <BookOpen className="w-6 h-6 text-indigo-600" />
                                                                                                                                                                                                      <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
                                                                                                                                                                                                                  </div>
                                                                                                                                                                                                                              <p className="text-gray-500 text-sm">Manage and document your skills with evidence.</p>
                                                                                                                                                                                                                                        </Link>
                                                                                                                                                                                                                                                  <Link to="/profile" className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                                                                                                                                                                                                                                                              <div className="flex items-center gap-3 mb-3">
                                                                                                                                                                                                                                                                            <User className="w-6 h-6 text-indigo-600" />
                                                                                                                                                                                                                                                                                          <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                                  <p className="text-gray-500 text-sm">View and update your profile information.</p>
                                                                                                                                                                                                                                                                                                                            </Link>
                                                                                                                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                                                                                                          </main>
                                                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                                                                );
                                                                                                                                                                                                                                                                                                                                                }
