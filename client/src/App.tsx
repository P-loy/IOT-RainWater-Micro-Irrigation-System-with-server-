import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
export default function App(){const hasToken=!!localStorage.getItem('token');return(<Routes><Route path='/' element={<Navigate to={hasToken?'/dashboard':'/login'} replace/>}/><Route path='/login' element={<Login/>}/><Route path='/dashboard' element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/><Route path='*' element={<Navigate to='/' replace/>}/></Routes>)}
