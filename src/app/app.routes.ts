import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { StoresComponent } from './features/stores/stores.component';
import { ProductsComponent } from './features/products/products.component';
import { CategoriesComponent } from './features/categories/categories.component';
import { OrdersComponent } from './features/orders/orders.component';
import { OrderDetailComponent } from './features/orders/order-detail/order-detail.component';
import { CustomersComponent } from './features/customers/customers.component';
import { UsersComponent } from './features/users/users.component';
import { SettingsComponent } from './features/settings/settings.component';
import { InventoryComponent } from './features/inventory/inventory.component';
import { authGuard } from './guards/auth.guard';
import { AccountComponent } from './features/account/account.component';
import { superAdminRoutes } from './super-admin.routes';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'stores', component: StoresComponent },
      { path: 'products', component: ProductsComponent },
      { path: 'categories', component: CategoriesComponent },
      { path: 'orders', component: OrdersComponent },
      { path: 'orders/:id', component: OrderDetailComponent },
      { path: 'customers', component: CustomersComponent },
      { path: 'inventory', component: InventoryComponent },
      { path: 'users', component: UsersComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'account', component: AccountComponent },
    ],
  },
  ...superAdminRoutes,
];
