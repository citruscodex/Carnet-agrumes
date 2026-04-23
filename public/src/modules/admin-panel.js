/**
 * admin-panel.js — Panel d'administration CitrusCodex
 * Module ES — Strangler Pattern (remplace le code admin inline de index.html)
 * Expose : window.__CCA_admin_panel = { initAdminPanel }
 */

import { esc } from '../lib/esc.js';

// ── i18n ──────────────────────────────────────────────────────────────────────
const I18N = {
  fr: {
    title: 'Administration',
    tabs: { users: 'Comptes', bugs: 'Bugs', audit: 'Historique', stats: 'Statistiques' },
    users: {
      title: 'Gestion des comptes', search: 'Rechercher par email…', invite: 'Inviter',
      role: 'Rôle', profile: 'Profil', status: 'Statut', lastLogin: 'Dernière connexion',
      active: 'Actif', inactive: 'Désactivé', activate: 'Réactiver', deactivate: 'Désactiver',
      deactivateReason: 'Raison de la désactivation', delete: 'Supprimer', deleteConfirm: 'Tapez DELETE pour confirmer.',
      resetPassword: 'Réinit. mdp', tempPassword: 'Mot de passe temporaire',
      changeRole: 'Rôle', changeProfile: 'Profil', history: 'Historique', save: 'Enregistrer',
      noResults: 'Aucun utilisateur', loading: '⏳ Chargement…', error: '⚠ Erreur',
      inviteTitle: 'Inviter un bêta-testeur', inviteEmail: 'email@example.com',
      invitePassword: 'Mot de passe (min 8 chars)', inviteCreate: 'Créer le compte',
      inviteGenPwd: '🎲 Générer'
    },
    bugs: {
      title: 'Bugs signalés', groups: 'Groupes', newGroup: '+ Groupe',
      filter: 'Filtrer', assign: 'Assigner', priority: 'Priorité', status: 'Statut',
      groupCreate: 'Créer le groupe', groupTitle: 'Titre du groupe', groupMerge: 'Grouper sélection',
      ungroup: 'Dissocier', deleteConfirm: 'Supprimer ce bug ?',
      noResults: 'Aucun bug', loading: '⏳ Chargement…', allStatuses: 'Tous statuts',
      allPriorities: 'Toutes priorités'
    },
    audit: {
      title: 'Historique des actions', action: 'Action', target: 'Cible', date: 'Date',
      details: 'Détails', noResults: 'Aucune action', loading: '⏳ Chargement…',
      filterAll: 'Toutes actions', thisWeek: 'Cette semaine', thisMonth: 'Ce mois'
    },
    stats: {
      title: 'Statistiques bêta', totalUsers: 'Utilisateurs', active: 'Actifs',
      inactive: 'Inactifs', loginsWeek: 'Connexions 7j', bugsOpen: 'Bugs ouverts',
      bugsResolved: 'Bugs résolus', plantsCreated: 'Plantes', topUsers: 'Top 5 actifs',
      loading: '⏳ Chargement…'
    }
  },
  en: {
    title: 'Administration',
    tabs: { users: 'Accounts', bugs: 'Bugs', audit: 'History', stats: 'Statistics' },
    users: {
      title: 'Account management', search: 'Search by email…', invite: 'Invite',
      role: 'Role', profile: 'Profile', status: 'Status', lastLogin: 'Last login',
      active: 'Active', inactive: 'Deactivated', activate: 'Reactivate', deactivate: 'Deactivate',
      deactivateReason: 'Reason for deactivation', delete: 'Delete', deleteConfirm: 'Type DELETE to confirm.',
      resetPassword: 'Reset pwd', tempPassword: 'Temporary password',
      changeRole: 'Role', changeProfile: 'Profile', history: 'History', save: 'Save',
      noResults: 'No users', loading: '⏳ Loading…', error: '⚠ Error',
      inviteTitle: 'Invite a beta tester', inviteEmail: 'email@example.com',
      invitePassword: 'Password (min 8 chars)', inviteCreate: 'Create account',
      inviteGenPwd: '🎲 Generate'
    },
    bugs: {
      title: 'Bug reports', groups: 'Groups', newGroup: '+ Group',
      filter: 'Filter', assign: 'Assign', priority: 'Priority', status: 'Status',
      groupCreate: 'Create group', groupTitle: 'Group title', groupMerge: 'Group selection',
      ungroup: 'Unlink', deleteConfirm: 'Delete this bug?',
      noResults: 'No bugs', loading: '⏳ Loading…', allStatuses: 'All statuses',
      allPriorities: 'All priorities'
    },
    audit: {
      title: 'Action history', action: 'Action', target: 'Target', date: 'Date',
      details: 'Details', noResults: 'No actions', loading: '⏳ Loading…',
      filterAll: 'All actions', thisWeek: 'This week', thisMonth: 'This month'
    },
    stats: {
      title: 'Beta statistics', totalUsers: 'Users', active: 'Active',
      inactive: 'Inactive', loginsWeek: 'Logins 7d', bugsOpen: 'Open bugs',
      bugsResolved: 'Resolved bugs', plantsCreated: 'Plants', topUsers: 'Top 5 active',
      loading: '⏳ Loading…'
    }
  },
  it: {
    title: 'Amministrazione',
    tabs: { users: 'Account', bugs: 'Bug', audit: 'Cronologia', stats: 'Statistiche' },
    users: {
      title: 'Gestione account', search: 'Cerca per email…', invite: 'Invita',
      role: 'Ruolo', profile: 'Profilo', status: 'Stato', lastLogin: 'Ultimo accesso',
      active: 'Attivo', inactive: 'Disattivato', activate: 'Riattiva', deactivate: 'Disattiva',
      deactivateReason: 'Motivo della disattivazione', delete: 'Elimina', deleteConfirm: 'Digita DELETE per confermare.',
      resetPassword: 'Reimposta pwd', tempPassword: 'Password temporanea',
      changeRole: 'Ruolo', changeProfile: 'Profilo', history: 'Cronologia', save: 'Salva',
      noResults: 'Nessun utente', loading: '⏳ Caricamento…', error: '⚠ Errore',
      inviteTitle: 'Invita un beta tester', inviteEmail: 'email@example.com',
      invitePassword: 'Password (min 8 caratteri)', inviteCreate: 'Crea account',
      inviteGenPwd: '🎲 Genera'
    },
    bugs: {
      title: 'Bug segnalati', groups: 'Gruppi', newGroup: '+ Gruppo',
      filter: 'Filtra', assign: 'Assegna', priority: 'Priorità', status: 'Stato',
      groupCreate: 'Crea gruppo', groupTitle: 'Titolo gruppo', groupMerge: 'Raggruppa selezione',
      ungroup: 'Scollega', deleteConfirm: 'Eliminare questo bug?',
      noResults: 'Nessun bug', loading: '⏳ Caricamento…', allStatuses: 'Tutti gli stati',
      allPriorities: 'Tutte le priorità'
    },
    audit: {
      title: 'Cronologia azioni', action: 'Azione', target: 'Destinatario', date: 'Data',
      details: 'Dettagli', noResults: 'Nessuna azione', loading: '⏳ Caricamento…',
      filterAll: 'Tutte le azioni', thisWeek: 'Questa settimana', thisMonth: 'Questo mese'
    },
    stats: {
      title: 'Statistiche beta', totalUsers: 'Utenti', active: 'Attivi',
      inactive: 'Inattivi', loginsWeek: 'Accessi 7g', bugsOpen: 'Bug aperti',
      bugsResolved: 'Bug risolti', plantsCreated: 'Piante', topUsers: 'Top 5 attivi',
      loading: '⏳ Caricamento…'
    }
  },
  es: {
    title: 'Administración',
    tabs: { users: 'Cuentas', bugs: 'Errores', audit: 'Historial', stats: 'Estadísticas' },
    users: {
      title: 'Gestión de cuentas', search: 'Buscar por email…', invite: 'Invitar',
      role: 'Rol', profile: 'Perfil', status: 'Estado', lastLogin: 'Último acceso',
      active: 'Activo', inactive: 'Desactivado', activate: 'Reactivar', deactivate: 'Desactivar',
      deactivateReason: 'Razón de desactivación', delete: 'Eliminar', deleteConfirm: 'Escriba DELETE para confirmar.',
      resetPassword: 'Resetear contraseña', tempPassword: 'Contraseña temporal',
      changeRole: 'Rol', changeProfile: 'Perfil', history: 'Historial', save: 'Guardar',
      noResults: 'Sin usuarios', loading: '⏳ Cargando…', error: '⚠ Error',
      inviteTitle: 'Invitar a un beta tester', inviteEmail: 'email@ejemplo.com',
      invitePassword: 'Contraseña (mín. 8 caracteres)', inviteCreate: 'Crear cuenta',
      inviteGenPwd: '🎲 Generar'
    },
    bugs: {
      title: 'Errores reportados', groups: 'Grupos', newGroup: '+ Grupo',
      filter: 'Filtrar', assign: 'Asignar', priority: 'Prioridad', status: 'Estado',
      groupCreate: 'Crear grupo', groupTitle: 'Título del grupo', groupMerge: 'Agrupar selección',
      ungroup: 'Desgrupar', deleteConfirm: '¿Eliminar este error?',
      noResults: 'Sin errores', loading: '⏳ Cargando…', allStatuses: 'Todos los estados',
      allPriorities: 'Todas las prioridades'
    },
    audit: {
      title: 'Historial de acciones', action: 'Acción', target: 'Objetivo', date: 'Fecha',
      details: 'Detalles', noResults: 'Sin acciones', loading: '⏳ Cargando…',
      filterAll: 'Todas las acciones', thisWeek: 'Esta semana', thisMonth: 'Este mes'
    },
    stats: {
      title: 'Estadísticas beta', totalUsers: 'Usuarios', active: 'Activos',
      inactive: 'Inactivos', loginsWeek: 'Accesos 7d', bugsOpen: 'Errores abiertos',
      bugsResolved: 'Errores resueltos', plantsCreated: 'Plantas', topUsers: 'Top 5 activos',
      loading: '⏳ Cargando…'
    }
  },
  pt: {
    title: 'Administração',
    tabs: { users: 'Contas', bugs: 'Bugs', audit: 'Histórico', stats: 'Estatísticas' },
    users: {
      title: 'Gestão de contas', search: 'Pesquisar por email…', invite: 'Convidar',
      role: 'Papel', profile: 'Perfil', status: 'Estado', lastLogin: 'Último acesso',
      active: 'Ativo', inactive: 'Desativado', activate: 'Reativar', deactivate: 'Desativar',
      deactivateReason: 'Motivo da desativação', delete: 'Eliminar', deleteConfirm: 'Digite DELETE para confirmar.',
      resetPassword: 'Redefinir senha', tempPassword: 'Senha temporária',
      changeRole: 'Papel', changeProfile: 'Perfil', history: 'Histórico', save: 'Guardar',
      noResults: 'Sem utilizadores', loading: '⏳ Carregando…', error: '⚠ Erro',
      inviteTitle: 'Convidar beta tester', inviteEmail: 'email@exemplo.com',
      invitePassword: 'Senha (mín. 8 caracteres)', inviteCreate: 'Criar conta',
      inviteGenPwd: '🎲 Gerar'
    },
    bugs: {
      title: 'Bugs reportados', groups: 'Grupos', newGroup: '+ Grupo',
      filter: 'Filtrar', assign: 'Atribuir', priority: 'Prioridade', status: 'Estado',
      groupCreate: 'Criar grupo', groupTitle: 'Título do grupo', groupMerge: 'Agrupar seleção',
      ungroup: 'Desagrupar', deleteConfirm: 'Eliminar este bug?',
      noResults: 'Sem bugs', loading: '⏳ Carregando…', allStatuses: 'Todos os estados',
      allPriorities: 'Todas as prioridades'
    },
    audit: {
      title: 'Histórico de ações', action: 'Ação', target: 'Alvo', date: 'Data',
      details: 'Detalhes', noResults: 'Sem ações', loading: '⏳ Carregando…',
      filterAll: 'Todas as ações', thisWeek: 'Esta semana', thisMonth: 'Este mês'
    },
    stats: {
      title: 'Estatísticas beta', totalUsers: 'Utilizadores', active: 'Ativos',
      inactive: 'Inativos', loginsWeek: 'Acessos 7d', bugsOpen: 'Bugs abertos',
      bugsResolved: 'Bugs resolvidos', plantsCreated: 'Plantas', topUsers: 'Top 5 ativos',
      loading: '⏳ Carregando…'
    }
  }
};

