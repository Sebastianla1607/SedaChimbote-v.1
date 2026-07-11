const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'frontend/src/pages/admin/Dashboard.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Fix techs map
content = content.replace(/techs\.map\(tech => \(/g, 'filteredTechs.map(tech => (');
content = content.replace(/techs\.length === 0/g, 'filteredTechs.length === 0');

// 2. Add pagination for Admins
const adminPagination = `
                  </table>
                </div>

                {Math.ceil(filteredAdmins.length / ITEMS_PER_PAGE) > 1 && (
                  <div className="flex items-center justify-between mt-4 px-4 py-2 border-t border-slate-800/80">
                    <p className="text-xs text-slate-500 font-medium">Mostrando {(adminsPage - 1) * ITEMS_PER_PAGE + 1} a {Math.min(adminsPage * ITEMS_PER_PAGE, filteredAdmins.length)} de {filteredAdmins.length}</p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setAdminsPage(p => Math.max(1, p - 1))} disabled={adminsPage === 1}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 disabled:opacity-50 hover:bg-slate-800 hover:text-white transition">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-bold text-white px-2">{adminsPage} / {Math.ceil(filteredAdmins.length / ITEMS_PER_PAGE)}</span>
                      <button onClick={() => setAdminsPage(p => Math.min(Math.ceil(filteredAdmins.length / ITEMS_PER_PAGE), p + 1))} disabled={adminsPage === Math.ceil(filteredAdmins.length / ITEMS_PER_PAGE)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 disabled:opacity-50 hover:bg-slate-800 hover:text-white transition">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
`;
content = content.replace(/\s*<\/table>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}\s*\{\/\* TAB CLIENTES \*\/\}/, '\n' + adminPagination + '\n            </div>\n          )}\n\n          {/* TAB CLIENTES */}');


// 3. Fix Clients slice and pagination
content = content.replace(/\{filteredClients\.map\(client => \(/g, '{filteredClients.slice((clientsPage - 1) * ITEMS_PER_PAGE, clientsPage * ITEMS_PER_PAGE).map(client => (');

const clientPagination = `
              </table>
              
              {Math.ceil(filteredClients.length / ITEMS_PER_PAGE) > 1 && (
                <div className="flex items-center justify-between mt-4 px-4 py-2 border-t border-slate-800/80">
                  <p className="text-xs text-slate-500 font-medium">Mostrando {(clientsPage - 1) * ITEMS_PER_PAGE + 1} a {Math.min(clientsPage * ITEMS_PER_PAGE, filteredClients.length)} de {filteredClients.length}</p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setClientsPage(p => Math.max(1, p - 1))} disabled={clientsPage === 1}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 disabled:opacity-50 hover:bg-slate-800 hover:text-white transition">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-white px-2">{clientsPage} / {Math.ceil(filteredClients.length / ITEMS_PER_PAGE)}</span>
                    <button onClick={() => setClientsPage(p => Math.min(Math.ceil(filteredClients.length / ITEMS_PER_PAGE), p + 1))} disabled={clientsPage === Math.ceil(filteredClients.length / ITEMS_PER_PAGE)}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 disabled:opacity-50 hover:bg-slate-800 hover:text-white transition">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
`;
content = content.replace(/\s*<\/table>\s*<\/div>\s*\)\}\s*<\/div>\s*<\/div>\s*\)\n\}/, '\n' + clientPagination + '\n          )}\n        </div>\n      </div>\n  )\n}');


fs.writeFileSync(file, content, 'utf8');
console.log('Pagination patched!');
