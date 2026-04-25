export async function logoutUser(confirmMsg) {
  if (!confirm(confirmMsg || 'Se déconnecter ?')) return;
  try {
    await window.__CCA_ServerSync?.syncNow?.();
  } catch (_) {}
  sessionStorage.removeItem('cca_srv_token');
  sessionStorage.removeItem('cca_srv_refresh');
  sessionStorage.removeItem('cca_srv_profile');
  sessionStorage.removeItem('cca_srv_email');
  sessionStorage.removeItem('cca_srv_role');
  sessionStorage.removeItem('cca_srv_profile_type');
  window.clearUserData?.();
  window.location.reload();
}

window.__CCA_AuthLogout = { logoutUser };