function getLang() {
  const l = navigator.language.slice(0, 2);
  return I18N[l] ? l : 'fr';
}
function T(section, key) {
  const lang = getLang();
  return I18N[lang]?.[section]?.[key] ?? I18N['fr']?.[section]?.[key] ?? key;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
function authHeader() {
  const token = sessionStorage.getItem('cca_srv_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + (token || '')
  };
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { ...authHeader(), ...(options.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);
  return data;
}

// ── CSS injection ─────────────────────────────────────────────────────────────
const CSS = `
.cca-admin-wrap { font-family: system-ui,-apple-system,sans-serif; max-width: 900px; }
.cca-admin-tabs { display: flex; gap: 2px; margin-bottom: 14px; border-bottom: 2px solid var(--cream3, #e0d8ce); }
.cca-admin-tab { padding: 8px 16px; font-size: .82rem; font-weight: 600; cursor: pointer;
  border: none; background: none; color: var(--muted, #636e72); border-bottom: 2px solid transparent;
  margin-bottom: -2px; border-radius: 6px 6px 0 0; transition: color .15s; }
.cca-admin-tab:hover { color: var(--text-strong, #1c1c1e); background: var(--cream2, #f5f0e8); }
.cca-admin-tab.active { color: #c75b2a; border-bottom-color: #c75b2a; }
.cca-admin-panel { padding: 4px 0; }
.cca-admin-card { background: var(--white, #fff); border: 1px solid var(--cream3, #e0d8ce);
  border-radius: 10px; padding: 10px 12px; margin-bottom: 8px; }
.cca-admin-user-email { font-size: .84rem; font-weight: 600; }
.cca-admin-user-meta { font-size: .74rem; color: var(--muted, #636e72); margin-top: 2px; }
.cca-admin-row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-top: 8px; }
.cca-admin-select { font-size: .75rem; padding: 4px 6px; border: 1px solid var(--cream3,#e0d8ce);
  border-radius: 6px; background: var(--cream2,#f5f0e8); }
.cca-admin-btn { font-size: .75rem; padding: 4px 10px; border-radius: 7px; border: 1px solid var(--cream3,#e0d8ce);
  cursor: pointer; background: var(--white,#fff); color: var(--text,#2d3436); transition: background .15s; }
.cca-admin-btn:hover { background: var(--cream2,#f5f0e8); }
.cca-admin-btn-primary { background: #162d1f; color: white; border-color: #162d1f; }
.cca-admin-btn-primary:hover { background: #1e3d29; }
.cca-admin-btn-danger { background: rgba(198,40,40,.08); color: #c62828; border-color: rgba(198,40,40,.2); }
.cca-admin-btn-danger:hover { background: rgba(198,40,40,.15); }
.cca-admin-btn-blue { background: rgba(21,101,192,.08); color: #1565c0; border-color: rgba(21,101,192,.2); }
.cca-admin-badge-disabled { font-size: .72rem; background: rgba(198,40,40,.1); color: #c62828;
  border-radius: 8px; padding: 2px 8px; }
.cca-admin-badge-active { font-size: .72rem; background: rgba(22,45,31,.1); color: #162d1f;
  border-radius: 8px; padding: 2px 8px; }
.cca-admin-stats-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(110px,1fr));
  gap: 8px; margin-bottom: 16px; }
.cca-admin-stat-card { background: var(--white,#fff); border: 1px solid var(--cream3,#e0d8ce);
  border-radius: 10px; padding: 10px 8px; text-align: center; }
.cca-admin-stat-val { font-size: 1.3rem; font-weight: 700; color: var(--text-strong,#1c1c1e); }
.cca-admin-stat-lbl { font-size: .68rem; color: var(--muted,#636e72); margin-top: 2px; }
.cca-admin-input { width: 100%; box-sizing: border-box; padding: 6px 10px; font-size: .82rem;
  border: 1px solid var(--cream3,#e0d8ce); border-radius: 7px; background: var(--white,#fff); }
.cca-admin-section-title { font-size: .88rem; font-weight: 700; color: #162d1f;
  margin: 14px 0 8px; padding-bottom: 6px; border-bottom: 1px solid var(--cream3,#e0d8ce); }
.cca-admin-audit-row { padding: 8px 0; border-bottom: 1px solid var(--cream3,#e0d8ce);
  font-size: .8rem; cursor: pointer; }
.cca-admin-audit-row:hover { background: var(--cream2,#f5f0e8); }
.cca-admin-audit-action { font-weight: 600; color: #162d1f; }
.cca-admin-audit-details { font-size: .72rem; color: var(--muted,#636e72); margin-top: 4px;
  background: var(--cream2,#f5f0e8); border-radius: 6px; padding: 6px 10px;
  font-family: monospace; white-space: pre-wrap; display: none; }
.cca-admin-audit-details.open { display: block; }
.cca-admin-bug-row { display: flex; align-items: center; gap: 8px; padding: 8px 0;
  border-bottom: 1px solid var(--cream3,#e0d8ce); font-size: .8rem; }
.cca-admin-priority-low { color: #636e72; }
.cca-admin-priority-normal { color: #e67e22; }
.cca-admin-priority-high { color: #c0392b; }
.cca-admin-priority-critical { color: #7b0000; font-weight: 700; }
.cca-admin-search { margin-bottom: 10px; }
.cca-admin-filters { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
.cca-admin-temp-password { font-family: monospace; font-size: 1.1rem; font-weight: 700;
  letter-spacing: 2px; background: #2d3436; color: #fd9644; padding: 8px 14px;
  border-radius: 8px; display: inline-block; margin: 8px 0; }
`;

let _cssInjected = false;
function injectCSS() {
  if (_cssInjected) return;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  _cssInjected = true;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const PROFILE_LABELS = {
  collectionneur: 'Collectionneur', pepinieriste: 'Pépiniériste',
  arboriculteur: 'Arboriculteur', conservatoire: 'Conservatoire'
};
const PROFILE_ICONS = {
  collectionneur: '🍋', pepinieriste: '🌱', arboriculteur: '🌳', conservatoire: '🏛'
};
const ROLE_COLORS = { member: 'var(--muted)', editor: '#1565c0', moderator: '#6a1b9a', admin: '#c62828' };

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

function toast(msg, isErr = false) {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:72px;left:50%;transform:translateX(-50%);
    background:${isErr ? '#c62828' : '#162d1f'};color:white;padding:8px 18px;
    border-radius:20px;font-size:.82rem;z-index:9999;pointer-events:none;
    animation:fadeInOut 2.5s ease forwards`;
  t.textContent = msg;
  if (!document.getElementById('cca-toast-style')) {
    const s = document.createElement('style');
    s.id = 'cca-toast-style';
    s.textContent = '@keyframes fadeInOut{0%{opacity:0;transform:translateX(-50%) translateY(8px)}10%{opacity:1;transform:translateX(-50%) translateY(0)}80%{opacity:1}100%{opacity:0}}';
    document.head.appendChild(s);
  }
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

// ── Onglet 1 — Gestion des comptes ───────────────────────────────────────────
async function renderUsersTab(container) {
  container.innerHTML = `<div style="padding:20px;text-align:center;color:var(--muted)">${T('users','loading')}</div>`;

  try {
    const [users, stats] = await Promise.all([
      apiFetch('/api/admin/users?status=active'),
      apiFetch('/api/admin/stats').catch(() => null)
    ]);

    container.innerHTML = `
      ${stats ? renderStatsBar(stats) : ''}
      <div class="cca-admin-search">
        <input class="cca-admin-input" id="cca-adm-search" type="search" placeholder="${esc(T('users','search'))}">
      </div>
      <div class="cca-admin-filters">
        <select class="cca-admin-select" id="cca-adm-fp">
          <option value="">Tous profils</option>
          ${Object.entries(PROFILE_LABELS).map(([v,l]) => `<option value="${v}">${esc(l)}</option>`).join('')}
        </select>
        <select class="cca-admin-select" id="cca-adm-fr">
          <option value="">Tous rôles</option>
          ${['member','editor','moderator','admin'].map(r => `<option value="${r}">${esc(r)}</option>`).join('')}
        </select>
        <select class="cca-admin-select" id="cca-adm-fs">
          <option value="active">Actifs</option>
          <option value="disabled">Désactivés</option>
          <option value="">Tous</option>
        </select>
        <button class="cca-admin-btn cca-admin-btn-primary" id="cca-adm-filter-btn">${T('bugs','filter')}</button>
      </div>
      <div id="cca-adm-user-list">${renderUserCards(users)}</div>
      ${renderInviteSection()}
    `;

    bindUsersTab(container);
  } catch (e) {
    container.innerHTML = `<div style="color:#c62828;padding:16px">⚠ ${esc(e.message)}</div>`;
  }
}

function renderStatsBar(stats) {
  const items = [
    ['👥', stats.total ?? '—', 'Total'],
    ['✅', stats.active_7d ?? '—', 'Actifs 7j'],
    ['🆕', stats.new_30d ?? '—', 'Nvx 30j'],
    ['🔒', stats.disabled ?? '—', 'Désactivés']
  ];
  return `<div class="cca-admin-stats-grid" style="margin-bottom:12px">
    ${items.map(([i, v, l]) => `
      <div class="cca-admin-stat-card">
        <div style="font-size:1rem">${i}</div>
        <div class="cca-admin-stat-val">${esc(String(v))}</div>
        <div class="cca-admin-stat-lbl">${esc(l)}</div>
      </div>`).join('')}
  </div>`;
}

function renderUserCards(users) {
  if (!users.length) return `<div style="padding:20px;text-align:center;color:var(--muted);font-style:italic">${T('users','noResults')}</div>`;
  return users.map(u => {
    const ic = PROFILE_ICONS[u.profile_type] || '🍋';
    const lbl = PROFILE_LABELS[u.profile_type] || u.profile_type;
    const rc = ROLE_COLORS[u.role] || 'var(--muted)';
    const isActive = u.is_active !== false && !u.disabled_at;
    return `
    <div class="cca-admin-card" data-user-email="${esc(u.email)}" data-user-id="${esc(u.id)}">
      <div style="display:flex;align-items:flex-start;gap:8px">
        <div style="flex:1;min-width:0">
          <div class="cca-admin-user-email">${esc(u.email)}</div>
          <div class="cca-admin-user-meta">
            ${ic} ${esc(lbl)} &nbsp;·&nbsp;
            <span style="color:${rc};font-weight:600">${esc(u.role)}</span> &nbsp;·&nbsp;
            Inscrit le ${fmtDate(u.created_at)}
          </div>
          <div class="cca-admin-user-meta">${T('users','lastLogin')} : ${fmtDate(u.last_login_at)} &nbsp;·&nbsp; ${u.plant_count ?? '—'} sujets</div>
        </div>
        <span class="${isActive ? 'cca-admin-badge-active cca-status-active' : 'cca-admin-badge-disabled'}">
          ${isActive ? T('users','active') : T('users','inactive')}
        </span>
      </div>
      <div class="cca-admin-row">
        <select class="cca-admin-select" data-adusr-profile="${esc(u.id)}">
          ${Object.entries(PROFILE_LABELS).map(([v,l]) => `<option value="${v}"${u.profile_type===v?' selected':''}>${ic} ${esc(l)}</option>`).join('')}
        </select>
        <select class="cca-admin-select" data-adusr-role="${esc(u.id)}">
          ${['member','editor','moderator','admin'].map(r => `<option value="${r}"${u.role===r?' selected':''}>${esc(r)}</option>`).join('')}
        </select>
        <button class="cca-admin-btn cca-admin-btn-primary" data-adusr-save="${esc(u.id)}">${T('users','save')}</button>
        <button class="cca-admin-btn cca-admin-btn-blue" data-adusr-resetpwd="${esc(u.id)}">🔑 ${T('users','resetPassword')}</button>
        ${isActive
          ? `<button class="cca-admin-btn cca-admin-btn-danger" data-adusr-deactivate="${esc(u.id)}">${T('users','deactivate')}</button>`
          : `<button class="cca-admin-btn" data-adusr-activate="${esc(u.id)}">${T('users','activate')}</button>`
        }
        <button class="cca-admin-btn" style="font-size:.7rem" data-adusr-history="${esc(u.id)}">📋 ${T('users','history')}</button>
      </div>
      <div id="cca-adm-history-${esc(u.id)}" style="display:none;margin-top:8px"></div>
    </div>`;
  }).join('');
}

function renderInviteSection() {
  return `
  <div class="cca-admin-section-title">✉ ${T('users','inviteTitle')}</div>
  <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
    <input id="cca-admin-inv-email" class="cca-admin-input" type="email" placeholder="${esc(T('users','inviteEmail'))}" autocomplete="off">
    <div style="display:flex;gap:6px">
      <input id="cca-admin-inv-pwd" class="cca-admin-input" type="text" placeholder="${esc(T('users','invitePassword'))}" style="flex:1" autocomplete="new-password">
      <button class="cca-admin-btn" id="cca-admin-gen-pwd-btn">${T('users','inviteGenPwd')}</button>
    </div>
    <select id="cca-admin-inv-profile" class="cca-admin-select">
      ${Object.entries(PROFILE_LABELS).map(([v,l]) => `<option value="${v}">${PROFILE_ICONS[v]} ${esc(l)}</option>`).join('')}
    </select>
    <button class="cca-admin-btn cca-admin-btn-primary" id="cca-admin-invite-btn">${T('users','inviteCreate')}</button>
    <div id="cca-admin-inv-result" style="font-size:.78rem;color:var(--g2)"></div>
  </div>`;
}

function bindUsersTab(container) {
  // Filtres
  container.querySelector('#cca-adm-filter-btn')?.addEventListener('click', async () => {
    const fp = container.querySelector('#cca-adm-fp')?.value || '';
    const fr = container.querySelector('#cca-adm-fr')?.value || '';
    const fs = container.querySelector('#cca-adm-fs')?.value || 'active';
    const qs = [fp && `profile_type=${fp}`, fr && `role=${fr}`, fs && `status=${fs}`].filter(Boolean).join('&');
    try {
      const users = await apiFetch('/api/admin/users' + (qs ? '?' + qs : ''));
      container.querySelector('#cca-adm-user-list').innerHTML = renderUserCards(users);
      bindUserCardActions(container);
    } catch (e) { toast(e.message, true); }
  });

  // Recherche locale
  container.querySelector('#cca-adm-search')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    container.querySelectorAll('.cca-admin-card[data-user-email]').forEach(card => {
      const email = card.dataset.userEmail || '';
      card.style.display = email.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  // Générer mot de passe
  container.querySelector('#cca-admin-gen-pwd-btn')?.addEventListener('click', () => {
    const c = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let s = '';
    for (let i = 0; i < 12; i++) s += c[Math.random() * c.length | 0];
    const el = container.querySelector('#cca-admin-inv-pwd');
    if (el) el.value = s;
  });

  // Inviter
  container.querySelector('#cca-admin-invite-btn')?.addEventListener('click', async () => {
    const email    = (container.querySelector('#cca-admin-inv-email')?.value || '').trim();
    const password = (container.querySelector('#cca-admin-inv-pwd')?.value   || '').trim();
    const profile  = container.querySelector('#cca-admin-inv-profile')?.value || 'collectionneur';
    if (!email || !password) { toast('Email et mot de passe requis', true); return; }
    if (password.length < 8) { toast('Mot de passe trop court (min 8)', true); return; }
    try {
      const d = await apiFetch('/api/admin/invite', { method: 'POST', body: JSON.stringify({ email, password, profile_type: profile }) });
      const res = container.querySelector('#cca-admin-inv-result');
      if (res) res.innerHTML = `<div style="color:var(--g2)">✅ ${esc(d.email)} — ${esc(PROFILE_LABELS[d.profile_type] || d.profile_type)}</div>`;
      container.querySelector('#cca-admin-inv-email').value = '';
      container.querySelector('#cca-admin-inv-pwd').value   = '';
      toast('Compte créé ✓');
    } catch (e) { toast(e.message, true); }
  });

  bindUserCardActions(container);
}

function bindUserCardActions(container) {
  // Sauvegarder profil + rôle
  container.querySelectorAll('[data-adusr-save]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id      = btn.dataset.adusrSave;
      const profile = container.querySelector(`[data-adusr-profile="${id}"]`)?.value;
      const role    = container.querySelector(`[data-adusr-role="${id}"]`)?.value;
      try {
        if (profile) await apiFetch('/api/admin/users/' + id + '/profile', { method: 'PUT', body: JSON.stringify({ profile_type: profile }) });
        if (role)    await apiFetch('/api/admin/users/' + id + '/role',    { method: 'PUT', body: JSON.stringify({ role }) });
        toast('Mis à jour ✓');
      } catch (e) { toast(e.message, true); }
    });
  });

  // Réinitialiser mot de passe
  container.querySelectorAll('[data-adusr-resetpwd]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Réinitialiser le mot de passe ?')) return;
      try {
        const d = await apiFetch('/api/admin/users/' + btn.dataset.adusrResetpwd + '/reset-password', { method: 'POST', body: '{}' });
        const pwdHtml = `<div class="cca-admin-temp-password">${esc(d.temp_password)}</div>`;
        const msg = `Mot de passe temporaire pour ${d.email} :\n\n${d.temp_password}\n\nConsultable dans Historique des actions.`;
        alert(msg);
        toast('Mot de passe réinitialisé — voir audit');
      } catch (e) { toast(e.message, true); }
    });
  });

  // Désactiver
  container.querySelectorAll('[data-adusr-deactivate]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const reason = prompt(T('users','deactivateReason') + ' (optionnel)') ?? '';
      if (reason === null) return;
      try {
        await apiFetch('/api/admin/users/' + btn.dataset.adusrDeactivate + '/deactivate', {
          method: 'PUT', body: JSON.stringify({ reason })
        });
        toast('Compte désactivé');
        btn.closest('.cca-admin-card').querySelector('.cca-admin-badge-active, .cca-admin-badge-disabled').className = 'cca-admin-badge-disabled';
        btn.closest('.cca-admin-card').querySelector('.cca-admin-badge-disabled').textContent = T('users','inactive');
        btn.remove();
      } catch (e) { toast(e.message, true); }
    });
  });

  // Réactiver
  container.querySelectorAll('[data-adusr-activate]').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await apiFetch('/api/admin/users/' + btn.dataset.adusrActivate + '/activate', { method: 'PUT' });
        toast('Compte réactivé');
      } catch (e) { toast(e.message, true); }
    });
  });

  // Historique d'un user
  container.querySelectorAll('[data-adusr-history]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id  = btn.dataset.adusrHistory;
      const box = container.querySelector(`#cca-adm-history-${id}`);
      if (!box) return;
      if (box.style.display !== 'none') { box.style.display = 'none'; return; }
      box.style.display = 'block';
      box.innerHTML = `<div style="font-size:.75rem;color:var(--muted)">⏳</div>`;
      try {
        const rows = await apiFetch('/api/admin/users/' + id + '/audit');
        if (!rows.length) { box.innerHTML = `<div style="font-size:.75rem;color:var(--muted)">Aucune action</div>`; return; }
        box.innerHTML = rows.map(r => `
          <div style="font-size:.74rem;padding:4px 0;border-bottom:1px solid var(--cream3,#e0d8ce)">
            <span style="color:var(--muted)">${fmtDate(r.created_at)}</span>
            <span style="margin:0 6px;font-weight:600;color:#162d1f">${esc(r.action)}</span>
            <span style="color:var(--muted)">${esc(JSON.stringify(r.details))}</span>
          </div>`).join('');
      } catch (e) { box.innerHTML = `<div style="color:#c62828;font-size:.75rem">⚠ ${esc(e.message)}</div>`; }
    });
  });
}

