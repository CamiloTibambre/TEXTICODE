<template>
  <div class="layout">
    <AppSidebar rol="admin" />
    <main class="content">

      <div class="bg-orbs" aria-hidden="true">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="bg-grid"></div>
      </div>

      <!-- HERO HEADER -->
      <div class="page-hero" :class="{ 'hero-visible': animVisible }">
        <div class="hero-left">
          <div class="hero-icon-wrap">
            <svg class="hero-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/>
            </svg>
            <div class="hero-icon-ring ring-1"></div>
            <div class="hero-icon-ring ring-2"></div>
          </div>
          <div class="hero-text">
            <h1 class="hero-title">
              <span v-for="(ch, i) in 'Gestión de Clientes'" :key="i"
                class="title-char"
                :style="{ animationDelay: animVisible ? `${i * 35}ms` : '9999s' }">{{ ch === ' ' ? '\u00A0' : ch }}</span>
            </h1>
            <p class="hero-sub">Directorio y comprobantes de entrega</p>
          </div>
        </div>
        <div class="hero-search-wrap">
          <div class="search-box" :class="{ 'search-focus': searchFocus }">
            <svg class="search-ico" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
            </svg>
            <input v-model="busqueda" type="text" placeholder="Buscar clientes..."
              @focus="searchFocus = true" @blur="searchFocus = false">
          </div>
        </div>
      </div>

      <!-- LISTA CLIENTES -->
      <section class="table-box" :class="{ 'box-visible': animVisible }" style="transition-delay: 200ms">
        <div class="table-header-bar">
          <div class="table-header-left">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/>
            </svg>
            Lista de Clientes
            <span class="count-badge">{{ clientesFiltradosOrdenados.length }}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="sortable" @click="sortClientes('nombre')">
                <span class="th-inner">
                  Nombre
                  <span class="sort-arrows" :class="{ 'sort-active': sortKeyClientes === 'nombre' }">
                    <svg v-if="sortKeyClientes !== 'nombre'" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="sort-neutral"><path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4"/></svg>
                    <svg v-else-if="sortDirClientes === 1" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="sort-up"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5"/></svg>
                    <svg v-else width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="sort-down"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
                  </span>
                </span>
              </th>
              <th class="sortable" @click="sortClientes('email')">
                <span class="th-inner">
                  Correo
                  <span class="sort-arrows" :class="{ 'sort-active': sortKeyClientes === 'email' }">
                    <svg v-if="sortKeyClientes !== 'email'" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="sort-neutral"><path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4"/></svg>
                    <svg v-else-if="sortDirClientes === 1" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="sort-up"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5"/></svg>
                    <svg v-else width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="sort-down"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
                  </span>
                </span>
              </th>
              <th>Teléfono</th>
              <th>Comprobantes</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(c, idx) in clientesFiltradosOrdenados" :key="c.id">
              <tr class="table-row client-row" :style="{ animationDelay: `${idx * 45}ms` }" @click="toggleCliente(c.id)">
                <td class="user-cell">
                  <div class="avatar-wrap">
                    <div class="avatar" :style="{ background: avatarBg(c.iniciales), color: avatarFg(c.iniciales) }">{{ c.iniciales }}</div>
                    <div class="avatar-online"></div>
                  </div>
                  <div class="user-info">
                    <span class="user-name">{{ c.nombre }}</span>
                  </div>
                </td>
                <td class="email-td">{{ c.email }}</td>
                <td>
                  <div class="phone-cell">
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"/>
                    </svg>
                    {{ c.telefono }}
                  </div>
                </td>
                <td>
                  <div class="comp-toggle">
                    <span class="comp-count-badge">
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m9 14.25 6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z"/>
                      </svg>
                      {{ comprobantesDeCliente(c.id).length }}
                    </span>
                    <svg class="chevron" :class="{ 'chevron-open': clientesExpandido[c.id] }" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
                    </svg>
                  </div>
                </td>
              </tr>
              <tr v-if="clientesExpandido[c.id]" class="client-detail-row">
                <td colspan="4">
                  <div class="client-comprobantes">
                    <div v-if="comprobantesDeCliente(c.id).length === 0" class="empty-comprobantes">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m9 14.25 6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z"/>
                      </svg>
                      Este cliente no tiene comprobantes registrados.
                    </div>
                    <div v-else class="comprobante-card" v-for="o in comprobantesDeCliente(c.id)" :key="o.id">
                      <div class="comp-icon">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="m9 14.25 6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z"/>
                        </svg>
                      </div>
                      <div class="comp-info">
                        <span class="comp-title">Comprobante #{{ o.numero }}</span>
                        <span class="comp-date">Fecha: {{ o.fecha }}</span>
                        <span class="comp-status-badge">
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                          </svg>
                          Completada
                        </span>
                      </div>
                      <div class="comp-actions">
                        <button class="action-btn view-btn" title="Ver detalle" @click.stop="verDetalle(o)">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="display:block">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0Z"/>
                          </svg>
                        </button>
                        <button class="action-btn download-btn" title="Descargar PDF" @click.stop="descargarPDF(o)" :disabled="o.descargando">
                          <svg v-if="!o.descargando" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="display:block">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                          </svg>
                          <svg v-else class="spin" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="display:block">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <div v-if="clientesFiltradosOrdenados.length === 0" class="empty-state">
          <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#9ca3af" width="40" height="40">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75s.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"/>
          </svg>
          <p>No se encontraron clientes</p>
        </div>
      </section>

    </main>

    <!-- MODAL DETALLE COMPROBANTE PROFESIONAL -->
    <Transition name="modal">
      <div v-if="ordenSeleccionada" class="modal" @click.self="ordenSeleccionada = null">
        <div class="cp-wrap">
          <div class="cp-head">
            <div class="cp-head-left">
              <div class="cp-logo-circulo">
              <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANgAAADYCAYAAACJIC3tAAAWfmNhQlgAABZ+anVtYgAAAB5qdW1kYzJwYQARABCAAACqADibcQNjMnBhAAAAFlhqdW1iAAAAR2p1bWRjMm1hABEAEIAAAKoAOJtxA3VybjpjMnBhOmIxZGRhYmE3LWUzM2EtNDQ3OC05MzhkLWExNzBhZWZmOTIwNgAAAAOTanVtYgAAAClqdW1kYzJhcwARABCAAACqADibcQNjMnBhLmFzc2VydGlvbnMAAAAAuGp1bWIAAABEanVtZGNib3IAEQAQgAAAqgA4m3ETYzJwYS5pbmdyZWRpZW50LnYzAAAAABhjMnNona1iqCobO0rhIQrI9vn81AAAAGxjYm9yo2lkYzpmb3JtYXRpaW1hZ2UvcG5namluc3RhbmNlSUR4LHhtcDppaWQ6YzRkYTBjMzItNGE0Ny00MGZkLWIzMDUtM2E0ZGFmMTA5MDAybHJlbGF0aW9uc2hpcGhwYXJlbnRPZgAAAeJqdW1iAAAAQWp1bWRjYm9yABEAEIAAAKoAOJtxE2MycGEuYWN0aW9ucy52MgAAAAAYYzJzaBaZ02CbZH+wkC4en6EtNwsAAAGZY2JvcqJnYWN0aW9uc4KiZmFjdGlvbmtjMnBhLm9wZW5lZGpwYXJhbWV0ZXJzoWtpbmdyZWRpZW50c4GiY3VybHgtc2VsZiNqdW1iZj1jMnBhLmFzc2VydGlvbnMvYzJwYS5pbmdyZWRpZW50LnYzZGhhc2hYIDDInesa+scPmupap2QYT/wmvuMbRbMDC7mtvAXIcBWDpGZhY3Rpb254HWNvbS5hbnRocm9waWMuY2xhdWRlLnByb3ZpZGVkanBhcmFtZXRlcnOheB9jb20uYW50aHJvcGljLm9yaWdpbi1jb25maWRlbmNlZ3Vua25vd25rZGVzY3JpcHRpb254ZkNsYXVkZSBwcm92aWRlZCB0aGlzIGZpbGUgYXQgdGhlIHJlcXVlc3Qgb2YgYSB1c2VyIGFuZCBtYXkgaGF2ZSBjcmVhdGVkIG9yIG1vZGlmaWVkIHRoZSBmaWxlIGNvbnRlbnRzLm1zb2Z0d2FyZUFnZW50oWRuYW1lZkNsYXVkZXJhbGxBY3Rpb25zSW5jbHVkZWT1AAAAyGp1bWIAAABAanVtZGNib3IAEQAQgAAAqgA4m3ETYzJwYS5oYXNoLmRhdGEAAAAAGGMyc2h7h80uJcdkgAgsGsGfLUPwAAAAgGNib3KlY2FsZ2ZzaGEyNTZjcGFkTQAAAAAAAAAAAAAAAABkaGFzaFggAJqNaIhx3A+nmcDYgqwCUcoxqOJhRB8T2jFHtg/fw8VkbmFtZW5qdW1iZiBtYW5pZmVzdGpleGNsdXNpb25zgaJlc3RhcnQYIWZsZW5ndGgZFooAAAI+anVtYgAAACdqdW1kYzJjbAARABCAAACqADibcQNjMnBhLmNsYWltLnYyAAAAAg9jYm9ypWNhbGdmc2hhMjU2aXNpZ25hdHVyZXhNc2VsZiNqdW1iZj0vYzJwYS91cm46YzJwYTpiMWRkYWJhNy1lMzNhLTQ0NzgtOTM4ZC1hMTcwYWVmZjkyMDYvYzJwYS5zaWduYXR1cmVqaW5zdGFuY2VJRHgseG1wOmlpZDo5YTg5M2I3MS0yM2M1LTQxMWQtODZiMS0wZTQwZDM1YWEyODByY3JlYXRlZF9hc3NlcnRpb25zg6JjdXJseC1zZWxmI2p1bWJmPWMycGEuYXNzZXJ0aW9ucy9jMnBhLmluZ3JlZGllbnQudjNkaGFzaFggMMid6xr6xw+a6lqnZBhP/Ca+4xtFswMLua28BchwFYOiY3VybHgqc2VsZiNqdW1iZj1jMnBhLmFzc2VydGlvbnMvYzJwYS5hY3Rpb25zLnYyZGhhc2hYIOGy2wysbOBqhWAsWVvDRcviFMk7T7oHTqnp+70IV9B+omN1cmx4KXNlbGYjanVtYmY9YzJwYS5hc3NlcnRpb25zL2MycGEuaGFzaC5kYXRhZGhhc2hYIA80a7q4LIHi7GTSLhd2X/XEVyeBNa6It2foJdwQshUwdGNsYWltX2dlbmVyYXRvcl9pbmZvo2RuYW1lb0FudGhyb3BpYyBGaWxlc2d2ZXJzaW9uZTEuMC4wa3NwZWNWZXJzaW9uZTIuNC4wAAAQOGp1bWIAAAAoanVtZGMyY3MAEQAQgAAAqgA4m3EDYzJwYS5zaWduYXR1cmUAAAAQCGNib3LShFkCEqIBJhghWQIKMIICBjCCAY2gAwIBAgIUQOWgCu7COdC+uIP6BkIFPWdVEwAwCgYIKoZIzj0EAwMwSTEXMBUGA1UEChMOQW50aHJvcGljLCBQQkMxLjAsBgNVBAMTJUFudGhyb3BpYyBDb250ZW50IENyZWRlbnRpYWxzIFJvb3QgQ0EwHhcNMjYwODA3MTg0MzU2WhcNMjgwODA2MTk0MzU2WjBEMRcwFQYDVQQKEw5BbnRocm9waWMsIFBCQzEpMCcGA1UEAxMgQW50aHJvcGljIENsYXVkZSBDb250ZW50IFNpZ25pbmcwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASYegpry1AYBRTVNL1CpTlbROnY3dey+UrsF9C3phYrATN3ZHf93Mo8RQN0KOUuOn19P4oWNFWe5n2/She9N7eTo1gwVjAOBgNVHQ8BAf8EBAMCB4AwFQYDVR0lBA4wDAYKKwYBBAGD6F4CATAMBgNVHRMBAf8EAjAAMB8GA1UdIwQYMBaAFM5R4gSBTmRbI/jjxM+aPpzB11zCMAoGCCqGSM49BAMDA2cAMGQCMDFzHRSeAXrSy1WOzkbhPZ6Km2wGTmZ/2gK18k8BQGXyqz88Rdrz6CTX9flAnYNVxgIwcF9c3fVhqmJKpi+UhasNUMko69cyX6STPfta3Q8EjyzDjzoyrol46FP6VFHhvUcJoWNwYWRZDZ4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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" class="cp-logo-img" alt="Texticode logo" />
              </div>
              <div>
                <div class="cp-empresa-nombre">TEXTICODE</div>
                <div class="cp-empresa-datos">Bogotá, Colombia &nbsp;|&nbsp; texticode@correo.com &nbsp;|&nbsp; +57 300 000 0000</div>
              </div>
            </div>
            <div class="cp-head-right">
              <div class="cp-doc-titulo">COMPROBANTE DE ENTREGA</div>
              <div class="cp-doc-numero">N.° {{ ordenSeleccionada.numero }}</div>
            </div>
          </div>

          <div class="cp-info-row">
            <div class="cp-info-bloque">
              <div class="cp-label">CLIENTE</div>
              <div class="cp-cliente-nombre">{{ ordenSeleccionada.cliente }}</div>
              <div class="cp-valor-sub" v-if="ordenSeleccionada.clienteEmail !== '—'">{{ ordenSeleccionada.clienteEmail }}</div>
              <div class="cp-valor-sub" v-if="ordenSeleccionada.clienteTel !== '—'">Tel: {{ ordenSeleccionada.clienteTel }}</div>
            </div>
            <div class="cp-info-bloque cp-info-bloque--center">
              <div class="cp-label">FECHA DE EMISIÓN</div>
              <div class="cp-valor-grande">{{ fechaHoy }}</div>
              <div class="cp-label" style="margin-top:14px">FECHA DE ENTREGA</div>
              <div class="cp-valor-grande">{{ ordenSeleccionada.fecha }}</div>
            </div>
            <div class="cp-info-bloque cp-info-bloque--right">
              <div class="cp-label">ESTADO DEL PEDIDO</div>
              <div class="cp-estado-caja" :class="ordenSeleccionada.estadoClass">{{ ordenSeleccionada.estado }}</div>
              <div class="cp-label" style="margin-top:14px">ORDEN DE REFERENCIA</div>
              <div class="cp-valor-grande">#{{ ordenSeleccionada.numero }}</div>
            </div>
          </div>

          <table class="cp-tabla">
            <thead>
              <tr>
                <th class="cp-th cp-th--num">#</th>
                <th class="cp-th">Descripción del producto / servicio</th>
                <th class="cp-th cp-th--centro">Cantidad</th>
                <th class="cp-th cp-th--right">Estado entrega</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, i) in ordenSeleccionada.productosList" :key="i" class="cp-tr">
                <td class="cp-td cp-td--num">{{ String(i + 1).padStart(2, '0') }}</td>
                <td class="cp-td">
                  <div class="cp-prod-nombre">{{ p }}</div>
                  <div class="cp-prod-desc" v-if="ordenSeleccionada.descripcion && ordenSeleccionada.descripcion !== p">{{ ordenSeleccionada.descripcion }}</div>
                </td>
                <td class="cp-td cp-td--centro">{{ ordenSeleccionada.cantidad }}</td>
                <td class="cp-td cp-td--right">
                  <span class="cp-entrega-badge" :class="ordenSeleccionada.estadoClass">
                    {{ ordenSeleccionada.estado === 'Completada' ? '✓ Completada' : '⏳ Pendiente' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="cp-linea-simple"></div>

          <div class="cp-bottom">
            <div class="cp-observaciones">
              <div class="cp-label">OBSERVACIONES</div>
              <div class="cp-obs-caja">{{ ordenSeleccionada.observaciones || 'Ninguna observación registrada para este pedido.' }}</div>
            </div>
            <div class="cp-firmas">
              <div class="cp-firma-bloque">
                <div class="cp-firma-linea"></div>
                <div class="cp-firma-nombre">Entregado por</div>
                <div class="cp-firma-cargo">TEXTICODE S.A.S.</div>
              </div>
              <div class="cp-firma-bloque">
                <div class="cp-firma-linea"></div>
                <div class="cp-firma-nombre">Recibido por</div>
                <div class="cp-firma-cargo">{{ ordenSeleccionada.cliente }}</div>
              </div>
            </div>
          </div>

          <div class="cp-pie">
            <span>Documento de uso oficial · TEXTICODE S.A.S.</span>
            <span>Generado el {{ fechaHoy }}</span>
          </div>

          <div class="cp-acciones">
            <button class="btn-secondary" @click="ordenSeleccionada = null">Cerrar</button>
            <button class="btn-primary btn-icon-row" @click="descargarPDF(ordenSeleccionada)" :disabled="ordenSeleccionada.descargando">
              <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
              </svg>
              {{ ordenSeleccionada.descargando ? 'Generando...' : 'Descargar PDF' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- TOAST -->
    <Transition name="toast">
      <div v-if="toastMsg" class="toast">
        <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="16" height="16">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
        </svg>
        {{ toastMsg }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import AppSidebar from '../../components/AppSidebar.vue'
import { getUsuarios, getComprobantes, getOrdenes } from '../../services/api.js'

const busqueda = ref('')
const ordenSeleccionada = ref(null)
const animVisible = ref(false)
const searchFocus = ref(false)
const toastMsg = ref('')
const cargando = ref(true)
const fechaHoy = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })

// Misma lógica que `fechaCorta` en comprobante_model.dart (móvil): d/m/yyyy,
// sin ceros a la izquierda. La web guardaba Fecha_Limite en formato ISO
// (yyyy-mm-dd), con el orden invertido respecto a la móvil.
function formatearFechaCorta(fechaLimite) {
  if (!fechaLimite) return 'Sin fecha'
  const d = new Date(fechaLimite)
  if (isNaN(d.getTime())) return fechaLimite
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`
}

const clientes = ref([])
const ordenes  = ref([])

async function cargarDatos() {
  cargando.value = true
  try {
    const [dataUsuarios, dataOrdenes, dataComprobantes] = await Promise.all([
      getUsuarios(), getOrdenes(), getComprobantes(),
    ])

    clientes.value = dataUsuarios
      .filter(u => (u.Nombre_Rol || u.Rol || '').toLowerCase() === 'cliente' && u.Estado === 'activo')
      .map(u => ({
        id: u.Id_Usuario,
        nombre: u.Nombre_Completo || u.Nombre_Usuario || '',
        email: u.Correo || '',
        telefono: u.Telefono || '—',
        estado: u.Estado === 'activo' ? 'Activo' : 'Inactivo',
        iniciales: (u.Nombre_Completo || u.Nombre_Usuario || '?').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase(),
      }))

    const mapaClientes = {}
    clientes.value.forEach(c => { mapaClientes[c.id] = c })
    const mapaComp = {}
    dataComprobantes.forEach(c => { mapaComp[c.Id_Orden] = c })

    ordenes.value = dataOrdenes
      .filter(o => mapaClientes[o.Id_Cliente])
      .map(o => {
        const comp = mapaComp[o.Id_Orden]
        const estadoComp = comp?.Estado || o.Estado
        const esEntregado = estadoComp === 'Entregado' || o.Estado === 'Completada'
        const clienteInfo = mapaClientes[o.Id_Cliente] || {}
        return {
          id: o.Id_Orden,
          // Número real del comprobante (tabla `comprobantes`), no el de
          // la orden — deben coincidir con el número que muestra la app
          // móvil para el mismo comprobante. Si por algún motivo la orden
          // todavía no tiene comprobante asociado, se cae a un formato
          // distinguible en vez de mostrar un número de orden ambiguo.
          numero: comp
            ? String(comp.Id_Comprobante).padStart(4, '0')
            : `ORD-${String(o.Id_Orden).padStart(4, '0')}`,
          clienteId: o.Id_Cliente,
          cliente: clienteInfo.nombre || `Cliente #${o.Id_Cliente}`,
          clienteEmail: clienteInfo.email || '—',
          clienteTel: clienteInfo.telefono || '—',
          fecha: formatearFechaCorta(o.Fecha_Limite),
          productos: o.Producto || o.Descripcion || '—',
          descripcion: o.Descripcion || o.Producto || '—',
          // Cantidad real del producto en la orden (viene del endpoint de
          // órdenes, que sí expone esta columna a diferencia del endpoint
          // de comprobantes que usa la app móvil — ver comprobante_model.dart).
          cantidad: o.Cantidad || 1,
          observaciones: o.Observaciones || '',
          // Etiqueta igual que en la móvil ("Completada" en vez de
          // "Entregado", ver comprobante_pdf_service.dart → estadoLabel).
          estado: esEntregado ? 'Completada' : 'Pendiente',
          estadoClass: esEntregado ? 'success' : 'danger',
          productosList: [o.Producto || o.Descripcion || '—'],
          flash: false,
          descargando: false,
        }
      })
  } catch (e) {
    console.error('Error cargando datos de clientes:', e)
    clientes.value = []
    ordenes.value = []
  } finally {
    cargando.value = false
  }
}

