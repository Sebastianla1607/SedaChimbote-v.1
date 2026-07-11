const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'frontend/src/pages/admin/Dashboard.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Replace techSearch with searchTerm
content = content.replace(/const \[techSearch, setTechSearch\] = useState\(''\)/g, "const [searchTerm, setSearchTerm] = useState('')");

// 2. Add filtered variables
const filterLogic = `
  const filteredTechs = techs.filter(t =>
    t.is_active && (
      searchTerm === '' ||
      t.access_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.last_name_pat?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const filteredClients = clients.filter(c => 
    searchTerm === '' ||
    c.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.last_name_pat?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredAdmins = admins.filter(a => 
    a.role === 'ADM_' && (
      searchTerm === '' ||
      a.access_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.first_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )
`;
content = content.replace(/const filteredTechs = techs\.filter\([\s\S]*?\)\s*\)/, filterLogic.trim());

// 3. Update sortedTickets to include searchTerm
const sortedTicketsLogic = `const sortedTickets = [...tickets]
    .filter(t => {
      if (filterStatus && t.status !== filterStatus) return false
      if (filterPriority && t.priority !== filterPriority) return false
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (!t.code?.toLowerCase().includes(q) &&
            !t.description?.toLowerCase().includes(q) &&
            !t.assigned_esp?.first_name?.toLowerCase().includes(q) &&
            !t.customer?.first_name?.toLowerCase().includes(q)) {
          return false
        }
      }
      return true
    })`;
content = content.replace(/const sortedTickets = \[\.\.\.tickets\]\s*\.filter\(t => \{[\s\S]*?return true\s*\}\)/, sortedTicketsLogic);

// 4. Update the map calls
content = content.replace(/\{clients\.map\(/g, '{filteredClients.map(');
content = content.replace(/\{admins\.slice/g, '{filteredAdmins.slice');
content = content.replace(/Total: \{admins\.length\}/g, 'Total: {filteredAdmins.length}');
content = content.replace(/Total: \{clients\.length\}/g, 'Total: {filteredClients.length}');

// 5. Add search bar to topbar (around line 330)
const searchInput = `
            {tab !== 'stats' && (
              <div className="flex relative">
                <input 
                  type="text" 
                  value={searchTerm} 
                  onChange={(e) => { setSearchTerm(e.target.value); setTicketsPage(1); setClientsPage(1); setAdminsPage(1) }} 
                  placeholder={"Buscar " + tab + "..."}
                  className="bg-slate-900/60 border border-slate-700/50 rounded-full px-4 py-1.5 md:py-2 text-xs md:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-32 md:w-64 shadow-inner placeholder:text-slate-500 transition-all focus:w-40 md:focus:w-80"
                />
                {(searchTerm) && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
`;
// Insert before action buttons
content = content.replace(/<div className="flex items-center gap-2 md:gap-3">/, '<div className="flex items-center gap-2 md:gap-3">\n' + searchInput);

// Reset searchTerm on tab change
content = content.replace(/setTab\(item\.id\); setIsSidebarOpen\(false\)/g, "setTab(item.id); setIsSidebarOpen(false); setSearchTerm('')");

fs.writeFileSync(file, content, 'utf8');
console.log('Dashboard patched!');
