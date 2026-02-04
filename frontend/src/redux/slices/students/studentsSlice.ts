import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { Student } from '@/types';

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

// ==================== SELECTORS ====================

// Base selectors
const selectStudentsState = (state: RootState) => state.students;

// Memoized selectors for efficient state access
export const selectSelectedStudentId = createSelector(
    selectStudentsState,
    (students) => students.selectedStudentId
);

export const selectIsEditModalOpen = createSelector(
    selectStudentsState,
    (students) => students.isEditModalOpen
);

export const selectSearchQuery = createSelector(
    selectStudentsState,
    (students) => students.searchQuery
);

export const selectSelectedBatchFilter = createSelector(
    selectStudentsState,
    (students) => students.selectedBatchFilter
);

// Create a selector factory for filtering students by search query
export const createFilteredStudentsSelector = (students: Student[] | undefined) =>
    createSelector(
        selectSearchQuery,
        (searchQuery) => {
            if (!students) return [];
            if (!searchQuery.trim()) return students;

            const query = searchQuery.toLowerCase().trim();
            return students.filter((student) => {
                const fullname = student.fullname?.toLowerCase() || '';
                const email = student.email?.toLowerCase() || '';
                return fullname.includes(query) || email.includes(query);
            });
        }
    );

// Create a selector factory for filtering students by batch and search
export const createFilteredStudentsByBatchSelector = (students: Student[] | undefined) =>
    createSelector(
        [selectSearchQuery, selectSelectedBatchFilter],
        (searchQuery, batchFilter) => {
            if (!students) return [];

            let filtered = students;

            // Filter by batch if selected
            if (batchFilter !== null) {
                filtered = filtered.filter((student) => student.batchId === batchFilter);
            }

            // Filter by search query
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim();
                filtered = filtered.filter((student) => {
                    const fullname = student.fullname?.toLowerCase() || '';
                    const email = student.email?.toLowerCase() || '';
                    return fullname.includes(query) || email.includes(query);
                });
            }

            return filtered;
        }
    );

export default studentsSlice.reducer;
