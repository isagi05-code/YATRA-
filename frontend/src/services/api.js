import { agencyApi } from './agencyApi';
import { travellerApi } from './travellerApi';
import { adminApi } from './adminApi';
import { authApi } from './authApi';

export { AGENCY_BASE, TRAVELLER_BASE, ADMIN_BASE, AUTH_BASE, getAuthToken, getAgencyId, getUserId, request } from './httpClient';
export { agencyApi } from './agencyApi';
export { travellerApi } from './travellerApi';
export { adminApi } from './adminApi';
export { authApi } from './authApi';

export const api = {
  agency: agencyApi,
  traveller: travellerApi,
  admin: adminApi,
  auth: authApi,
};
