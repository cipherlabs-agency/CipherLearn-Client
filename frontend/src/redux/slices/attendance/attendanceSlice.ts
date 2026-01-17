import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Attendance view type
 */
export type AttendanceView = 'mark' | 'history' | 'report';

/**
 * Attendance slice state
 */
interface AttendanceState {
    currentBatch: string;
    selectedBatchId: number | null;
    date: string;
    view: AttendanceView;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
const getTodayDate = (): string => {
    return new Date().toISOString().split('T')[0];
};

const initialState: AttendanceState = {
    currentBatch: '',
    selectedBatchId: null,
    date: getTodayDate(),
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
        setView: (state, action: PayloadAction<AttendanceView>) => {
            state.view = action.payload;
        },
        resetAttendanceState: (state) => {
            state.currentBatch = '';
            state.selectedBatchId = null;
            state.date = getTodayDate();
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
