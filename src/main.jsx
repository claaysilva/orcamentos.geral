import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import AdminClients from './pages/admin/clients'
import AdminQuotes from './pages/admin/quotes'
import QuoteEditor from './pages/admin/quoteEditor'
import PublicQuoteAccess from './pages/public/quoteAccess'
import './styles.css'

createRoot(document.getElementById('root')).render(
	<BrowserRouter>
		<Routes>
			<Route path="/" element={<App />} />
			<Route path="/admin/clients" element={<AdminClients />} />
			<Route path="/admin/quotes" element={<AdminQuotes />} />
			<Route path="/admin/quote/:id" element={<QuoteEditor />} />
			<Route path="/public/access" element={<PublicQuoteAccess />} />
		</Routes>
	</BrowserRouter>
)
