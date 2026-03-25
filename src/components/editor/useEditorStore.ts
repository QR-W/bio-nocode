import { create } from 'zustand'
import type { ComponentConfig, PageConfig, FieldDef } from '../../types/AppConfig'

export type SelectionType = 'page' | 'component' | 'field' | null

interface EditorState {
    selectionType: SelectionType
    selectedPage: PageConfig | null
    selectedComponent: ComponentConfig | null
    selectedField: FieldDef | null

    selectPage: (page: PageConfig) => void
    selectComponent: (comp: ComponentConfig, page: PageConfig) => void
    selectField: (field: FieldDef) => void
    clearSelection: () => void
}

export const useEditorStore = create<EditorState>((set) => ({
    selectionType: null,
    selectedPage: null,
    selectedComponent: null,
    selectedField: null,

    selectPage: (page) => set({
        selectionType: 'page',
        selectedPage: page,
        selectedComponent: null,
        selectedField: null,
    }),

    selectComponent: (comp, page) => set({
        selectionType: 'component',
        selectedPage: page,
        selectedComponent: comp,
        selectedField: null,
    }),

    selectField: (field) => set({
        selectionType: 'field',
        selectedPage: null,
        selectedComponent: null,
        selectedField: field,
    }),

    clearSelection: () => set({
        selectionType: null,
        selectedPage: null,
        selectedComponent: null,
        selectedField: null,
    }),
}))