/**
 * RBAC Permission System
 * Defines modules, actions, and role-permission mappings.
 */

export const MODULES = {
  DASHBOARD: 'dashboard',
  USERS: 'users',
  ROLES: 'roles',
  BILLING: 'billing',
  SETTINGS: 'settings',
  GABINETE: 'gabinete',
  COMMITTEES: 'committees',
  TEAMS: 'teams',
  ADVISORS: 'advisors',
  CANDIDATES: 'candidates',
  AGENDA: 'agenda',
  ACTIONS: 'actions',
  LEADERS: 'leaders',
  CRM: 'crm',
  DEMANDS: 'demands',
  TASKS: 'tasks',
  TERRITORIES: 'territories',
  REPORTS: 'reports',
  NOTIFICATIONS: 'notifications',
  AUDIT: 'audit',
} as const;

export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
  EXPORT: 'export',
} as const;

export type Module = typeof MODULES[keyof typeof MODULES];
export type Action = typeof ACTIONS[keyof typeof ACTIONS];

export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'super_admin',
  SUPPORT_ADMIN: 'support_admin',
} as const;

export const TENANT_ROLES = {
  TENANT_ADMIN: 'tenant_admin',
  COORDENADOR_GERAL: 'coordenador_geral',
  CHEFE_GABINETE: 'chefe_gabinete',
  COORDENADOR_COMITE: 'coordenador_comite',
  OPERADOR_AGENDA: 'operador_agenda',
  ASSESSOR: 'assessor',
  LEITURA: 'leitura',
} as const;

/**
 * Role permission matrix.
 * Each role maps to a list of "module:action" permission strings.
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [TENANT_ROLES.TENANT_ADMIN]: ['*:*'], // Full access

  [TENANT_ROLES.COORDENADOR_GERAL]: [
    'dashboard:read',
    'agenda:*', 'actions:*', 'committees:*', 'teams:*',
    'leaders:*', 'demands:*', 'tasks:*', 'reports:*',
    'crm:*', 'advisors:read', 'candidates:read',
    'territories:read', 'notifications:read',
  ],

  [TENANT_ROLES.CHEFE_GABINETE]: [
    'dashboard:read',
    'agenda:*', 'advisors:*', 'gabinete:*',
    'demands:*', 'tasks:*', 'reports:read',
    'teams:read', 'notifications:read',
  ],

  [TENANT_ROLES.COORDENADOR_COMITE]: [
    'dashboard:read',
    'committees:*', 'actions:*', 'teams:*',
    'leaders:*', 'tasks:*',
    'demands:read', 'notifications:read',
  ],

  [TENANT_ROLES.OPERADOR_AGENDA]: [
    'dashboard:read',
    'agenda:create', 'agenda:read', 'agenda:update',
    'notifications:read',
  ],

  [TENANT_ROLES.ASSESSOR]: [
    'dashboard:read',
    'agenda:read',
    'tasks:read', 'tasks:update',
    'demands:create', 'demands:read',
    'leaders:read', 'leaders:update',
    'crm:read', 'crm:create',
    'notifications:read',
  ],

  [TENANT_ROLES.LEITURA]: [
    'dashboard:read',
    'agenda:read', 'actions:read', 'committees:read',
    'teams:read', 'advisors:read', 'leaders:read',
    'demands:read', 'tasks:read', 'reports:read',
    'crm:read', 'notifications:read',
  ],
};

/**
 * Checks if a user's roles grant access to a module:action.
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string,
  isSuperAdmin = false,
): boolean {
  if (isSuperAdmin) return true;

  // Superadmin wildcard
  if (userPermissions.includes('*:*')) return true;

  // Verificar permissão exata
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Verificar wildcards
  const [requiredModule] = requiredPermission.split(':');

  // module:* permite qualquer ação no módulo
  if (userPermissions.includes(`${requiredModule}:*`)) {
    return true;
  }

  return false;
}

/**
 * Checks if user has any of the required permissions (OR logic)
 */
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[],
  isSuperAdmin = false,
): boolean {
  if (isSuperAdmin) return true;
  return requiredPermissions.some(perm => hasPermission(userPermissions, perm));
}

/**
 * Checks if user has all required permissions (AND logic)
 */
export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[],
  isSuperAdmin = false,
): boolean {
  if (isSuperAdmin) return true;
  return requiredPermissions.every(perm => hasPermission(userPermissions, perm));
}

/**
 * Returns all permissions for given roles.
 */
export function getPermissionsForRoles(roles: string[]): string[] {
  const permissions = new Set<string>();
  for (const role of roles) {
    const perms = ROLE_PERMISSIONS[role];
    if (perms) perms.forEach(p => permissions.add(p));
  }
  return Array.from(permissions);
}

/**
 * Checks if user has specific role
 */
export function hasRole(userRoles: string[], requiredRole: string): boolean {
  return userRoles.includes(requiredRole);
}

/**
 * Checks if user has any of the required roles
 */
export function hasAnyRole(userRoles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.some(role => userRoles.includes(role));
}

/**
 * Roles available for seed display.
 */
export const DEFAULT_ROLES = [
  { slug: 'tenant_admin', name: 'Administrador', description: 'Controle total do tenant', isSystem: false },
  { slug: 'coordenador_geral', name: 'Coordenador Geral', description: 'Gestão operacional ampla', isSystem: false },
  { slug: 'chefe_gabinete', name: 'Chefe de Gabinete', description: 'Operação institucional e equipe', isSystem: false },
  { slug: 'coordenador_comite', name: 'Coordenador de Comitê', description: 'Comitês e mobilização regional', isSystem: false },
  { slug: 'operador_agenda', name: 'Operador de Agenda', description: 'Compromissos e calendário', isSystem: false },
  { slug: 'assessor', name: 'Assessor', description: 'Atuação operacional limitada', isSystem: false },
  { slug: 'leitura', name: 'Somente Leitura', description: 'Acesso somente leitura', isSystem: false },
];