// ── Onglet 2 — Bugs ───────────────────────────────────────────────────────────
async function renderBugsTab(container) {
  container.innerHTML = `<div style="padding:20px;text-align:center;color:var(--muted)">${T('bugs','loading')}</div>`;
  try {
    const [bugs, groups] = await Promise.all([
      apiFetch('/api/admin/bugs/list'),
      apiFetch('/api/admin/bugs/groups')
    ]);

    const statusOpts = ['','open','acknowledged','in_progress','resolved','closed','wont_fix'];
    const prioOpts   = ['','low','normal','high','critical'];

    container.innerHTML = `
      <div class="cca-admin-filters">
        <select class="cca-admin-select" id="cca-adm-bug-status">
          ${statusOpts.map(s => `<option value="${s}">${s || T('bugs','allStatuses')}</option>`).join('')}
        </select>
        <select class="cca-admin-select" id="cca-adm-bug-prio">
          ${prioOpts.map(p => `<option value="${p}">${p || T('bugs','allPriorities')}</option>`).join('')}
        </select>
        <button class="cca-admin-btn cca-admin-btn-primary" id="cca-adm-bug-filter-btn">${T('bugs','filter')}</button>
        <button class="cca-admin-btn" id="cca-adm-show-groups-btn">📦 ${T('bugs','groups')} (${groups.length})</button>
        <button class="cca-admin-btn" id="cca-adm-merge-btn" style="display:none">${T('bugs','groupMerge')}</button>
      </div>
      <div id="cca-adm-groups-section" style="display:none">${renderGroupsSection(groups)}</div>
      <div id="cca-adm-bug-list">${renderBugRows(bugs)}</div>
    `;

    bindBugsTab(container, bugs);
  } catch (e) {
    container.innerHTML = `<div style="color:#c62828;padding:16px">⚠ ${esc(e.message)}</div>`;
  }
}

