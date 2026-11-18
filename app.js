let currentUser = { email: '', role: 'Administrador' };

let assets = JSON.parse(localStorage.getItem('nexotech_assets')) || [
    { id: 'ACT-001', type: 'Notebook', model: 'Lenovo ThinkPad T14', user: 'Guillermo Vargas', location: 'Oficina Central', status: 'Activo' },
    { id: 'ACT-002', type: 'Monitor', model: 'Dell U2415H', user: 'Amaro Vargas', location: 'Bodega', status: 'Activo' },
    { id: 'ACT-003', type: 'Impresora', model: 'HP LaserJet Pro', user: 'Brian León', location: 'Oficina Central', status: 'Activo' }
];

let movements = JSON.parse(localStorage.getItem('nexotech_movements')) || [
    'Sistema inicializado con 3 activos base registrados.',
    'Última sincronización de inventario realizada con éxito.'
];

function handleLogin(event) {
    event.preventDefault();
    currentUser.email = document.getElementById('loginEmail').value;
    currentUser.role = document.getElementById('loginRole').value;

    document.getElementById('userNameDisplay').innerText = currentUser.email;
    document.getElementById('userRoleBadge').innerText = currentUser.role;

    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appScreen').classList.remove('hidden');

    // Restricciones según rol
    if (currentUser.role === 'Usuario Operativo') {
        const btnAdd = document.getElementById('btnAddAsset');
        if (btnAdd) btnAdd.style.display = 'none';
    }

    switchView('dashboard');
}

function handleLogout() {
    document.getElementById('appScreen').classList.add('hidden');
    document.getElementById('loginScreen').classList.add('hidden');
    // Muestra login
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('loginForm').reset();
}

function switchView(viewName) {
    // Oculta todas las vistas
    const views = ['dashboard', 'activos', 'inventario', 'movimientos', 'reportes'];
    views.forEach(v => {
        document.getElementById(`view-${v}`).classList.add('hidden');
        const menuEl = document.getElementById(`menu-${v}`);
        if (menuEl) menuEl.classList.remove('active');
    });

    // Muestra la vista seleccionada
    document.getElementById(`view-${viewName}`).classList.remove('hidden');
    document.getElementById(`menu-${viewName}`).classList.add('active');

    // Cambiar título superior
    const titles = {
        dashboard: 'Panel de Control General',
        activos: 'Gestión Completa de Activos',
        inventario: 'Control de Inventario en Bodega',
        movimientos: 'Historial de Movimientos y Trazabilidad',
        reportes: 'Reportes y Estadísticas del Sistema'
    };
    document.getElementById('viewTitle').innerText = titles[viewName];

    renderAllData();
}

function renderAllData() {
    renderAssetsTable('assetsTableBody', assets.slice(0, 5));
    renderAssetsTable('fullAssetsTableBody', assets);
    
    // Inventario bodega
    const invBody = document.getElementById('inventoryTableBody');
    invBody.innerHTML = '';
    assets.filter(a => a.location === 'Bodega').forEach(item => {
        invBody.innerHTML += `
            <tr>
                <td><strong>${item.id}</strong></td>
                <td>${item.type}</td>
                <td>${item.model}</td>
                <td><span class="status-badge status-active">En Bodega</span></td>
            </tr>
        `;
    });

    // Movimientos
    const movList = document.getElementById('movementList');
    movList.innerHTML = '';
    movements.forEach(m => {
        movList.innerHTML += `<li><span class="material-icons" style="font-size:14px; vertical-align:middle; color:#2563eb;">history</span> ${m}</li>`;
    });

    // Reportes
    document.getElementById('repTotal').innerText = assets.length;
    document.getElementById('repOperativos').innerText = assets.filter(a => a.status === 'Activo').length;
    document.getElementById('repBodega').innerText = assets.filter(a => a.location === 'Bodega').length;
    document.getElementById('repBaja').innerText = assets.filter(a => a.status === 'Dado de baja').length;

    updateStats();
}

function renderAssetsTable(elementId, dataArray) {
    const tbody = document.getElementById(elementId);
    if (!tbody) return;
    tbody.innerHTML = '';

    dataArray.forEach((asset) => {
        const originalIndex = assets.findIndex(a => a.id === asset.id);
        const canDelete = currentUser.role !== 'Usuario Operativo';

        tbody.innerHTML += `
            <tr>
                <td><strong>${asset.id}</strong></td>
                <td>${asset.type}</td>
                <td>${asset.model}</td>
                <td>${asset.user}</td>
                <td>${asset.location}</td>
                <td><span class="status-badge ${asset.status === 'Activo' ? 'status-active' : 'status-inactive'}">${asset.status}</span></td>
                <td>
                    ${asset.status === 'Activo' && canDelete ? `<button onclick="registerBaja(${originalIndex})" class="btn-danger">Registrar Baja</button>` : '<em>N/D</em>'}
                </td>
            </tr>
        `;
    });
}

function openModal() {
    document.getElementById('assetModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('assetModal').classList.add('hidden');
}

function saveAsset(event) {
    event.preventDefault();
    const type = document.getElementById('assetType').value;
    const model = document.getElementById('assetModel').value;
    const user = document.getElementById('assetUser').value;
    const location = document.getElementById('assetLocation').value;

    const newId = 'ACT-' + String(assets.length + 1).padStart(3, '0');

    const newAsset = {
        id: newId,
        type: type,
        model: model,
        user: user,
        location: location,
        status: 'Activo'
    };

    assets.push(newAsset);
    movements.unshift(`Alta de nuevo activo ${newId} (${type} - ${model}) por ${currentUser.email}`);
    
    localStorage.setItem('nexotech_assets', JSON.stringify(assets));
    localStorage.setItem('nexotech_movements', JSON.stringify(movements));
    
    closeModal();
    renderAllData();
    document.getElementById('assetForm').reset();
}

function registerBaja(index) {
    if (confirm('¿Está seguro de registrar la baja formal de este activo tecnológico (RF-03)?')) {
        const assetId = assets[index].id;
        assets[index].status = 'Dado de baja';
        assets[index].location = 'Fuera de servicio';
        
        movements.unshift(`Registro de baja formal para el activo ${assetId} realizado por ${currentUser.email}`);
        
        localStorage.setItem('nexotech_assets', JSON.stringify(assets));
        localStorage.setItem('nexotech_movements', JSON.stringify(movements));
        renderAllData();
    }
}

function updateStats() {
    document.getElementById('statTotal').innerText = assets.length;
    document.getElementById('statEnUso').innerText = assets.filter(a => a.status === 'Activo').length;
    document.getElementById('statBodega').innerText = assets.filter(a => a.location === 'Bodega').length;
    document.getElementById('statBaja').innerText = assets.filter(a => a.status === 'Dado de baja').length;
}