// ── Ordenamiento ──
const sortKeyClientes = ref('nombre')
const sortDirClientes = ref(1)

function sortClientes(key) {
  sortKeyClientes.value === key ? sortDirClientes.value *= -1 : (sortKeyClientes.value = key, sortDirClientes.value = 1)
}

const clientesFiltradosOrdenados = computed(() => {
  const q = busqueda.value.toLowerCase()
  const lista = clientes.value.filter(c =>
    c.nombre.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
  )
  return [...lista].sort((a, b) => {
    const k = sortKeyClientes.value
    return (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * sortDirClientes.value
  })
})


// ── Desplegable de comprobantes por cliente ──
const clientesExpandido = reactive({})
function toggleCliente(id) {
  clientesExpandido[id] = !clientesExpandido[id]
}
function comprobantesDeCliente(id) {
  return ordenes.value.filter(o => o.clienteId === id && o.estado === 'Completada')
}

const avatarBgPalette = ['#dbeafe','#fce7f3','#d1fae5','#fef3c7','#ede9fe','#fee2e2','#e0f2fe']
const avatarFgPalette = ['#1d4ed8','#9d174d','#065f46','#92400e','#5b21b6','#991b1b','#0369a1']
function avatarBg(iniciales) { return avatarBgPalette[(iniciales?.charCodeAt(0)||0) % avatarBgPalette.length] }
function avatarFg(iniciales) { return avatarFgPalette[(iniciales?.charCodeAt(0)||0) % avatarFgPalette.length] }

function verDetalle(orden) { ordenSeleccionada.value = orden }

function showToast(msg) {
  toastMsg.value = msg
  setTimeout(() => { toastMsg.value = '' }, 3000)
}

// ── DESCARGA PDF REAL ──
async function descargarPDF(orden) {
  orden.descargando = true
  try {
    // Cargar jsPDF si no existe
    if (!window.jspdf) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script')
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
        s.onload = resolve; s.onerror = reject
        document.head.appendChild(s)
      })
    }

    const { jsPDF } = window.jspdf
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const W = doc.internal.pageSize.width
    const ML = 14
    const MR = W - 14

    const AZUL   = [15, 34, 54]
    const BLANCO = [255, 255, 255]
    const GRIS_T = [75, 85, 99]
    const NEGRO  = [17, 24, 39]
    const GRIS_BG= [249, 250, 251]
    const GRIS_LN= [229, 231, 235]

    // Cabecera azul
    doc.setFillColor(...AZUL)
    doc.rect(0, 0, W, 32, 'F')

    // Logo en cabecera PDF - tamaño acorde al encabezado
    const logoB64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANgAAADYCAYAAACJIC3tAAAWfmNhQlgAABZ+anVtYgAAAB5qdW1kYzJwYQARABCAAACqADibcQNjMnBhAAAAFlhqdW1iAAAAR2p1bWRjMm1hABEAEIAAAKoAOJtxA3VybjpjMnBhOmIxZGRhYmE3LWUzM2EtNDQ3OC05MzhkLWExNzBhZWZmOTIwNgAAAAOTanVtYgAAAClqdW1kYzJhcwARABCAAACqADibcQNjMnBhLmFzc2VydGlvbnMAAAAAuGp1bWIAAABEanVtZGNib3IAEQAQgAAAqgA4m3ETYzJwYS5pbmdyZWRpZW50LnYzAAAAABhjMnNona1iqCobO0rhIQrI9vn81AAAAGxjYm9yo2lkYzpmb3JtYXRpaW1hZ2UvcG5namluc3RhbmNlSUR4LHhtcDppaWQ6YzRkYTBjMzItNGE0Ny00MGZkLWIzMDUtM2E0ZGFmMTA5MDAybHJlbGF0aW9uc2hpcGhwYXJlbnRPZgAAAeJqdW1iAAAAQWp1bWRjYm9yABEAEIAAAKoAOJtxE2MycGEuYWN0aW9ucy52MgAAAAAYYzJzaBaZ02CbZH+wkC4en6EtNwsAAAGZY2JvcqJnYWN0aW9uc4KiZmFjdGlvbmtjMnBhLm9wZW5lZGpwYXJhbWV0ZXJzoWtpbmdyZWRpZW50c4GiY3VybHgtc2VsZiNqdW1iZj1jMnBhLmFzc2VydGlvbnMvYzJwYS5pbmdyZWRpZW50LnYzZGhhc2hYIDDInesa+scPmupap2QYT/wmvuMbRbMDC7mtvAXIcBWDpGZhY3Rpb254HWNvbS5hbnRocm9waWMuY2xhdWRlLnByb3ZpZGVkanBhcmFtZXRlcnOheB9jb20uYW50aHJvcGljLm9yaWdpbi1jb25maWRlbmNlZ3Vua25vd25rZGVzY3JpcHRpb254ZkNsYXVkZSBwcm92aWRlZCB0aGlzIGZpbGUgYXQgdGhlIHJlcXVlc3Qgb2YgYSB1c2VyIGFuZCBtYXkgaGF2ZSBjcmVhdGVkIG9yIG1vZGlmaWVkIHRoZSBmaWxlIGNvbnRlbnRzLm1zb2Z0d2FyZUFnZW50oWRuYW1lZkNsYXVkZXJhbGxBY3Rpb25zSW5jbHVkZWT1AAAAyGp1bWIAAABAanVtZGNib3IAEQAQgAAAqgA4m3ETYzJwYS5oYXNoLmRhdGEAAAAAGGMyc2h7h80uJcdkgAgsGsGfLUPwAAAAgGNib3KlY2FsZ2ZzaGEyNTZjcGFkTQAAAAAAAAAAAAAAAABkaGFzaFggAJqNaIhx3A+nmcDYgqwCUcoxqOJhRB8T2jFHtg/fw8VkbmFtZW5qdW1iZiBtYW5pZmVzdGpleGNsdXNpb25zgaJlc3RhcnQYIWZsZW5ndGgZFooAAAI+anVtYgAAACdqdW1kYzJjbAARABCAAACqADibcQNjMnBhLmNsYWltLnYyAAAAAg9jYm9ypWNhbGdmc2hhMjU2aXNpZ25hdHVyZXhNc2VsZiNqdW1iZj0vYzJwYS91cm46YzJwYTpiMWRkYWJhNy1lMzNhLTQ0NzgtOTM4ZC1hMTcwYWVmZjkyMDYvYzJwYS5zaWduYXR1cmVqaW5zdGFuY2VJRHgseG1wOmlpZDo5YTg5M2I3MS0yM2M1LTQxMWQtODZiMS0wZTQwZDM1YWEyODByY3JlYXRlZF9hc3NlcnRpb25zg6JjdXJseC1zZWxmI2p1bWJmPWMycGEuYXNzZXJ0aW9ucy9jMnBhLmluZ3JlZGllbnQudjNkaGFzaFggMMid6xr6xw+a6lqnZBhP/Ca+4xtFswMLua28BchwFYOiY3VybHgqc2VsZiNqdW1iZj1jMnBhLmFzc2VydGlvbnMvYzJwYS5hY3Rpb25zLnYyZGhhc2hYIOGy2wysbOBqhWAsWVvDRcviFMk7T7oHTqnp+70IV9B+omN1cmx4KXNlbGYjanVtYmY9YzJwYS5hc3NlcnRpb25zL2MycGEuaGFzaC5kYXRhZGhhc2hYIA80a7q4LIHi7GTSLhd2X/XEVyeBNa6It2foJdwQshUwdGNsYWltX2dlbmVyYXRvcl9pbmZvo2RuYW1lb0FudGhyb3BpYyBGaWxlc2d2ZXJzaW9uZTEuMC4wa3NwZWNWZXJzaW9uZTIuNC4wAAAQOGp1bWIAAAAoanVtZGMyY3MAEQAQgAAAqgA4m3EDYzJwYS5zaWduYXR1cmUAAAAQCGNib3LShFkCEqIBJhghWQIKMIICBjCCAY2gAwIBAgIUQOWgCu7COdC+uIP6BkIFPWdVEwAwCgYIKoZIzj0EAwMwSTEXMBUGA1UEChMOQW50aHJvcGljLCBQQkMxLjAsBgNVBAMTJUFudGhyb3BpYyBDb250ZW50IENyZWRlbnRpYWxzIFJvb3QgQ0EwHhcNMjYwODA3MTg0MzU2WhcNMjgwODA2MTk0MzU2WjBEMRcwFQYDVQQKEw5BbnRocm9waWMsIFBCQzEpMCcGA1UEAxMgQW50aHJvcGljIENsYXVkZSBDb250ZW50IFNpZ25pbmcwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASYegpry1AYBRTVNL1CpTlbROnY3dey+UrsF9C3phYrATN3ZHf93Mo8RQN0KOUuOn19P4oWNFWe5n2/She9N7eTo1gwVjAOBgNVHQ8BAf8EBAMCB4AwFQYDVR0lBA4wDAYKKwYBBAGD6F4CATAMBgNVHRMBAf8EAjAAMB8GA1UdIwQYMBaAFM5R4gSBTmRbI/jjxM+aPpzB11zCMAoGCCqGSM49BAMDA2cAMGQCMDFzHRSeAXrSy1WOzkbhPZ6Km2wGTmZ/2gK18k8BQGXyqz88Rdrz6CTX9flAnYNVxgIwcF9c3fVhqmJKpi+UhasNUMko69cyX6STPfta3Q8EjyzDjzoyrol46FP6VFHhvUcJoWNwYWRZDZ4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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'
    const logoCX = ML + 10
    const logoCY = 16
    doc.setFillColor(255, 255, 255)
    doc.circle(logoCX, logoCY, 10, 'F')
    doc.addImage(logoB64, 'PNG', logoCX - 7, logoCY - 7, 14, 14)

    doc.setTextColor(...BLANCO)
    doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text('TEXTICODE', ML + 24, 15, { charSpace: 0.7 })
    doc.setFontSize(8); doc.setFont('helvetica', 'normal')
    doc.setTextColor(147, 197, 253)
    doc.text('Bogotá, Colombia  ·  texticode@correo.com  ·  +57 300 000 0000', ML + 24, 22)

    doc.setTextColor(147, 197, 253)
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.text('COMPROBANTE DE ENTREGA', MR, 14, { align: 'right', charSpace: 0.5 })
    doc.setTextColor(...BLANCO)
    doc.setFontSize(20); doc.setFont('helvetica', 'bold')
    doc.text(`N.° ${orden.numero}`, MR, 25, { align: 'right' })

    // Bloque CLIENTE / FECHA DE EMISION / ESTADO DEL PEDIDO en tres columnas iguales
    // (mismo reparto que el grid de 3 columnas 1fr 1fr 1fr que se ve en pantalla)
    const infoW = MR - ML
    const dividerX1 = ML + infoW / 3
    const dividerX2 = ML + (infoW * 2) / 3
    const colPad = 6

    let y = 42
    doc.setFontSize(8); doc.setFont('helvetica', 'bold')
    doc.setTextColor(...GRIS_T)
    doc.text('CLIENTE', ML, y)
    y += 5
    doc.setFontSize(12); doc.setFont('helvetica', 'bold')
    doc.setTextColor(...NEGRO)
    doc.text(orden.cliente, ML, y, { maxWidth: dividerX1 - ML - colPad })
    y += 5
    if (orden.clienteEmail !== '—') {
      doc.setFontSize(9); doc.setFont('helvetica', 'normal')
      doc.setTextColor(...GRIS_T)
      doc.text(orden.clienteEmail, ML, y, { maxWidth: dividerX1 - ML - colPad })
      y += 4
    }
    if (orden.clienteTel !== '—') {
      doc.text('Tel: ' + orden.clienteTel, ML, y)
      y += 4
    }

    // Fechas (columna central)
    const col2X = dividerX1 + colPad
    let y2 = 42
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GRIS_T)
    doc.text('FECHA DE EMISIÓN', col2X, y2)
    y2 += 5
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(...NEGRO)
    doc.text(fechaHoy, col2X, y2)
    y2 += 8
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GRIS_T)
    doc.text('FECHA DE ENTREGA', col2X, y2)
    y2 += 5
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(...NEGRO)
    doc.text(orden.fecha, col2X, y2)

    // Estado + Orden de referencia (columna derecha)
    const col3X = MR
    let y3 = 42
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GRIS_T)
    doc.text('ESTADO DEL PEDIDO', col3X, y3, { align: 'right' })
    y3 += 6
    const esEntregado = orden.estadoClass === 'success'
    const badgeW = 30
    const badgeX = col3X - badgeW
    doc.setFillColor(esEntregado ? 209 : 255, esEntregado ? 250 : 237, esEntregado ? 229 : 213)
    doc.roundedRect(badgeX, y3 - 4.5, badgeW, 7, 1.5, 1.5, 'F')
    doc.setTextColor(esEntregado ? 6 : 146, esEntregado ? 95 : 64, esEntregado ? 70 : 14)
    doc.setFontSize(9); doc.setFont('helvetica', 'bold')
    doc.text(orden.estado, badgeX + badgeW / 2, y3, { align: 'center' })
    y3 += 10
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GRIS_T)
    doc.text('ORDEN DE REFERENCIA', col3X, y3, { align: 'right' })
    y3 += 5
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(...NEGRO)
    doc.text('#' + orden.numero, col3X, y3, { align: 'right' })

    y = Math.max(y, y2, y3) + 10

    // Lineas separadoras verticales entre CLIENTE / FECHA DE EMISION / ESTADO DEL PEDIDO
    // (mismos tercios que el grid de pantalla, cp-info-bloque--center)
    const infoTopY = 37
    doc.setDrawColor(...GRIS_LN); doc.setLineWidth(0.2)
    doc.line(dividerX1, infoTopY, dividerX1, y)
    doc.line(dividerX2, infoTopY, dividerX2, y)

    // Linea separadora (borde inferior del bloque info, igual que en movil)
    doc.setDrawColor(...GRIS_LN); doc.setLineWidth(0.2)
    doc.line(ML, y, MR, y)
    y += 6

    // Encabezado tabla igual que el modal
    const colNumW = 14
    const colEstW = 38
    const colCantW = 28
    const colDescW = MR - ML - colNumW - colCantW - colEstW
    const colX = [ML, ML + colNumW, ML + colNumW + colDescW, ML + colNumW + colDescW + colCantW]
    doc.setFillColor(...AZUL)
    doc.rect(ML, y, MR - ML, 8, 'F')
    doc.setTextColor(...BLANCO); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold')
    doc.text('#', colX[0] + 2, y + 5.5)
    doc.text('DESCRIPCION DEL PRODUCTO / SERVICIO', colX[1] + 2, y + 5.5)
    doc.text('CANTIDAD', colX[2] + colCantW / 2, y + 5.5, { align: 'center' })
    doc.text('ESTADO ENTREGA', colX[3] + colEstW / 2, y + 5.5, { align: 'center' })
    y += 8

    // Filas tabla con descripcion debajo del nombre
    orden.productosList.forEach((prod, i) => {
      const desc = orden.descripcion && orden.descripcion !== prod ? orden.descripcion : null
      const rowH = desc ? 14 : 10
      doc.setFillColor(...BLANCO)
      doc.rect(ML, y, MR - ML, rowH, 'F')
      doc.setTextColor(156, 163, 175); doc.setFontSize(9); doc.setFont('helvetica', 'normal')
      doc.text(String(i + 1).padStart(2, '0'), colX[0] + 2, y + 6.5)
      doc.setTextColor(...NEGRO); doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
      doc.text(prod, colX[1] + 2, y + 6.5, { maxWidth: colDescW - 4 })
      if (desc) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...GRIS_T)
        doc.text(desc, colX[1] + 2, y + 11, { maxWidth: colDescW - 4 })
      }
      doc.setTextColor(...NEGRO); doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
      doc.text(String(orden.cantidad), colX[2] + colCantW / 2, y + 6.5, { align: 'center' })
      const eEnt = orden.estadoClass === 'success'
      const tbadgeW = 28
      const tbadgeX = colX[3] + (colEstW - tbadgeW) / 2
      doc.setFillColor(eEnt ? 209 : 255, eEnt ? 250 : 237, eEnt ? 229 : 213)
      doc.roundedRect(tbadgeX, y + 2.5, tbadgeW, 6, 1, 1, 'F')
      doc.setTextColor(eEnt ? 6 : 146, eEnt ? 95 : 64, eEnt ? 70 : 14)
      doc.setFontSize(8); doc.setFont('helvetica', 'bold')
      doc.text(eEnt ? 'Completada' : 'Pendiente', tbadgeX + tbadgeW / 2, y + 7, { align: 'center' })
      y += rowH
    })

    y += 8

    // Linea divisoria antes de Observaciones/Firmas (igual que en movil)
    doc.setDrawColor(...GRIS_LN); doc.setLineWidth(0.2)
    doc.line(ML, y, MR, y)
    y += 8

    // Firmas: ancho fijo por bloque (110pt ~ 38.8mm) con separacion de 24pt ~ 8.5mm, igual que en movil
    const firmaW = 38.8
    const firmaGap = 8.5
    const firmaX2 = MR - firmaW
    const firmaX1 = firmaX2 - firmaGap - firmaW
    const obsWidth = firmaX1 - firmaGap - ML

    // Observaciones: caja con borde (sin relleno), ancho flexible hasta las firmas, igual que en movil
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GRIS_T)
    doc.text('OBSERVACIONES', ML, y, { charSpace: 0.35 })
    y += 5
    const obsBoxY = y
    const obsBoxH = 18
    doc.setDrawColor(...GRIS_LN); doc.setLineWidth(0.2)
    doc.rect(ML, obsBoxY, obsWidth, obsBoxH, 'S')
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRIS_T); doc.setFontSize(9)
    doc.text(orden.observaciones || 'Ninguna observación registrada para este pedido.', ML + 3, obsBoxY + 5, { maxWidth: obsWidth - 6 })

    // Firmas
    const firmaLineY = obsBoxY + obsBoxH
    doc.setLineWidth(0.4); doc.setDrawColor(55, 65, 81)
    doc.line(firmaX1, firmaLineY, firmaX1 + firmaW, firmaLineY)
    doc.line(firmaX2, firmaLineY, firmaX2 + firmaW, firmaLineY)
    let yFirma = firmaLineY + 4
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRIS_T)
    doc.text('Entregado por', firmaX1 + firmaW / 2, yFirma, { align: 'center' })
    doc.text('Recibido por', firmaX2 + firmaW / 2, yFirma, { align: 'center' })
    yFirma += 4
    doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 34, 54); doc.setFontSize(8.5)
    doc.text('TEXTICODE S.A.S.', firmaX1 + firmaW / 2, yFirma, { align: 'center' })
    doc.text(orden.cliente, firmaX2 + firmaW / 2, yFirma, { align: 'center' })

    y = Math.max(obsBoxY + obsBoxH, yFirma)

    // Pie de página
    const pH = doc.internal.pageSize.height
    doc.setFillColor(...AZUL)
    doc.rect(0, pH - 12, W, 12, 'F')
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(147, 197, 253)
    doc.text('Documento de uso oficial · TEXTICODE S.A.S.', ML, pH - 5)
    doc.text(`Generado el ${fechaHoy}`, MR, pH - 5, { align: 'right' })

    doc.save(`comprobante-${orden.numero}.pdf`)
    showToast(`Comprobante ${orden.numero} descargado correctamente`)
  } catch (err) {
    console.error('Error generando PDF:', err)
    showToast('Error al generar el PDF')
  } finally {
    orden.descargando = false
  }
}