function renderBugRows(bugs) {
  if (!bugs.length) return `<div style="padding:20px;text-align:center;color:var(--muted);font-style:italic">${T('bugs','noResults')}</div>`;
  return bugs.map(b => {
    const pc = `cca-admin-priority-${b.priority || 'normal'}`;
    return `
    <div class="cca-admin-bug-row" data-bug-id="${esc(b.id)}">
      <input type="checkbox" class="cca-admin-bug-checkbox" data-bug-id="${esc(b.id)}">
      <div style="flex:1;min-width:0">
        <span style="font-size:.8rem;font-weight:600">${esc(b.title)}</span>
        <span style="font-size:.72rem;color:var(--muted);margin-left:6px">${esc(b.user_email || '—')}</span>
      </div>
      <span class="${pc}" style="font-size:.72rem">${esc(b.priority || 'normal')}</span>
      <select class="cca-admin-select cca-adm-bug-status-sel" data-bug-id="${esc(b.id)}" style="font-size:.72rem">
        ${['open','acknowledged','in_progress','resolved','closed','wont_fix'].map(s =>
          `<option value="${s}"${b.status===s?' selected':''}>${esc(s)}</option>`
        ).join('')}
      </select>
      <button class="cca-admin-btn cca-admin-btn-danger" data-adm-del-bug="${esc(b.id)}" style="font-size:.7rem;padding:2px 7px">✕</button>
    </div>`;
  }).join('');
}

