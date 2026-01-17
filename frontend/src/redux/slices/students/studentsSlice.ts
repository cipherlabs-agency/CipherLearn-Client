import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Students slice state
 */
interface StudentsState {
    selectedStudentId: number | null;
    isEditModalOpen: boolean;
    searchQuery: string;
    selectedBatchFilter: number | null;
}

const initialState: StudentsState = {
    selectedStudentId: null,
    isEditModalOpen: false,
    searchQuery: '',
    selectedBatchFilter: null,
};

const studentsSlice = createSlice({
    name: 'students',
    initialState,
    reducers: {
        setSelectedStudentId: (state, action: PayloadAction<number | null>) => {
            state.selectedStudentId = action.payload;
        },
        openEditModal: (state) => {
            state.isEditModalOpen = true;
        },
        closeEditModal: (state) => {
            state.isEditModalOpen = false;
        },
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload;
        },
        setSelectedBatchFilter: (state, action: PayloadAction<number | null>) => {
            state.selectedBatchFilter = action.payload;
        },
        resetStudentsState: (state) => {
            state.selectedStudentId = null;
            state.isEditModalOpen = false;
            state.searchQuery = '';
            state.selectedBatchFilter = null;
        },
    },
});

export const {
    setSelectedStudentId,
    openEditModal,
    closeEditModal,
    setSearchQuery,
    setSelectedBatchFilter,
    resetStudentsState,
} = studentsSlice.actions;

export default studentsSlice.reducer;
