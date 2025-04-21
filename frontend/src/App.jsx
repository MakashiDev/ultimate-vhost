import { useEffect, useState } from "react";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";

const API_URL = "http://localhost:3000";

function App() {
  const [routes, setRoutes] = useState([]);
  const [hostname, setHostname] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editHostname, setEditHostname] = useState("");
  const [editTargetUrl, setEditTargetUrl] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [serverStats, setServerStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoutes();
    fetchAnalytics();
    fetchServerStats();
    fetchLogs(); // Initial fetch
    const interval = setInterval(() => {
      fetchAnalytics();
      fetchServerStats();
      fetchLogs(); // Fetch logs periodically
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchRoutes() {
    const res = await fetch(`${API_URL}/api/routes`);
    const data = await res.json();
    setRoutes(data);
  }

  async function fetchAnalytics() {
    try {
      const res = await fetch(`${API_URL}/api/analytics`);
      if (res.ok) {
        setAnalytics(await res.json());
      }
    } catch {}
  }

  async function fetchLogs() {
    try {
      const res = await fetch(`${API_URL}/api/logs`);
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch {}
  }

  async function fetchServerStats() {
    try {
      const res = await fetch(`${API_URL}/api/server-stats`);
      if (res.ok) {
        setServerStats(await res.json());
      }
    } catch {}
  }

  async function fetchLogs() {
    try {
      const res = await fetch(`${API_URL}/api/logs`);
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch {}
  }

  async function handleAddRoute(e) {
    e.preventDefault();
    setLoading(true);
    await fetch(`${API_URL}/api/routes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostname, targetUrl })
    });
    setHostname("");
    setTargetUrl("");
    setLoading(false);
    fetchRoutes();
  }

  async function handleDelete(id) {
    setLoading(true);
    await fetch(`${API_URL}/api/routes/${id}`, { method: "DELETE" });
    setLoading(false);
    fetchRoutes();
  }

  function startEdit(route) {
    setEditingId(route.id);
    setEditHostname(route.hostname);
    setEditTargetUrl(route.targetUrl);
  }

  async function handleEditSave(id) {
    setLoading(true);
    await fetch(`${API_URL}/api/routes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostname: editHostname, targetUrl: editTargetUrl })
    });
    setEditingId(null);
    setEditHostname("");
    setEditTargetUrl("");
    setLoading(false);
    fetchRoutes();
  }

  function handleEditCancel() {
    setEditingId(null);
    setEditHostname("");
    setEditTargetUrl("");
  }

  return (
    <div>
      <SignedOut>
        <div className="min-h-screen  flex flex-col items-center justify-center py-12 px-4">
          <div className="flex flex-col gap-4">
            <SignInButton mode="modal" className="bg-gradient-to-r from-[#7dd3fc] to-[#a5b4fc] text-[#18181c] font-bold px-6 py-2 rounded-lg shadow-md hover:from-[#38bdf8] hover:to-[#6366f1] transition-all duration-200" />
            <SignUpButton mode="modal" className="bg-[#23232a] border border-[#29293f] text-white px-6 py-2 rounded-lg hover:bg-[#18181c] transition-all duration-200" />
          </div>
        </div>
      </SignedOut>


    <SignedIn>

    <div className="min-h-screen min-w-screen  bg-gradient-to-br from-[#18181c] via-[#23232a] to-[#18181c] flex flex-col items-center justify-start py-12 px-4">
      <header className="w-full max-w-4xl mb-10 flex flex-col items-center relative">
        <div className="absolute top-0 right-0">
          <UserButton
          baseTheme="light"
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2 drop-shadow-lg">vHost Dashboard</h1>
        <p className="text-lg text-gray-400 font-medium mb-4">Modern Reverse Proxy Manager</p>
        <div className="flex gap-4">
          {serverStats && (
            <div className="bg-[#23232a] rounded-xl px-6 py-3 shadow-lg flex flex-col items-center border border-[#29293f]">
              <span className="text-xs text-gray-500 uppercase tracking-widest">CPU</span>
              <span className="text-xl font-bold text-[#7dd3fc]">{serverStats.cpu}%</span>
            </div>
          )}
          {serverStats && (
            <div className="bg-[#23232a] rounded-xl px-6 py-3 shadow-lg flex flex-col items-center border border-[#29293f]">
              <span className="text-xs text-gray-500 uppercase tracking-widest">Memory</span>
              <span className="text-xl font-bold text-[#a5b4fc]">{serverStats.memory}%</span>
            </div>
          )}
          {analytics && (
            <div className="bg-[#23232a] rounded-xl px-6 py-3 shadow-lg flex flex-col items-center border border-[#29293f]">
              <span className="text-xs text-gray-500 uppercase tracking-widest">Requests</span>
              <span className="text-xl font-bold text-[#f472b6]">{analytics.requests}</span>
            </div>
          )}
        </div>
      </header>
      <main className="w-full max-w-4xl flex flex-col gap-8">
        <section className="bg-[#23232a] rounded-2xl shadow-2xl border border-[#29293f] p-8 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-6 tracking-tight">Add New Route</h2>
          <form onSubmit={handleAddRoute} className="flex flex-col md:flex-row gap-4 items-center">
            <input
              className="bg-[#18181c] border border-[#29293f] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7dd3fc] transition"
              type="text"
              placeholder="Hostname"
              value={hostname}
              onChange={e => setHostname(e.target.value)}
              required
            />
            <input
              className="bg-[#18181c] border border-[#29293f] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a5b4fc] transition"
              type="text"
              placeholder="Target URL"
              value={targetUrl}
              onChange={e => setTargetUrl(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-[#7dd3fc] to-[#a5b4fc] text-[#18181c] font-bold px-6 py-2 rounded-lg shadow-md hover:from-[#38bdf8] hover:to-[#6366f1] transition-all duration-200 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Route"}
            </button>
          </form>
        </section>
        <section className="bg-[#23232a] rounded-2xl shadow-2xl border border-[#29293f] p-8">
          <h2 className="text-2xl font-semibold text-white mb-6 tracking-tight">Routes</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-gray-300">
              <thead>
                <tr className="border-b border-[#29293f]">
                  <th className="py-3 px-4 font-semibold text-gray-400">Hostname</th>
                  <th className="py-3 px-4 font-semibold text-gray-400">Target URL</th>
                  <th className="py-3 px-4 font-semibold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {routes.map(route => (
                  <tr key={route.id} className="hover:bg-[#18181c] transition">
                    <td className="py-3 px-4">
                      {editingId === route.id ? (
                        <input
                          className="bg-[#18181c] border border-[#29293f] rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-[#7dd3fc]"
                          value={editHostname}
                          onChange={e => setEditHostname(e.target.value)}
                        />
                      ) : (
                        <span className="font-medium text-white">{route.hostname}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {editingId === route.id ? (
                        <input
                          className="bg-[#18181c] border border-[#29293f] rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-[#a5b4fc]"
                          value={editTargetUrl}
                          onChange={e => setEditTargetUrl(e.target.value)}
                        />
                      ) : (
                        <span className="text-gray-300">{route.targetUrl}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      {editingId === route.id ? (
                        <>
                          <button
                            className="bg-gradient-to-r from-[#7dd3fc] to-[#a5b4fc] text-[#18181c] font-bold px-4 py-1 rounded shadow hover:from-[#38bdf8] hover:to-[#6366f1] transition-all duration-200"
                            onClick={() => handleEditSave(route.id)}
                            disabled={loading}
                          >Save</button>
                          <button
                            className="bg-[#18181c] border border-[#29293f] text-gray-400 px-4 py-1 rounded hover:bg-[#23232a] transition"
                            onClick={handleEditCancel}
                            disabled={loading}
                          >Cancel</button>
                        </>
                      ) : (
                        <>
                          <button
                            className="bg-[#23232a] border border-[#29293f] text-[#7dd3fc] px-4 py-1 rounded hover:bg-[#18181c] hover:text-[#38bdf8] transition"
                            onClick={() => startEdit(route)}
                            disabled={loading}
                          >Edit</button>
                          <button
                            className="bg-gradient-to-r from-[#f472b6] to-[#a5b4fc] text-[#18181c] font-bold px-4 py-1 rounded shadow hover:from-[#be185d] hover:to-[#6366f1] transition-all duration-200"
                            onClick={() => handleDelete(route.id)}
                            disabled={loading}
                          >Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-[#23232a] rounded-2xl shadow-2xl border border-[#29293f] p-8">
          <h2 className="text-2xl font-semibold text-white mb-6 tracking-tight">Server Logs</h2>
          <div className="bg-[#18181c] rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm text-gray-400 border border-[#29293f]">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <p key={index} className="whitespace-pre-wrap break-words">{log}</p>
              ))
            ) : (
              <p>No logs available.</p>
            )}
          </div>
        </section>

      </main>
      <footer className="mt-12 text-gray-500 text-sm opacity-70">
        &copy; {new Date().getFullYear()} vHost. Crafted with <span className="text-[#f472b6]">♥</span> for modern infrastructure.
      </footer>
    </div>
    </SignedIn>
    </div>
  );
}

export default App;
