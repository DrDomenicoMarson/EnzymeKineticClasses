import { useAppContext } from '../context/useAppContext';

/**
 * Toggles the projector-friendly lecture mode.
 *
 * @returns The lecture-mode toggle button.
 */
export function LectureModeToggle() {
  const { isLectureMode, toggleLectureMode } = useAppContext();

  return (
    <button
      onClick={toggleLectureMode}
      className={`px-4 py-2 rounded font-medium transition-colors ${
        isLectureMode 
          ? 'bg-blue-600 text-white hover:bg-blue-700' 
          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
      }`}
    >
      {isLectureMode ? 'Lecture Mode: ON' : 'Lecture Mode: OFF'}
    </button>
  );
}
