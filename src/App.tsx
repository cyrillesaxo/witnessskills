import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Skills from './pages/Skills';
import Profile from './pages/Profile';
import Login from './pages/Login';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
      <AuthProvider>
            <BrowserRouter>
                    <Routes>
                              <Route path="/" element={<Dashboard />} />
                                        <Route path="/skills" element={<Skills />} />
                                                  <Route path="/profile" element={<Profile />} />
                                                            <Route path="/login" element={<Login />} />
                                                                    </Routes>
                                                                          </BrowserRouter>
                                                                              </AuthProvider>
                                                                                );
                                                                                }
