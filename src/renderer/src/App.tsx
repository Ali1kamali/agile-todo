import { useEffect, useState } from 'react'

import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import { PageName } from './types/pageName.type'
import { NewTodo } from './features/newTodo/newTodo.page'

interface PropInputs {
  setPage: (page: PageName) => void
}
function HomePage({ setPage }: PropInputs): React.JSX.Element {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>

      <div className="actions">
        <button
          className="p-1 border-2 border-green-500 rounded-md"
          onClick={() => setPage('todo')}
        >
          Todo
        </button>
        <button className="border-2 border-red-300" onClick={() => setPage('new')}>
          new Todo
        </button>
      </div>
      <Versions></Versions>
    </>
  )
}
function App(): React.JSX.Element {
  const [page, setPage] = useState<PageName>('home')

  if (page === 'home') {
    return <HomePage setPage={setPage} />
  } else if (page === 'new') {
    return <NewTodo setPage={setPage} listPage="todo" />
  } else {
    return <div></div>
  }
}

export default App
