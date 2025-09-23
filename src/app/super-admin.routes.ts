import { Routes } from '@angular/router';
import { SuperAdminLayoutComponent } from './layout/super-admin-layout/super-admin-layout.component';
import { SuperAdminApprovalsComponent } from './features/super-admin/approvals/super-admin-approvals.component';
import { authGuard } from './guards/auth.guard';

export const superAdminRoutes: Routes = [
  {
    path: 'super-admin',
    component: SuperAdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: SuperAdminApprovalsComponent }, // Placeholder
      { path: 'merchants', component: SuperAdminApprovalsComponent }, // Placeholder
      { path: 'stores', component: SuperAdminApprovalsComponent }, // Placeholder
      { path: 'approvals', component: SuperAdminApprovalsComponent },
      { path: 'analytics', component: SuperAdminApprovalsComponent }, // Placeholder
      { path: 'settings', component: SuperAdminApprovalsComponent }, // Placeholder
    ],
  },
];
