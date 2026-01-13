import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AttendanceState {
    currentBatch: string;
    selectedBatchId: number | null;
    date: string;
    view: 'mark' | 'history' | 'report';
}

const initialState: AttendanceState = {
    currentBatch: '',
    selectedBatchId: null,
    date: new Date().toISOString().split('T')[0],
    view: 'mark',
};

const attendanceSlice = createSlice({
    name: 'attendance',
    initialState,
    reducers: {
        setBatch: (state, action: PayloadAction<string>) => {
            state.currentBatch = action.payload;
        },
        setSelectedBatchId: (state, action: PayloadAction<number | null>) => {
            state.selectedBatchId = action.payload;
        },
        setDate: (state, action: PayloadAction<string>) => {
            state.date = action.payload;
        },
        setView: (state, action: PayloadAction<'mark' | 'history' | 'report'>) => {
            state.view = action.payload;
        },
        resetAttendanceState: (state) => {
            state.currentBatch = '';
            state.selectedBatchId = null;
            state.date = new Date().toISOString().split('T')[0];
            state.view = 'mark';
        },
    },
});

export const {
    setBatch,
    setSelectedBatchId,
    setDate,
    setView,
    resetAttendanceState,
} = attendanceSlice.actions;

export default attendanceSlice.reducer;