onMounted(async () => {
  await cargarDatos()
  setTimeout(() => {
    animVisible.value = true
  }, 80)
})
</script>

<style scoped>
.layout  { display: flex; min-height: 100vh; background: #f1f5f9; position: relative; overflow: hidden; }
.content { flex: 1; padding: 28px 30px; position: relative; z-index: 1; }

.bg-orbs { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.07; }
.orb-1 { width: 600px; height: 600px; background: #1f3a52; top: -200px; right: -100px; animation: orbDrift1 18s ease-in-out infinite alternate; }
.orb-2 { width: 400px; height: 400px; background: #2563eb; bottom: -100px; left: 10%; animation: orbDrift2 22s ease-in-out infinite alternate; }
.orb-3 { width: 300px; height: 300px; background: #16a34a; top: 40%; right: 5%; animation: orbDrift3 15s ease-in-out infinite alternate; }
@keyframes orbDrift1 { from { transform: translate(0,0) scale(1); } to { transform: translate(-60px,40px) scale(1.1); } }
@keyframes orbDrift2 { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,-50px) scale(1.15); } }
@keyframes orbDrift3 { from { transform: translate(0,0) scale(1); } to { transform: translate(-30px,30px) scale(0.9); } }
.bg-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(31,58,82,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(31,58,82,0.04) 1px, transparent 1px); background-size: 40px 40px; }

/* HERO */
.page-hero { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; opacity: 0; transform: translateY(-16px); transition: opacity 0.5s ease, transform 0.5s ease; }
.page-hero.hero-visible { opacity: 1; transform: translateY(0); }
.hero-left { display: flex; align-items: center; gap: 16px; }
.hero-text { display: flex; flex-direction: column; }
.hero-icon-wrap { position: relative; width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; background: #1f3a52; border-radius: 14px; flex-shrink: 0; }
.hero-icon { width: 26px; height: 26px; color: white; }
.hero-icon-ring { position: absolute; border-radius: 50%; border: 1.5px solid #1f3a52; opacity: 0; animation: iconPulse 3s ease-out infinite; }
.ring-1 { width: 68px; height: 68px; animation-delay: 0s; }
.ring-2 { width: 86px; height: 86px; animation-delay: 0.8s; }
@keyframes iconPulse { 0% { transform: scale(0.7); opacity: 0.5; } 100% { transform: scale(1.4); opacity: 0; } }
.hero-title { font-size: 24px; font-weight: 700; color: #111827; margin: 0; display: flex; flex-wrap: wrap; }
.title-char { display: inline-block; opacity: 0; transform: translateY(12px); animation: charReveal 0.4s ease forwards; }
@keyframes charReveal { to { opacity: 1; transform: translateY(0); } }
.hero-sub { font-size: 13px; color: #6b7280; margin: 4px 0 0 0; }
.hero-search-wrap { flex-shrink: 0; }
.search-box { display: flex; align-items: center; gap: 8px; padding: 9px 14px; background: white; border: 1.5px solid #e5e7eb; border-radius: 10px; transition: border-color 0.2s, box-shadow 0.2s; width: 280px; }
.search-box.search-focus { border-color: #1f3a52; box-shadow: 0 0 0 3px rgba(31,58,82,0.1); }
.search-ico { width: 16px; height: 16px; color: #9ca3af; flex-shrink: 0; }
.search-box input { border: none; outline: none; width: 100%; font-size: 14px; color: #374151; background: transparent; }
.search-box input::placeholder { color: #9ca3af; }

/* TABLE BOX */
.table-box { background: white; border-radius: 14px; border: 1px solid #e5e7eb; margin-bottom: 28px; overflow: hidden; opacity: 0; transform: translateY(16px); transition: opacity 0.45s ease, transform 0.45s ease; }
.box-visible { opacity: 1; transform: translateY(0); }
.table-header-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; background: #f9fafb; }
.table-header-left { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #374151; }
.table-header-left svg { color: #1f3a52; }
.count-badge { background: #1f3a52; color: white; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; line-height: 1.6; }

table { width: 100%; border-collapse: collapse; }
thead { background: #f9fafb; }
th { text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; padding: 13px 18px; white-space: nowrap; }

/* ── SORT ANIMADO ── */
.sortable { cursor: pointer; user-select: none; transition: color 0.15s; }
.sortable:hover { color: #1f3a52; }
.th-inner { display: inline-flex; align-items: center; gap: 6px; }
.sort-arrows { display: inline-flex; align-items: center; transition: all 0.2s ease; }
.sort-neutral { opacity: 0.35; color: #9ca3af; transition: opacity 0.2s, transform 0.2s; }
.sortable:hover .sort-neutral { opacity: 0.55; }
.sort-up, .sort-down { color: #1f3a52; animation: sortIconPop 0.25s cubic-bezier(0.34,1.56,0.64,1) both; }
@keyframes sortIconPop { from { transform: scale(0.6) rotate(-15deg); opacity: 0; } to { transform: scale(1) rotate(0deg); opacity: 1; } }

td { padding: 14px 18px; font-size: 14px; color: #374151; border-top: 1px solid #f1f5f9; }
.table-row { transition: background 0.18s; animation: rowSlideIn 0.35s ease both; }
.table-row:hover td { background: #f8fafc; }
@keyframes rowSlideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
@keyframes rowFlash { 0% { background: #d1fae5; } 100% { background: transparent; } }
.row-flash { animation: rowFlash 1.2s ease; }
.row-enter-active, .row-leave-active { transition: opacity 0.3s ease; }
.row-enter-from, .row-leave-to { opacity: 0; }

/* USER CELL */
.user-cell { display: flex; align-items: center; gap: 10px; }
.avatar-wrap { position: relative; flex-shrink: 0; }
.avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; transition: transform 0.2s; }
.avatar:hover { transform: scale(1.12); }
.avatar-online { position: absolute; bottom: 1px; right: 1px; width: 9px; height: 9px; border-radius: 50%; background: #22c55e; border: 1.5px solid white; }
.user-info { display: flex; flex-direction: column; }
.user-name { font-weight: 600; font-size: 14px; color: #111827; }
.user-handle { font-size: 12px; color: #6b7280; }
.email-td { color: #6b7280; font-size: 13px; }
.phone-cell { display: flex; align-items: center; gap: 6px; color: #374151; }

.badge { padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.success { background: #dcfce7; color: #15803d; }
.danger  { background: #fee2e2; color: #b91c1c; }

/* CLIENTE — DESPLEGABLE DE COMPROBANTES */
.client-row { cursor: pointer; }
.comp-toggle { display: flex; align-items: center; gap: 8px; }
.comp-count-badge { display: inline-flex; align-items: center; gap: 5px; background: #eef2ff; color: #1f3a52; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }
.chevron { color: #9ca3af; transition: transform 0.2s; flex-shrink: 0; }
.chevron-open { transform: rotate(180deg); color: #1f3a52; }

.client-detail-row td { padding: 0 18px 16px; border-top: none; background: #fbfcfe; }
.client-comprobantes { display: flex; flex-direction: column; gap: 8px; padding-top: 4px; }
.empty-comprobantes { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: #f8fafc; border-radius: 12px; color: #9ca3af; font-size: 12px; }

.comprobante-card { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: white; border: 1px solid #eef1f5; border-radius: 12px; }
.comp-icon { width: 36px; height: 36px; border-radius: 50%; background: #eef2ff; color: #1f3a52; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.comp-info { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
.comp-title { font-size: 13px; font-weight: 700; color: #111827; }
.comp-date { font-size: 11px; color: #6b7280; }
.comp-status-badge { display: inline-flex; align-items: center; gap: 4px; width: fit-content; background: #dcfce7; color: #15803d; font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 999px; margin-top: 2px; }
.comp-actions { display: flex; gap: 8px; flex-shrink: 0; }

.order-num-pill { display: inline-block; background: #f1f5f9; color: #1f3a52; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 6px; font-family: 'Courier New', monospace; transition: background 0.15s; }
tr:hover .order-num-pill { background: #e0ecff; color: #2563eb; }

/* ACCIONES */
.actions { display: flex; gap: 8px; align-items: center; }
.action-btn { width: 32px; height: 32px; border-radius: 7px; border: none; background: #1f3a52; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; transition: all 0.15s; -webkit-font-smoothing: antialiased; }
.action-btn svg { pointer-events: none; filter: drop-shadow(0 0 0.3px rgba(255,255,255,0.4)); }
.action-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.view-btn:hover:not(:disabled)     { background: #2d5580; transform: scale(1.07); }
.download-btn:hover:not(:disabled) { background: #1d4ed8; transform: scale(1.07); }

/* EMPTY */
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 44px 0; color: #9ca3af; font-size: 14px; }

/* SPINNER */
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.72s linear infinite; }

/* ══ MODAL COMPROBANTE ══ */
.modal { position: fixed; inset: 0; background: rgba(0,0,0,.45); backdrop-filter: blur(2px); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 20px; }
.cp-wrap { background: #fff; width: 700px; max-width: 100%; max-height: 90vh; overflow-y: auto; border-radius: 4px; box-shadow: 0 8px 40px rgba(0,0,0,.18); font-family: Arial, Helvetica, sans-serif; }
.cp-head { display: flex; justify-content: space-between; align-items: flex-start; padding: 22px 32px; background: #0f2236; }
.cp-head-left { display: flex; align-items: center; gap: 14px; }
.cp-logo-circulo { width: 56px; height: 56px; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cp-logo-img { width: 42px; height: 42px; object-fit: contain; }
.cp-empresa-nombre { font-size: 21px; font-weight: 700; letter-spacing: 2px; color: #fff; font-family: Arial, sans-serif; }
.cp-empresa-datos  { font-size: 11px; color: #93c5fd; margin-top: 3px; font-family: Arial, sans-serif; }
.cp-head-right { text-align: right; }
.cp-doc-titulo { font-size: 12px; font-weight: 400; letter-spacing: 1.5px; color: #93c5fd; font-family: Arial, sans-serif; text-transform: uppercase; }
.cp-doc-numero { font-size: 27px; font-weight: 700; color: #fff; font-family: Arial, sans-serif; margin-top: 4px; }
.cp-linea-simple { border: none; border-top: 1px solid #e5e7eb; margin: 0 32px; }
.cp-info-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0; padding: 22px 32px; border-bottom: 1px solid #e5e7eb; }
.cp-info-bloque { padding-right: 20px; }
.cp-info-bloque--center { border-left: 1px solid #e5e7eb; padding-left: 20px; border-right: 1px solid #e5e7eb; padding-right: 20px; }
.cp-info-bloque--right  { padding-left: 20px; padding-right: 0; }
.cp-label { font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #9ca3af; text-transform: uppercase; font-family: Arial, sans-serif; margin-bottom: 5px; }
.cp-valor-grande { font-size: 13px; font-weight: 400; color: #111827; line-height: 1.4; }
.cp-cliente-nombre { font-size: 16px; font-weight: 700; color: #111827; line-height: 1.4; }
.cp-valor-sub    { font-size: 12px; color: #4b5563; margin-top: 2px; font-family: Arial, sans-serif; }
.cp-estado-caja { display: inline-block; padding: 5px 14px; border-radius: 2px; font-size: 12px; font-weight: 700; font-family: Arial, sans-serif; margin-top: 4px; }
.cp-estado-caja.success { background: #d1fae5; color: #065f46; }
.cp-estado-caja.danger  { background: #ffedd5; color: #92400e; }
.cp-tabla { width: 100%; border-collapse: collapse; margin: 0; }
.cp-th { padding: 10px 12px 10px 32px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; color: #fff; background: #0f2236; text-transform: uppercase; font-family: Arial, sans-serif; text-align: left; }
.cp-th--num { width: 44px; padding-left: 32px; }
.cp-th--centro { text-align: center; }
.cp-th--right { text-align: right; padding-right: 32px; }
.cp-tr { border-bottom: 1px solid #f3f4f6; background: #fff; }
.cp-td { padding: 13px 12px 13px 32px; font-size: 13px; color: #374151; vertical-align: top; }
.cp-td--num    { color: #9ca3af; font-size: 12px; width: 44px; font-family: Arial, sans-serif; }
.cp-td--centro { text-align: center; font-family: Arial, sans-serif; }
.cp-td--right  { text-align: right; padding-right: 32px; }
.cp-prod-nombre { font-weight: 600; color: #111827; }
.cp-prod-desc   { font-size: 11px; color: #4b5563; margin-top: 3px; font-family: Arial, sans-serif; }
.cp-entrega-badge { font-size: 11px; font-weight: 700; font-family: Arial, sans-serif; padding: 4px 13px; border-radius: 2px; }
.cp-entrega-badge.success { background: #d1fae5; color: #065f46; }
.cp-entrega-badge.danger  { background: #ffedd5; color: #92400e; }
.cp-bottom { display: flex; gap: 32px; padding: 22px 32px 28px; }
.cp-observaciones { flex: 1; }
.cp-obs-caja { margin-top: 8px; padding: 13px; border: 1px solid #e5e7eb; font-size: 12px; color: #4b5563; line-height: 1.6; min-height: 64px; font-family: Arial, sans-serif; }
.cp-firmas { display: flex; gap: 28px; align-items: flex-end; flex-shrink: 0; }
.cp-firma-bloque { text-align: center; }
.cp-firma-linea  { width: 147px; border-top: 1px solid #374151; margin-bottom: 6px; }
.cp-firma-nombre { font-size: 11px; color: #4b5563; font-family: Arial, sans-serif; }
.cp-firma-cargo  { font-size: 11px; font-weight: 700; color: #0f2236; font-family: Arial, sans-serif; }
.cp-pie { background: #0f2236; padding: 13px 32px; display: flex; justify-content: space-between; font-size: 11px; color: #93c5fd; font-family: Arial, sans-serif; letter-spacing: .3px; }
.cp-acciones { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 32px; border-top: 1px solid #e5e7eb; background: #f9fafb; }
.btn-primary { background: #1f3b57; color: white; padding: 8px 14px; border-radius: 8px; border: none; cursor: pointer; transition: background .2s; font-size: 14px; }
.btn-primary:hover:not(:disabled) { background: #2d5580; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary { background: #f3f4f6; color: #374151; padding: 8px 14px; border-radius: 8px; border: 1px solid #e5e7eb; cursor: pointer; transition: background .2s; font-size: 14px; }
.btn-secondary:hover { background: #e5e7eb; }
.btn-icon-row { display: flex; align-items: center; gap: 8px; }

/* TOAST */
.toast { position: fixed; bottom: 28px; right: 28px; background: #111827; color: white; padding: 12px 18px; border-radius: 10px; font-size: 14px; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 20px rgba(0,0,0,.2); z-index: 2000; }

/* TRANSITIONS */
.modal-enter-active, .modal-leave-active { transition: opacity 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.toast-enter-active, .toast-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(12px); }
</style>