// Re-export APIs from specialized service files
export * from './authApi';
export * from './playerApi';

// Explicitly re-export only non-conflicting items from adminApi
export {
  // Theme Management
  getAllThemes,
  getThemeDetails,
  createTheme,
  updateTheme,
  activateTheme,
  deactivateTheme,
  rollbackTheme,
  deleteTheme,
  // File Upload
  uploadThemeAssets,
  uploadImage,
  listAllAssets,
  listThemeAssets,
  deleteAsset,
  // Reports
  getRTPReport,
  getAllThemesRTP,
  getThemeRTPHistory,
  getSpinLogsReport,
  getUserActivityReport,
  getTransactionReport,
  getThemePerformance,
  getAdminLogs,
  // Export
  exportSpinsCSV,
  exportTransactionsCSV,
  exportUsersCSV,
  exportRTPCSV,
  exportAdminLogsCSV,
  // Gamification Admin
  getAchievementStats,
  createAchievement,
  deleteAchievement,
  generateLeaderboard,
  refreshLeaderboards,
  // Spin Audit
  auditSpin,
  // Helper
  downloadCSV,
  // Types (with aliases to avoid conflicts)
  type CreateThemeRequest,
  type UpdateThemeRequest,
  type RTPReportParams,
  type SpinReportParams,
  type UserReportParams,
  type TransactionReportParams,
  type CreateAchievementRequest,
} from './adminApi';

// For backward compatibility, export individual functions
import { loginUser, registerUser, refreshAccessToken, logoutUser } from './authApi';
import { 
  spinSlot, 
  getWalletBalance, 
  getActiveThemes, 
  getMyAchievements, 
  getLeaderboard 
} from './playerApi';

export {
  // Auth
  loginUser,
  registerUser,
  refreshAccessToken,
  logoutUser,
  // Player
  spinSlot,
  getWalletBalance,
  getActiveThemes,
  getMyAchievements as getUserAchievements,
  getLeaderboard,
};

// Re-export for legacy compatibility
export { default as apiClient } from './playerApi';
export { default } from './playerApi';

