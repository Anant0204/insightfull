import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/Login';
import { ProtectedRoute, PublicRoute, RoleRoute } from './components/ProtectedRoute';
import { RealTimeProvider } from './hooks/RealTimeContext';
import { WorkSessionRequired } from './components/employee/WorkSessionRequired';
import { lazy, Suspense, useEffect } from 'react';

// Page-level code splitting: each route loads its own chunk on demand
const lazyNamed = (loader, name) => lazy(() => loader().then(m => ({ default: m[name] })));

const Dashboard = lazyNamed(() => import('./pages/Dashboard'), 'Dashboard');
const TimeAndAttendance = lazyNamed(() => import('./pages/TimeAndAttendance'), 'TimeAndAttendance');
const ActivityMonitoring = lazyNamed(() => import('./pages/ActivityMonitoring'), 'ActivityMonitoring');
const ActivitiesTimeline = lazyNamed(() => import('./pages/ActivitiesTimeline'), 'ActivitiesTimeline');
const ScreenshotMonitoring = lazyNamed(() => import('./pages/ScreenshotMonitoring'), 'ScreenshotMonitoring');
const EmployeeManagement = lazyNamed(() => import('./pages/EmployeeManagement'), 'EmployeeManagement');
const EmployeeProfile = lazyNamed(() => import('./pages/EmployeeProfile'), 'EmployeeProfile');
const Settings = lazyNamed(() => import('./pages/Settings'), 'Settings');
const LocationTracking = lazyNamed(() => import('./pages/LocationTracking'), 'LocationTracking');
const TasksProjects = lazyNamed(() => import('./pages/TasksProjects'), 'TasksProjects');
const Reports = lazyNamed(() => import('./pages/Reports'), 'Reports');
const WorkType = lazyNamed(() => import('./pages/reports/WorkType'), 'WorkType');
const ScheduleAdherence = lazyNamed(() => import('./pages/reports/ScheduleAdherence'), 'ScheduleAdherence');
const WorkloadDistribution = lazyNamed(() => import('./pages/reports/WorkloadDistribution'), 'WorkloadDistribution');
const AppsWebsites = lazyNamed(() => import('./pages/reports/AppsWebsites'), 'AppsWebsites');
const LocationInsights = lazyNamed(() => import('./pages/reports/LocationInsights'), 'LocationInsights');
const Payroll = lazyNamed(() => import('./pages/Payroll'), 'Payroll');
const Alerts = lazyNamed(() => import('./pages/Alerts'), 'Alerts');
const Compliance = lazyNamed(() => import('./pages/Compliance'), 'Compliance');
const Notifications = lazyNamed(() => import('./pages/Notifications'), 'Notifications');
const RealTimeInsights = lazyNamed(() => import('./pages/RealTimeInsights'), 'RealTimeInsights');
const Teams = lazyNamed(() => import('./pages/Teams'), 'Teams');
const Projects = lazyNamed(() => import('./pages/Projects'), 'Projects');
const AgentManagement = lazyNamed(() => import('./pages/AgentManagement'), 'AgentManagement');
const SetupPassword = lazyNamed(() => import('./pages/SetupPassword'), 'SetupPassword');
const SetupAgent = lazyNamed(() => import('./pages/SetupAgent'), 'SetupAgent');
const WorkloadDistributionSettings = lazyNamed(() => import('./pages/settings/reports/WorkloadDistributionSettings'), 'WorkloadDistributionSettings');
const LocationInsightsSettings = lazyNamed(() => import('./pages/settings/reports/LocationInsightsSettings'), 'LocationInsightsSettings');
const AlertsLayout = lazyNamed(() => import('./pages/settings/alerts/AlertsLayout'), 'AlertsLayout');
const AttendanceAlerts = lazyNamed(() => import('./pages/settings/alerts/AttendanceAlerts'), 'AttendanceAlerts');
const SecurityAlerts = lazyNamed(() => import('./pages/settings/alerts/SecurityAlerts'), 'SecurityAlerts');
const ShiftScheduling = lazyNamed(() => import('./pages/settings/alerts/ShiftScheduling'), 'ShiftScheduling');
const OtherAlerts = lazyNamed(() => import('./pages/settings/alerts/OtherAlerts'), 'OtherAlerts');
const AuditLogs = lazyNamed(() => import('./pages/settings/AuditLogs'), 'AuditLogs');
const EmailReports = lazyNamed(() => import('./pages/settings/EmailReports'), 'EmailReports');
const BillingLayout = lazyNamed(() => import('./pages/settings/billing/BillingLayout'), 'BillingLayout');
const ManualTime = lazyNamed(() => import('./pages/settings/ManualTime'), 'ManualTime');
const Organization = lazyNamed(() => import('./pages/settings/Organization'), 'Organization');
const PersonalSettings = lazyNamed(() => import('./pages/settings/PersonalSettings'), 'PersonalSettings');
const Privacy = lazyNamed(() => import('./pages/settings/Privacy'), 'Privacy');
const PrivacyOverview = lazyNamed(() => import('./components/privacy/PrivacyOverview'), 'PrivacyOverview');
const PrivacyCompliance = lazyNamed(() => import('./components/privacy/PrivacyCompliance'), 'PrivacyCompliance');
const ProductivityApps = lazyNamed(() => import('./pages/settings/ProductivityApps'), 'ProductivityApps');
const SecurityLanding = lazyNamed(() => import('./pages/settings/SecurityLanding'), 'SecurityLanding');
const SamlWizard = lazyNamed(() => import('./pages/settings/SamlWizard'), 'SamlWizard');
const TrackingSettings = lazyNamed(() => import('./pages/settings/TrackingSettings'), 'TrackingSettings');
const AdvancedTrackingSettings = lazyNamed(() => import('./pages/settings/AdvancedTrackingSettings'), 'AdvancedTrackingSettings');
const ManageOrgGroups = lazyNamed(() => import('./pages/settings/ManageOrgGroups'), 'ManageOrgGroups');
const Utilization = lazyNamed(() => import('./pages/settings/Utilization'), 'Utilization');
const Plans = lazyNamed(() => import('./pages/settings/billing/Plans'), 'Plans');
const AddOns = lazyNamed(() => import('./pages/settings/billing/AddOns'), 'AddOns');
const ManageUsers = lazyNamed(() => import('./pages/settings/ManageUsers'), 'ManageUsers');
const ProcessMining = lazy(() => import('./pages/reports/ProcessMining'));
const ComplianceReadiness = lazy(() => import('./pages/compliance/ComplianceReadiness'));