function renderGroupsSection(groups) {
  if (!groups.length) return `<div style="padding:8px;font-size:.8rem;color:var(--muted)">Aucun groupe</div>`;
  const rows = groups.map(g => `
    <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--cream3,#e0d8ce);font-size:.8rem">
      <div style="flex:1"><strong>${esc(g.title)}</strong> <span style="color:var(--muted)">(${g.bug_count} bugs)</span></div>
      <span style="font-size:.72rem;color:var(--muted)">${esc(g.status)}</span>
    </div>`).join('');
  const form = `
    <div style="margin-top:10px;display:flex;gap:6px;align-items:center">
      <input class="cca-admin-input" id="cca-adm-group-title" placeholder="${esc(T('bugs','groupTitle'))}" style="flex:1">
      <button class="cca-admin-btn cca-admin-btn-primary" id="cca-adm-create-group-btn">${T('bugs','groupCreate')}</button>
    </div>`;
  return `<div style="margin-bottom:12px;background:var(--cream2,#f5f0e8);border-radius:8px;padding:10px">${rows}${form}</div>`;
}

function bindBugsTab(container, bugsData) {
  // Afficher/cacher groupes
  container.querySelector('#cca-adm-show-groups-btn')?.addEventListener('click', () => {
    const sec = container.querySelector('#cca-adm-groups-section');
    if (sec) sec.style.display = sec.style.display === 'none' ? '' : 'none';
  });

  // Filtre bugs
  container.querySelector('#cca-adm-bug-filter-btn')?.addEventListener('click', async () => {
    const status = container.querySelector('#cca-adm-bug-status')?.value || '';
    const prio   = container.querySelector('#cca-adm-bug-prio')?.value   || '';
    const qs = [status && `status=${status}`, prio && `priority=${prio}`].filter(Boolean).join('&');
    try {
      const bugs = await apiFetch('/api/admin/bugs/list' + (qs ? '?' + qs : ''));
      container.querySelector('#cca-adm-bug-list').innerHTML = renderBugRows(bugs);
      bindBugActions(container);
    } catch (e) { toast(e.message, true); }
  });

  // Créer groupe
  container.querySelector('#cca-adm-create-group-btn')?.addEventListener('click', async () => {
    const title = (container.querySelector('#cca-adm-group-title')?.value || '').trim();
    if (!title) { toast('Titre requis', true); return; }
    try {
      await apiFetch('/api/admin/bugs/groups', { method: 'POST', body: JSON.stringify({ title }) });
      toast('Groupe créé ✓');
      const groups = await apiFetch('/api/admin/bugs/groups');
      container.querySelector('#cca-adm-groups-section').innerHTML = renderGroupsSection(groups);
      bindBugsTab(container, bugsData);
    } catch (e) { toast(e.message, true); }
  });

  // Sélection multiple → grouper
  container.querySelectorAll('.cca-admin-bug-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      const checked = container.querySelectorAll('.cca-admin-bug-checkbox:checked').length;
      const btn = container.querySelector('#cca-adm-merge-btn');
      if (btn) btn.style.display = checked >= 2 ? '' : 'none';
    });
  });

  container.querySelector('#cca-adm-merge-btn')?.addEventListener('click', async () => {
    const selected = [...container.querySelectorAll('.cca-admin-bug-checkbox:checked')].map(c => c.dataset.bugId);
    const title = prompt(T('bugs','groupTitle') + ' :');
    if (!title) return;
    try {
      const group = await apiFetch('/api/admin/bugs/groups', { method: 'POST', body: JSON.stringify({ title }) });
      await Promise.all(selected.map(id =>
        apiFetch(`/api/admin/bugs/${id}/merge/${group.id}`, { method: 'POST' })
      ));
      toast(`Groupe "${esc(group.title)}" créé ✓`);
      renderBugsTab(container);
    } catch (e) { toast(e.message, true); }
  });

  bindBugActions(container);
}

