# TODO — 5x6 slot game

## Backend (APIs and services)
- [ ] Asset upload and storage: harden Multer pipeline (size/type limits, validation), persist assets to durable storage/CDN, and add list/delete endpoints for assets and themes. Touch points: [backend/src/controllers/uploadController.ts](backend/src/controllers/uploadController.ts), [backend/src/config/multer.ts](backend/src/config/multer.ts).
- [ ] Theme preview and validation: add preview endpoint and enforce manifest vs strict schema validation using [backend/src/utils/themeValidator.ts](backend/src/utils/themeValidator.ts); ensure admin flow blocks invalid themes in [backend/src/controllers/adminController.ts](backend/src/controllers/adminController.ts).
- [ ] Theme rollback/version diff: create rollback endpoint and diff view; persist version history in Prisma models/migrations so admins can revert bad deployments.
- [ ] RTP reports: finalize automated RTP computation/export in [backend/src/services/rtpService.ts](backend/src/services/rtpService.ts) and expose via [backend/src/routes/reportRoutes.ts](backend/src/routes/reportRoutes.ts).
- [ ] CSV exports: complete CSV responses for reports in [backend/src/controllers/exportController.ts](backend/src/controllers/exportController.ts).
- [ ] Leaderboards and achievements: add admin generation/refresh endpoints and persistence in [backend/src/services/leaderboardService.ts](backend/src/services/leaderboardService.ts) and [backend/src/services/achievementService.ts](backend/src/services/achievementService.ts); expose via [backend/src/routes/gamificationRoutes.ts](backend/src/routes/gamificationRoutes.ts).
- [ ] Socket.IO real-time events: emit balance, achievement, and notification updates from [backend/src/services/socketService.ts](backend/src/services/socketService.ts) and hook into spin flow in [backend/src/controllers/slotController.ts](backend/src/controllers/slotController.ts).
- [ ] Monitoring: wire Grafana/Loki dashboards and Prometheus alerts to the metrics emitted in [backend/src/utils/metrics.ts](backend/src/utils/metrics.ts); secure metrics route if public.
- [ ] Tests: add unit/integration tests for RNG fairness, wallet atomicity, spin flow, and admin APIs.

## Frontend (web app)
- [ ] Player UI completeness: finalize wallet display, transaction history, leaderboard/achievements views, and error/loading states in [frontend/src/components/SlotMachine.tsx](frontend/src/components/SlotMachine.tsx) and related screens.
- [ ] Theme selection and preview: improve picker and live preview/validation in [frontend/src/components/ThemeSelection.tsx](frontend/src/components/ThemeSelection.tsx), [frontend/src/components/ThemePreview.tsx](frontend/src/components/ThemePreview.tsx), and [frontend/src/components/ThemeCRUD.tsx](frontend/src/components/ThemeCRUD.tsx).
- [ ] Admin asset upload UI: add file inputs, progress, and preview for theme assets/symbol art in [frontend/src/components/ThemeCRUD.tsx](frontend/src/components/ThemeCRUD.tsx); connect to upload/list/delete endpoints via [frontend/src/services/adminApi.ts](frontend/src/services/adminApi.ts).
- [ ] Reports and analytics UI: build filters and tables (RTP, spins, transactions) in [frontend/src/components/ReportsAnalytics.tsx](frontend/src/components/ReportsAnalytics.tsx) using admin report APIs.
- [ ] User management UI: finish status/role actions plus search/filter/pagination in [frontend/src/components/UserManagement.tsx](frontend/src/components/UserManagement.tsx).
- [ ] Auth enhancements: add guest mode, remember-me, password reset, and social login flows in [frontend/src/contexts/AuthContext.tsx](frontend/src/contexts/AuthContext.tsx) and screens [frontend/src/components/Login.tsx](frontend/src/components/Login.tsx), [frontend/src/components/Register.tsx](frontend/src/components/Register.tsx), [frontend/src/components/AdminLogin.tsx](frontend/src/components/AdminLogin.tsx).
- [ ] Socket.IO client: handle real-time balance/notifications in a hook (extend [frontend/src/hooks/useSlotGame.ts](frontend/src/hooks/useSlotGame.ts)) and surface to UI.
- [ ] Theme preview modal: finish asset/layout preview experience in [frontend/src/components/PreviewModal.tsx](frontend/src/components/PreviewModal.tsx).
- [ ] Tests: add component/unit tests for game flow, admin CRUD, services, and critical hooks.

## Missing or partial functionality
- [ ] Theme rollback/version diff across backend and admin UI.
- [ ] End-to-end RTP automated reporting plus CSV export.
- [ ] Real-time balance and achievement updates via Socket.IO (backend + frontend).
- [ ] Leaderboard generation/refresh triggers and UI surfacing.
- [ ] Full transaction history UI and export.
- [ ] Guest mode and social login support.
- [ ] Comprehensive test coverage (backend and frontend).