const PageLoader = (
    <div className="flex items-center justify-center min-h-[40vh] text-slate-400 text-sm font-medium">
        Loading…
    </div>
);

import { useAuthStore } from './store/authStore';

import authService from './services/authService';
import { ToastProvider } from './context/ToastContext';

function App() {
    const { isAuthenticated, role, setSession } = useAuthStore();

    useEffect(() => {
        // Cleanup malformed URLs
        if (window.location.pathname.includes('/undefined')) {
            console.warn('URL contains "undefined", cleaning up...');
            window.location.href = '/';
            return;
        }

        const initAuth = async () => {
            const savedToken = localStorage.getItem('token');

            // If we have no token, make sure we are logged out in store
            if (!savedToken) {
                if (isAuthenticated) useAuthStore.getState().logout();
                return;
            }

            // Sync active user session & live attendance from server
            if (savedToken) {
                try {
                    const response = await authService.getCurrentUser();
                    if (response.success && response.data) {
                        setSession(response.data);
                    }
                } catch (error) {
                    console.error('Auth refresh check:', error.message);
                    if (error.response?.status === 401) {
                        localStorage.removeItem('token');
                        useAuthStore.getState().logout();
                    }
                }
            }
        };

        initAuth();
    }, [isAuthenticated, role, setSession]);

    return (
        <ToastProvider>
            <RealTimeProvider>
                <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
                    <Suspense fallback={PageLoader}>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/setup-password" element={<SetupPassword />} />
                        <Route path="/setup-agent" element={<SetupAgent />} />

                        {/* Special Monitoring Route */}
                        <Route path="/employee/work-session" element={
                            <RoleRoute allowedRoles={['EMPLOYEE']}>
                                <WorkSessionRequired />
                            </RoleRoute>
                        } />

                        {/* Protected Dashboard Routes */}
                        <Route path="/" element={<Navigate to="/login" replace />} />
                        <Route path="/:rolePath/*" element={
                            <ProtectedRoute>
                                <DashboardLayout>
                                    <Routes>
                                        <Route path="/" element={<Dashboard />} />
                                        <Route path="real-time" element={<RealTimeInsights />} />
                                        <Route path="time-attendance" element={<TimeAndAttendance />} />
                                        <Route path="activities" element={<ActivitiesTimeline />} />
                                        <Route path="monitoring" element={<ActivityMonitoring />} />
                                        <Route path="screenshots" element={
                                            <RoleRoute allowedRoles={['ADMIN', 'MANAGER']}>
                                                <ScreenshotMonitoring />
                                            </RoleRoute>
                                        } />
                                        <Route path="location" element={<LocationTracking />} />
                                        <Route path="tasks" element={<TasksProjects />} />

                                        <Route path="reports" element={<Reports />}>
                                            <Route index element={<Navigate to="work-type" replace />} />
                                            <Route path="work-type" element={<WorkType />} />
                                            <Route path="schedule-adherence" element={<ScheduleAdherence />} />
                                            <Route path="workload-distribution" element={<WorkloadDistribution />} />
                                            <Route path="apps-websites" element={<AppsWebsites />} />
                                            <Route path="location-insights" element={<LocationInsights />} />
                                            <Route path="process-mining" element={<ProcessMining />} />
                                        </Route>
                                        <Route path="payroll" element={
                                            <RoleRoute allowedRoles={['ADMIN']}>
                                                <Payroll />
                                            </RoleRoute>
                                        } />
                                        <Route path="alerts" element={
                                            <RoleRoute allowedRoles={['ADMIN', 'MANAGER']}>
                                                <Alerts />
                                            </RoleRoute>
                                        } />
                                        <Route path="employees" element={<EmployeeManagement />} />
                                        <Route path="employees/:id" element={<EmployeeProfile />} />
                                        <Route path="teams" element={<Teams />} />
                                        <Route path="projects" element={<Projects />} />
                                        <Route path="agents" element={
                                            <RoleRoute allowedRoles={['ADMIN']}>
                                                <AgentManagement />
                                            </RoleRoute>
                                        } />
                                        <Route path="settings" element={
                                            <RoleRoute allowedRoles={['ADMIN']}>
                                                <Settings />
                                            </RoleRoute>
                                        } />
                                        <Route path="settings/reports/workload-distribution" element={<WorkloadDistributionSettings />} />
                                        <Route path="settings/reports/location-insights" element={<LocationInsightsSettings />} />

                                        <Route path="settings/alerts" element={<AlertsLayout />}>
                                            <Route index element={<Navigate to="attendance" replace />} />
                                            <Route path="attendance" element={<AttendanceAlerts />} />
                                            <Route path="security" element={<SecurityAlerts />} />
                                            <Route path="shift-scheduling" element={<ShiftScheduling />} />
                                            <Route path="other" element={<OtherAlerts />} />
                                        </Route>
                                        <Route path="settings/productivity/apps" element={<ProductivityApps />} />

                                        <Route path="settings/audit-logs" element={<AuditLogs />} />
                                        <Route path="settings/email-reports" element={<EmailReports />} />
                                        <Route path="settings/manual-time" element={<ManualTime />} />
                                        <Route path="settings/organization" element={<Organization />} />
                                        <Route path="settings/personal" element={<PersonalSettings />} />
                                        <Route path="settings/security" element={<SecurityLanding />} />
                                        <Route path="settings/security/saml" element={<SamlWizard />} />
                                        <Route path="settings/tracking" element={<TrackingSettings />} />
                                        <Route path="settings/tracking/advanced" element={<><TrackingSettings /><AdvancedTrackingSettings /></>} />
                                        <Route path="settings/user-management/users" element={<ManageUsers />} />
                                        <Route path="settings/user-management/org-groups" element={<ManageOrgGroups />} />
                                        <Route path="settings/utilization" element={<Utilization />} />
                                        <Route path="settings/privacy" element={<Privacy />}>
                                            <Route index element={<Navigate to="overview" replace />} />
                                            <Route path="overview" element={<PrivacyOverview />} />
                                            <Route path="compliance" element={<PrivacyCompliance />} />
                                        </Route>

                                        <Route path="settings/billing" element={<BillingLayout />}>
                                            <Route index element={<Navigate to="plans" replace />} />
                                            <Route path="plans" element={<Plans />} />
                                            <Route path="add-ons" element={<AddOns />} />
                                        </Route>

                                        <Route path="compliance" element={
                                            <RoleRoute allowedRoles={['ADMIN']}>
                                                <Compliance />
                                            </RoleRoute>
                                        } />
                                        <Route path="compliance/readiness" element={
                                            <RoleRoute allowedRoles={['ADMIN']}>
                                                <ComplianceReadiness />
                                            </RoleRoute>
                                        } />
                                        <Route path="notifications" element={<Notifications />} />
                                        <Route path="*" element={<Navigate to="/" replace />} />
                                    </Routes>
                                </DashboardLayout>
                            </ProtectedRoute>
                        } />
                    </Routes>
                    </Suspense>
                </Router>
            </RealTimeProvider>
        </ToastProvider>
    );
}

export default App;
