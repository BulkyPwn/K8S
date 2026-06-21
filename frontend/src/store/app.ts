import { create } from 'zustand'

interface AppState {
  namespace: string
  setNamespace: (ns: string) => void
  activeCluster: string
  setActiveCluster: (id: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  namespace: '',
  setNamespace: (ns) => set({ namespace: ns }),
  activeCluster: '',
  setActiveCluster: (id) => set({ activeCluster: id }),
}))