function bindBugActions(container) {
  // Changer statut bug
  container.querySelectorAll('.cca-adm-bug-status-sel').forEach(sel => {
    sel.addEventListener('change', async () => {
      try {
        await apiFetch('/api/admin/bugs/' + sel.dataset.bugId, {
          method: 'PUT', body: JSON.stringify({ status: sel.value })
        });
        toast('Statut mis à jour ✓');
      } catch (e) { toast(e.message, true); }
    });
  });

  // Supprimer bug
  container.querySelectorAll('[data-adm-del-bug]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm(T('bugs','deleteConfirm'))) return;
      try {
        await apiFetch('/api/admin/bugs/' + btn.dataset.admDelBug, { method: 'DELETE' });
        btn.closest('.cca-admin-bug-row').remove();
        toast('Bug supprimé');
      } catch (e) { toast(e.message, true); }
    });
  });
}

// ── Onglet 3 — Audit log ──────────────────────────────────────────────────────
async function renderAuditTab(container) {
  container.innerHTML = `<div style="padding:20px;text-align:center;color:var(--muted)">${T('audit','loading')}</div>`;
  try {
    const rows = await apiFetch('/api/admin/audit-log?limit=100');
    const actionTypes = [...new Set(rows.map(r => r.action))];

    container.innerHTML = `
      <div class="cca-admin-filters">
        <select class="cca-admin-select" id="cca-adm-audit-action">
          <option value="">${T('audit','filterAll')}</option>
          ${actionTypes.map(a => `<option value="${a}">${esc(a)}</option>`).join('')}
        </select>
        <button class="cca-admin-btn cca-admin-btn-primary" id="cca-adm-audit-filter-btn">${T('bugs','filter')}</button>
      </div>
      <div id="cca-adm-audit-list">${renderAuditRows(rows)}</div>
    `;

    container.querySelector('#cca-adm-audit-filter-btn')?.addEventListener('click', async () => {
      const action = container.querySelector('#cca-adm-audit-action')?.value || '';
      const qs = action ? `?action=${encodeURIComponent(action)}` : '';
      try {
        const filtered = await apiFetch('/api/admin/audit-log' + qs + '&limit=100');
        container.querySelector('#cca-adm-audit-list').innerHTML = renderAuditRows(filtered);
        bindAuditRows(container);
      } catch (e) { toast(e.message, true); }
    });

    bindAuditRows(container);
  } catch (e) {
    container.innerHTML = `<div style="color:#c62828;padding:16px">⚠ ${esc(e.message)}</div>`;
  }
}

