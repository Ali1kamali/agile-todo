import { useState } from 'react'
import Home from './features/todo/components/page'
import { NewCyclePage } from './features/newTodo/newTodo.page'
import { I18nProvider } from './i18n/I18nContext'
import { ThemeProvider } from './theme/ThemeContext'

type CurrentPage = 'home' | 'new-cycle'

function MainApp(): React.JSX.Element {
  const [currentPage, setCurrentPage] = useState<CurrentPage>('home')

  if (currentPage === 'new-cycle') {
    return (
      <NewCyclePage
        onBack={() => setCurrentPage('home')}
        onSuccess={() => setCurrentPage('home')}
      />
    )
  }

  return <Home onNavigateNewCycle={() => setCurrentPage('new-cycle')} />
}

export default function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <I18nProvider>
        <MainApp />
      </I18nProvider>
    </ThemeProvider>
  )
}
