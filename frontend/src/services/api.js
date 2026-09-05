import { agencyApi } from './agencyApi';
import { adminApi } from './adminApi';
import { authApi } from './authApi';

export { AGENCY_BASE, ADMIN_BASE, AUTH_BASE, getAuthToken, getAgencyId, getUserId, request } from './httpClient';
export { agencyApi } from './agencyApi';
export { adminApi } from './adminApi';
export { authApi } from './authApi';

export const api = {
  agency: agencyApi,
  traveller: undefined,
  admin: adminApi,
  auth: authApi,
};