function renderAuditRows(rows) {
  if (!rows.length) return `<div style="padding:20px;text-align:center;color:var(--muted);font-style:italic">${T('audit','noResults')}</div>`;
  return rows.map(r => `
    <div class="cca-admin-audit-row" data-audit-id="${esc(r.id)}">
      <div style="display:flex;gap:8px;align-items:center">
        <span style="color:var(--muted);font-size:.72rem;white-space:nowrap">${fmtDate(r.created_at)}</span>
        <span class="cca-admin-audit-action">${esc(r.action)}</span>
        <span style="color:var(--muted);font-size:.75rem">${esc(r.admin_email || '—')} → ${esc(r.target_email || '—')}</span>
      </div>
      <div class="cca-admin-audit-details">${esc(JSON.stringify(r.details, null, 2))}</div>
    </div>`).join('');
}

function bindAuditRows(container) {
  container.querySelectorAll('.cca-admin-audit-row').forEach(row => {
    row.addEventListener('click', () => {
      const details = row.querySelector('.cca-admin-audit-details');
      if (details) details.classList.toggle('open');
    });
  });
}

// ── Onglet 4 — Statistiques ───────────────────────────────────────────────────
async function renderStatsTab(container) {
  container.innerHTML = `<div style="padding:20px;text-align:center;color:var(--muted)">${T('stats','loading')}</div>`;
  try {
    const data = await apiFetch('/api/admin/stats/extended');
    const u = data.users || {};
    const b = data.bugs  || {};

    const cards = [
      [T('stats','totalUsers'), u.total ?? '—', '👥'],
      [T('stats','active'),     u.active ?? '—', '✅'],
      [T('stats','inactive'),   u.inactive ?? '—', '🔒'],
      [T('stats','loginsWeek'), u.logins_week ?? '—', '🔐'],
      [T('stats','bugsOpen'),   b.open ?? '—', '🐛'],
      [T('stats','bugsResolved'), b.resolved ?? '—', '✅'],
      [T('stats','plantsCreated'), data.plants ?? '—', '🌿']
    ];

    const topUsers = Array.isArray(u.top_users) ? u.top_users : [];

    container.innerHTML = `
      <div class="cca-admin-stats-grid">
        ${cards.map(([l, v, i]) => `
          <div class="cca-admin-stat-card">
            <div style="font-size:1.1rem">${i}</div>
            <div class="cca-admin-stat-val">${esc(String(v))}</div>
            <div class="cca-admin-stat-lbl">${esc(l)}</div>
          </div>`).join('')}
      </div>
      <div class="cca-admin-section-title">🏆 ${T('stats','topUsers')}</div>
      ${topUsers.length
        ? topUsers.map((u, i) => `
          <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--cream3,#e0d8ce);font-size:.82rem">
            <span style="font-weight:700;color:#c75b2a;width:20px">#${i+1}</span>
            <span style="flex:1">${esc(u.email)}</span>
            <span style="color:var(--muted)">${u.login_count} connexions</span>
          </div>`).join('')
        : `<div style="padding:12px;text-align:center;color:var(--muted);font-style:italic">—</div>`
      }
    `;
  } catch (e) {
    container.innerHTML = `<div style="color:#c62828;padding:16px">⚠ ${esc(e.message)}</div>`;
  }
}

// ── Point d'entrée principal ──────────────────────────────────────────────────
export async function initAdminPanel(container) {
  if (!container) return;
  injectCSS();

  let activeTab = 'users';

  const tabs = [
    { key: 'users',  label: () => T('tabs','users')  },
    { key: 'bugs',   label: () => T('tabs','bugs')   },
    { key: 'audit',  label: () => T('tabs','audit')  },
    { key: 'stats',  label: () => T('tabs','stats')  }
  ];

  function render(tab) {
    activeTab = tab;
    container.innerHTML = `
      <div class="cca-admin-wrap">
        <div class="cca-admin-tabs">
          ${tabs.map(t => `<button class="cca-admin-tab${t.key===tab?' active':''}" data-admin-tab="${t.key}">${t.label()}</button>`).join('')}
        </div>
        <div class="cca-admin-panel" id="cca-admin-panel-body"></div>
      </div>`;

    container.querySelectorAll('[data-admin-tab]').forEach(btn => {
      btn.addEventListener('click', () => render(btn.dataset.adminTab));
    });

    const body = container.querySelector('#cca-admin-panel-body');
    if      (tab === 'users') renderUsersTab(body);
    else if (tab === 'bugs')  renderBugsTab(body);
    else if (tab === 'audit') renderAuditTab(body);
    else if (tab === 'stats') renderStatsTab(body);
  }

  render(activeTab);
}

// ── Interop avec le monolithe ─────────────────────────────────────────────────
window.__CCA_admin_panel = { initAdminPanel };
